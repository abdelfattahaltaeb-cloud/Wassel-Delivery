import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

import { notificationsQueueName } from './queue.constants';

type NotificationJobPayload = {
  recipientId: string;
  channel: 'push' | 'sms' | 'email';
  message: string;
};

@Processor(notificationsQueueName)
export class NotificationsProcessor extends WorkerHost {
  async process(job: Job<NotificationJobPayload>) {
    return {
      processedAt: new Date().toISOString(),
      jobId: job.id,
      channel: job.data.channel
    };
  }
}
