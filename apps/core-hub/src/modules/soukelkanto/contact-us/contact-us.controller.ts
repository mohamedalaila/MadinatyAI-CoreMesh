import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WahaClient } from '../../notifications/waha.client';
import { Public } from '../../auth/decorators/public.decorator';
import { ContactUsDto } from '../dto/contact-us.dto';

/**
 * Contact-Us controller — public endpoint that forwards visitor messages
 * to the Souk ElKanto support team via WAHA (WhatsApp HTTP API).
 *
 * No auth required — this is a public contact form.
 * Rate limiting should be applied at the gateway level.
 */
@ApiTags('Souk ElKanto — Contact Us')
@Public()
@Controller('contact-us')
export class ContactUsController {
  private readonly waha: WahaClient;
  private readonly supportPhone: string;

  constructor(config: ConfigService) {
    this.waha = new WahaClient(config);
    this.supportPhone = config.get<string>('soukSupportPhone') ?? '';
  }

  @Post()
  async send(@Body() dto: ContactUsDto): Promise<{ ok: boolean }> {
    if (!this.supportPhone || !this.waha.isAvailable()) {
      return { ok: false };
    }

    const text = [
      `📬 *رسالة جديدة من Souk ElKanto*`,
      ``,
      `الاسم: ${dto.name}`,
      `الهاتف: ${dto.phone}`,
      dto.email ? `البريد: ${dto.email}` : null,
      ``,
      `الرسالة:`,
      dto.message,
    ]
      .filter(Boolean)
      .join('\n');

    const ok = await this.waha.sendText(this.supportPhone, text);
    return { ok };
  }
}
