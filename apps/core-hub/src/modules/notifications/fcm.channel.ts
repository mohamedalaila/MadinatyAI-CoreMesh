import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { PrismaService } from '@madinatyai/prisma';
import type { NotificationChannel, NotificationPayload } from './notification-channel.interface';

/**
 * Firebase Cloud Messaging (FCM) notification channel.
 *
 * Sends push notifications to registered device tokens via `firebase-admin`.
 * Requires `FCM_SERVICE_ACCOUNT_JSON` env var (base64-encoded service account key).
 *
 * Token lookup: queries `PushDeviceToken` rows for the recipient userId and
 * sends a multicast message to all active tokens. Tokens that FCM rejects
 * (UNREGISTERED / INVALID_REGISTRATION) are automatically deactivated.
 */
@Injectable()
export class FcmChannel implements NotificationChannel, OnModuleInit {
  readonly name = 'fcm';
  private readonly logger = new Logger(FcmChannel.name);
  private app: admin.app.App | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    const raw = this.config.get<string>('fcm.serviceAccountJson') ?? '';
    if (!raw) {
      this.logger.debug('FCM_SERVICE_ACCOUNT_JSON not set — FCM channel disabled');
      return;
    }

    try {
      const decoded = Buffer.from(raw, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(decoded) as admin.ServiceAccount;
      this.app = admin.initializeApp(
        { credential: admin.credential.cert(serviceAccount) },
        'core-hub-fcm',
      );
      this.logger.log('FCM initialised — push notifications enabled');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to initialise FCM: ${msg}`);
    }
  }

  isAvailable(): boolean {
    return this.app !== null;
  }

  async send(payload: NotificationPayload): Promise<void> {
    if (!this.app) return;

    try {
      const tokens = await this.prisma.pushDeviceToken.findMany({
        where: { userId: payload.recipientId, isActive: true },
        select: { id: true, token: true },
      });

      if (tokens.length === 0) {
        this.logger.debug(`No active FCM tokens for user ${payload.recipientId} — skipping`);
        return;
      }

      const message: admin.messaging.MulticastMessage = {
        tokens: tokens.map((t) => t.token),
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data as Record<string, string>,
      };

      const response = await admin.messaging(this.app).sendEachForMulticast(message);
      const failedCount = response.failureCount;

      if (failedCount > 0) {
        const staleTokenIds: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            const code = resp.error.code;
            // FCM error codes for invalid/unregistered tokens
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token'
            ) {
              staleTokenIds.push(tokens[idx].id);
            }
          }
        });

        if (staleTokenIds.length > 0) {
          await this.prisma.pushDeviceToken.updateMany({
            where: { id: { in: staleTokenIds } },
            data: { isActive: false },
          });
          this.logger.debug(`Deactivated ${staleTokenIds.length} stale FCM tokens`);
        }
      }

      this.logger.debug(
        `FCM sent to ${response.successCount}/${tokens.length} devices for user ${payload.recipientId}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`FCM send failed for user ${payload.recipientId}: ${msg}`);
    }
  }
}
