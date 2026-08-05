import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';

import { notificationsQueueName } from '../../core/queue/queue.constants';
import type {
  NotificationJobPayload,
  NotificationQueuePort,
  NotificationQueueResult
} from './notification-queue.port';

@Injectable()
export class BullNotificationQueueService implements NotificationQueuePort {
  constructor(@InjectQueue(notificationsQueueName) private readonly notificationsQueue: Queue) {}

  async addFoundationProbe(payload: NotificationJobPayload): Promise<NotificationQueueResult> {
    const job = await this.notificationsQueue.add('foundation-probe', payload);

    return {
      disabled: false,
      jobId: String(job.id)
    };
  }
}
