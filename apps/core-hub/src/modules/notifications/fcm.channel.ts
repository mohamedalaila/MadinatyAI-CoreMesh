import { Injectable, Logger } from '@nestjs/common';
import type { NotificationChannel, NotificationPayload } from './notification-channel.interface';

/**
 * Firebase Cloud Messaging (FCM) notification channel — READY stub.
 *
 * Implement `send()` by integrating `firebase-admin` when push notifications
 * are needed. Until then, `isAvailable()` returns false and `send()` is a no-op.
 *
 * To activate:
 *   1. Add `firebase-admin` to dependencies.
 *   2. Add `FCM_SERVICE_ACCOUNT_JSON` env var (base64-encoded service account key).
 *   3. Implement `send()` using `admin.messaging().send()`.
 */
@Injectable()
export class FcmChannel implements NotificationChannel {
  readonly name = 'fcm';
  private readonly logger = new Logger(FcmChannel.name);

  isAvailable(): boolean {
    // FCM is not yet configured — returns false so the dispatcher skips it.
    return false;
  }

  async send(payload: NotificationPayload): Promise<void> {
    // No-op in v1. Replace with real FCM send logic when push notifications
    // are required (mobile app, PWA, etc.).
    this.logger.debug(`FCM send called for ${payload.recipientId} — not yet implemented`);
  }
}
