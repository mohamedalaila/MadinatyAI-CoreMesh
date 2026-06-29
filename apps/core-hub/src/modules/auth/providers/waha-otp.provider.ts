import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WahaClient } from '../../notifications/waha.client';
import type { OtpDeliveryProvider } from './otp-delivery.provider';

/**
 * WAHA (WhatsApp HTTP API) OTP delivery provider.
 *
 * Sends OTP codes via WhatsApp message using a self-hosted WAHA instance.
 * Falls back silently to console logging on transient errors so OTP verification
 * isn't blocked by a flaky WhatsApp connection.
 *
 * Delegates HTTP/phone logic to the shared {@link WahaClient}.
 */
@Injectable()
export class WahaOtpDeliveryProvider implements OtpDeliveryProvider {
  private readonly logger = new Logger(WahaOtpDeliveryProvider.name);
  private readonly waha: WahaClient;

  constructor(config: ConfigService) {
    this.waha = new WahaClient(config);
  }

  async send(phoneNumber: string, code: string): Promise<void> {
    if (!this.waha.isAvailable()) {
      this.logger.warn(
        'WAHA not configured (WAHA_BASE_URL or WAHA_API_KEY missing). ' +
          'OTP will NOT be delivered via WhatsApp.',
      );
      return;
    }

    const text = `🔐 رمز التحقق بتاعك: *${code}*\n\nاستخدمه في Souk ElKanto خلال 5 دقايق.\n\nYour verification code: *${code}*\nValid for 5 minutes.`;

    const ok = await this.waha.sendText(phoneNumber, text);
    if (ok) {
      this.logger.log(`OTP delivered via WAHA to ${this.waha.maskPhone(phoneNumber)}`);
    } else {
      this.logger.error(
        `WAHA OTP delivery failed for ${this.waha.maskPhone(phoneNumber)}`,
      );
    }
  }
}
