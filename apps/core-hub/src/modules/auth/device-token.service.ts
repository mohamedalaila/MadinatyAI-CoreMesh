import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@madinatyai/prisma';

/**
 * Manages FCM push-notification device tokens.
 *
 * Tokens are upserted (insert or reactivate) on register, and deactivated
 * on unregister. The `PushDeviceToken` table lives in the `core` schema
 * so tokens are cross-tenant.
 */
@Injectable()
export class DeviceTokenService {
  private readonly logger = new Logger(DeviceTokenService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register or refresh a device token for the given user.
   * If the token already exists (even if deactivated), it is reactivated
   * and its platform / appSlug are updated.
   */
  async register(
    userId: string,
    token: string,
    platform: string,
    appSlug?: string,
  ): Promise<void> {
    await this.prisma.pushDeviceToken.upsert({
      where: { token },
      create: { userId, token, platform, appSlug, isActive: true },
      update: { userId, platform, appSlug, isActive: true },
    });
    this.logger.debug(`Device token registered for user ${userId} (${platform})`);
  }

  /**
   * Deactivate a device token (soft delete — keeps audit trail).
   */
  async unregister(token: string): Promise<void> {
    await this.prisma.pushDeviceToken.updateMany({
      where: { token },
      data: { isActive: false },
    });
    this.logger.debug('Device token deactivated');
  }
}
