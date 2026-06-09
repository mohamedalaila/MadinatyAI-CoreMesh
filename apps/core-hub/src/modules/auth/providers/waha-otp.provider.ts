import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { OtpDeliveryProvider } from './otp-delivery.provider';

/**
 * WAHA (WhatsApp HTTP API) OTP delivery provider.
 *
 * Sends OTP codes via WhatsApp message using a self-hosted WAHA instance.
 * Falls back silently to console logging on transient errors so OTP verification
 * isn't blocked by a flaky WhatsApp connection.
 *
 * Requires env vars:
 *   WAHA_BASE_URL  - e.g. https://waha.xee.run.place
 *   WAHA_API_KEY   - API key for the WAHA instance
 *   WAHA_SESSION   - session name (default: "default")
 */
@Injectable()
export class WahaOtpDeliveryProvider implements OtpDeliveryProvider {
  private readonly logger = new Logger(WahaOtpDeliveryProvider.name);

  constructor(private readonly config: ConfigService) {}

  async send(phoneNumber: string, code: string): Promise<void> {
    const baseUrl = this.config.get<string>('waha.baseUrl');
    const apiKey = this.config.get<string>('waha.apiKey');
    const session = this.config.get<string>('waha.session') ?? 'default';

    if (!baseUrl || !apiKey) {
      this.logger.warn(
        'WAHA not configured (WAHA_BASE_URL or WAHA_API_KEY missing). ' +
          'OTP will NOT be delivered via WhatsApp.',
      );
      return;
    }

    const chatId = this.toChatId(phoneNumber);
    const text = `🔐 رمز التحقق بتاعك: *${code}*\n\nاستخدمه في Souk ElKanto خلال 5 دقايق.\n\nYour verification code: *${code}*\nValid for 5 minutes.`;

    try {
      await axios.post(
        `${baseUrl}/api/sendText`,
        {
          session,
          chatId,
          text,
        },
        {
          headers: {
            'X-Api-Key': apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 10_000,
        },
      );
      this.logger.log(`OTP delivered via WAHA to ${this.maskPhone(phoneNumber)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `WAHA OTP delivery failed for ${this.maskPhone(phoneNumber)}: ${msg}`,
      );
      // Intentionally NOT throwing — OTP verify should still work; user may
      // rely on dev bypass or retry. Throwing would break the auth flow.
    }
  }

  private toChatId(phoneNumber: string): string {
    // WAHA expects chatId in format: <number>@c.us
    // Normalize: strip any + or spaces, ensure country code present.
    const digits = phoneNumber.replace(/\D/g, '');
    return `${digits}@c.us`;
  }

  private maskPhone(phoneNumber: string): string {
    if (phoneNumber.length <= 4) return '****';
    return `${phoneNumber.slice(0, 3)}****${phoneNumber.slice(-2)}`;
  }
}
