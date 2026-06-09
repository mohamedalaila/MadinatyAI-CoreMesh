import { Injectable, Logger } from '@nestjs/common';
import type { NotificationChannel, NotificationPayload } from './notification-channel.interface';

/**
 * Routes notifications to all available off-app channels.
 *
 * Usage:
 *   await this.dispatcher.broadcast({
 *     recipientId: userId,
 *     recipientPhone: '+20101...',
 *     title: 'New offer!',
 *     body: 'Someone offered 500 EGP on your listing.',
 *   });
 *
 * Channels that are not configured or fail transiently are silently skipped.
 */
@Injectable()
export class NotificationDispatcher {
  private readonly logger = new Logger(NotificationDispatcher.name);

  constructor(private readonly channels: NotificationChannel[]) {}

  async broadcast(payload: NotificationPayload): Promise<void> {
    const available = this.channels.filter((c) => c.isAvailable());
    if (available.length === 0) {
      this.logger.debug('No notification channels available — skipping broadcast');
      return;
    }

    await Promise.allSettled(
      available.map(async (channel) => {
        try {
          await channel.send(payload);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(`Channel ${channel.name} failed: ${msg}`);
        }
      }),
    );
  }
}
