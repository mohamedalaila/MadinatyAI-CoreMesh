import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { NotificationChannel, NotificationPayload } from './notification-channel.interface';

/**
 * WAHA-backed WhatsApp notification channel.
 *
 * Sends transactional WhatsApp text messages via a self-hosted WAHA instance.
 * Falls back silently on transient errors so business logic is never blocked.
 */
@Injectable()
export class WhatsAppChannel implements NotificationChannel {
  readonly name = 'whatsapp';
  private readonly logger = new Logger(WhatsAppChannel.name);

  constructor(private readonly config: ConfigService) {}

  isAvailable(): boolean {
    const baseUrl = this.config.get<string>('waha.baseUrl');
    const apiKey = this.config.get<string>('waha.apiKey');
    return Boolean(baseUrl && apiKey);
  }

  async send(payload: NotificationPayload): Promise<void> {
    const baseUrl = this.config.get<string>('waha.baseUrl');
    const apiKey = this.config.get<string>('waha.apiKey');
    const session = this.config.get<string>('waha.session') ?? 'default';

    if (!baseUrl || !apiKey || !payload.recipientPhone) {
      this.logger.debug('WhatsApp channel unavailable or missing phone — skipping');
      return;
    }

    const chatId = this.toChatId(payload.recipientPhone);

    try {
      await axios.post(
        `${baseUrl}/api/sendText`,
        {
          session,
          chatId,
          text: `${payload.title}\n\n${payload.body}`,
        },
        {
          headers: {
            'X-Api-Key': apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 10_000,
        },
      );
      this.logger.log(`WhatsApp sent to ${this.maskPhone(payload.recipientPhone)}: ${payload.title}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`WhatsApp delivery failed for ${this.maskPhone(payload.recipientPhone)}: ${msg}`);
    }
  }

  private toChatId(phoneNumber: string): string {
    const digits = phoneNumber.replace(/\D/g, '');
    return `${digits}@c.us`;
  }

  private maskPhone(phoneNumber: string): string {
    if (phoneNumber.length <= 4) return '****';
    return `${phoneNumber.slice(0, 3)}****${phoneNumber.slice(-2)}`;
  }
}
