import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface OfferNotificationPayload {
  type: 'OFFER_CREATED' | 'OFFER_ACCEPTED' | 'OFFER_DECLINED' | 'OFFER_COUNTERED' | 'OFFER_WITHDRAWN';
  recipientPhone: string;
  listingTitle: string;
  offerAmount: number;
  counterAmount?: number;
  listingUrl?: string;
}

/**
 * WAHA (WhatsApp HTTP API) notification service.
 *
 * Sends transactional WhatsApp messages for marketplace events
 * (offers, acceptances, counters, etc.) using a self-hosted WAHA instance.
 *
 * Falls back silently to logging on transient errors so business logic
 * is never blocked by a flaky WhatsApp connection.
 *
 * Requires env vars:
 *   WAHA_BASE_URL  - e.g. https://waha.xee.run.place
 *   WAHA_API_KEY   - API key for the WAHA instance
 *   WAHA_SESSION   - session name (default: "default")
 */
@Injectable()
export class WahaNotificationService {
  private readonly logger = new Logger(WahaNotificationService.name);

  constructor(private readonly config: ConfigService) {}

  async sendOfferNotification(payload: OfferNotificationPayload): Promise<void> {
    const baseUrl = this.config.get<string>('waha.baseUrl');
    const apiKey = this.config.get<string>('waha.apiKey');
    const session = this.config.get<string>('waha.session') ?? 'default';

    if (!baseUrl || !apiKey) {
      this.logger.debug(
        `WAHA not configured — skipping ${payload.type} notification to ${this.maskPhone(payload.recipientPhone)}`,
      );
      return;
    }

    const chatId = this.toChatId(payload.recipientPhone);
    const text = this.buildMessage(payload);

    try {
      await axios.post(
        `${baseUrl}/api/sendText`,
        { session, chatId, text },
        {
          headers: {
            'X-Api-Key': apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 10_000,
        },
      );
      this.logger.log(
        `${payload.type} notification sent via WAHA to ${this.maskPhone(payload.recipientPhone)}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `WAHA notification failed (${payload.type}) for ${this.maskPhone(payload.recipientPhone)}: ${msg}`,
      );
    }
  }

  private buildMessage(p: OfferNotificationPayload): string {
    const title = p.listingTitle ?? 'إعلانك';
    const amount = `${p.offerAmount.toLocaleString('ar-EG')} ج.م`;

    switch (p.type) {
      case 'OFFER_CREATED':
        return `📬 *عروض جديدة!*\n\nفي حد عرض على إعلانك: *"${title}"*\nالمبلغ المقترح: *${amount}*\n\nادخل على Souk ElKanto عشان تردّ.\n\nSomeone offered on your listing: "${title}" for ${p.offerAmount.toLocaleString('en-US')} EGP.`;

      case 'OFFER_ACCEPTED':
        return `✅ *تمّ القبول!*\n\nصاحب الإعلان "${title}" وافق على عرضك بـ *${amount}*.\n\nادخل على Souk ElKanto عشان تتابع التسليم.\n\nYour offer on "${title}" was accepted for ${p.offerAmount.toLocaleString('en-US')} EGP.`;

      case 'OFFER_DECLINED':
        return `❌ *تمّ الرّفض*\n\nصاحب الإعلان "${title}" رفض عرضك بـ *${amount}*.\n\nممكن تدور على إعلان تاني أو تعرض سعر مختلف.\n\nYour offer on "${title}" was declined.`;

      case 'OFFER_COUNTERED': {
        const counter = `${(p.counterAmount ?? p.offerAmount).toLocaleString('ar-EG')} ج.م`;
        return `🔄 *مفاوضات*\n\nصاحب الإعلان "${title}" ردّ بسعر جديد: *${counter}* (كان عرضك *${amount}*).\n\nادخل على Souk ElKanto عشان توافق أو تفاوض تاني.\n\nSeller countered on "${title}" with ${(p.counterAmount ?? p.offerAmount).toLocaleString('en-US')} EGP.`;
      }

      case 'OFFER_WITHDRAWN':
        return `🚫 *العرض اتسحب*\n\nحد سحب عرضه على إعلانك "${title}".\n\nYour listing "${title}" had an offer withdrawn.`;

      default:
        return `🔔 إشعار من Souk ElKanto regarding "${title}".`;
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
