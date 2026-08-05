import { Module } from '@nestjs/common';

import { isLowCostModeEnabled } from '../../config/runtime-mode';
import { BullNotificationQueueService } from './bull-notification-queue.service';
import { NoopNotificationQueueService } from './noop-notification-queue.service';
import { notificationQueueToken } from './notification-queue.port';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

const notificationQueueProvider = {
  provide: notificationQueueToken,
  useClass: isLowCostModeEnabled() ? NoopNotificationQueueService : BullNotificationQueueService
};

@Module({
  controllers: [NotificationsController],
  providers: [notificationQueueProvider, NotificationsService]
})
export class NotificationsModule {}
