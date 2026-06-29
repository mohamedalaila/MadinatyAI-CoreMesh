import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WahaClient } from './waha.client';
import type { NotificationChannel, NotificationPayload } from './notification-channel.interface';

/**
 * WAHA-backed WhatsApp notification channel.
 *
 * Sends transactional WhatsApp text messages via a self-hosted WAHA instance.
 * Falls back silently on transient errors so business logic is never blocked.
 *
 * Delegates HTTP/phone logic to the shared {@link WahaClient}.
 */
@Injectable()
export class WhatsAppChannel implements NotificationChannel {
  readonly name = 'whatsapp';
  private readonly logger = new Logger(WhatsAppChannel.name);
  private readonly waha: WahaClient;

  constructor(config: ConfigService) {
    this.waha = new WahaClient(config);
  }

  isAvailable(): boolean {
    return this.waha.isAvailable();
  }

  async send(payload: NotificationPayload): Promise<void> {
    if (!payload.recipientPhone) {
      this.logger.debug('WhatsApp channel missing recipient phone — skipping');
      return;
    }

    const text = `${payload.title}\n\n${payload.body}`;
    const ok = await this.waha.sendText(payload.recipientPhone, text);
    if (ok) {
      this.logger.log(
        `WhatsApp sent to ${this.waha.maskPhone(payload.recipientPhone)}: ${payload.title}`,
      );
    }
  }
}
