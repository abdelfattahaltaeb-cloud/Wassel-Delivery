import { Inject, Injectable } from '@nestjs/common';

import { createFeatureStatus } from '../../common/feature-status';
import type { NotificationQueuePort } from './notification-queue.port';
import { notificationQueueToken } from './notification-queue.port';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(notificationQueueToken) private readonly notificationQueue: NotificationQueuePort
  ) {}

  getFoundationStatus() {
    return createFeatureStatus('notifications', [
      'Notifications use BullMQ on Redis by default.',
      'LOW_COST_MODE=true disables Redis-backed notifications with a safe no-op queue.',
      'Channel-specific providers remain for Phase 2.'
    ]);
  }

  async enqueueFoundationProbe() {
    return this.notificationQueue.addFoundationProbe({
      recipientId: 'placeholder-recipient',
      channel: 'push',
      message: 'foundation-ready'
    });
  }
}
