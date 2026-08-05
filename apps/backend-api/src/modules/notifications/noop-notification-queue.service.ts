import { Injectable, Logger } from '@nestjs/common';

import type {
  NotificationJobPayload,
  NotificationQueuePort,
  NotificationQueueResult
} from './notification-queue.port';

@Injectable()
export class NoopNotificationQueueService implements NotificationQueuePort {
  private readonly logger = new Logger(NoopNotificationQueueService.name);

  async addFoundationProbe(payload: NotificationJobPayload): Promise<NotificationQueueResult> {
    this.logger.log(
      `Notifications queue disabled by LOW_COST_MODE=true; skipped ${payload.channel} probe for ${payload.recipientId}.`
    );

    return {
      disabled: true
    };
  }
}
