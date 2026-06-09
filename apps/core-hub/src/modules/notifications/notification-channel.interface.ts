export interface NotificationPayload {
  recipientId: string;
  recipientPhone?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Abstract channel for off-app notifications (WhatsApp, FCM, SMS, etc.).
 * Every channel implementation MUST be fire-and-forget: it should never throw
 * on transient delivery failures — only log and move on.
 */
export interface NotificationChannel {
  readonly name: string;

  /** Returns true if this channel is configured and ready to send. */
  isAvailable(): boolean;

  /** Send the notification. Must not throw on transient errors. */
  send(payload: NotificationPayload): Promise<void>;
}

export const NOTIFICATION_CHANNELS = Symbol('NOTIFICATION_CHANNELS');
