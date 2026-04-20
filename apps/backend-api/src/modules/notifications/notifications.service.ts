import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';

import { createFeatureStatus } from '../../common/feature-status';
import { notificationsQueueName } from '../../core/queue/queue.constants';

@Injectable()
export class NotificationsService {
  constructor(@InjectQueue(notificationsQueueName) private readonly notificationsQueue: Queue) {}

  getFoundationStatus() {
    return createFeatureStatus('notifications', [
      'Notifications queue is wired through BullMQ on Redis.',
      'Channel-specific providers remain for Phase 2.'
    ]);
  }

  async enqueueFoundationProbe() {
    await this.notificationsQueue.add('foundation-probe', {
      recipientId: 'placeholder-recipient',
      channel: 'push',
      message: 'foundation-ready'
    });
  }
}