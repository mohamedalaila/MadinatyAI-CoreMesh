import { Module } from '@nestjs/common';
import { PrismaModule } from '@madinatyai/prisma';
import type { NotificationChannel } from './notification-channel.interface';
import { NOTIFICATION_CHANNELS } from './notification-channel.interface';
import { WahaNotificationService } from './waha-notification.service';
import { WhatsAppChannel } from './whatsapp.channel';
import { FcmChannel } from './fcm.channel';
import { NotificationDispatcher } from './notification-dispatcher.service';

@Module({
  imports: [PrismaModule],
  providers: [
    WahaNotificationService,
    WhatsAppChannel,
    FcmChannel,
    {
      provide: NOTIFICATION_CHANNELS,
      useFactory: (whatsapp: WhatsAppChannel, fcm: FcmChannel) => [whatsapp, fcm],
      inject: [WhatsAppChannel, FcmChannel],
    },
    {
      provide: NotificationDispatcher,
      useFactory: (channels: NotificationChannel[]) => new NotificationDispatcher(channels),
      inject: [NOTIFICATION_CHANNELS],
    },
  ],
  exports: [WahaNotificationService, NotificationDispatcher, NOTIFICATION_CHANNELS],
})
export class NotificationsModule {}
