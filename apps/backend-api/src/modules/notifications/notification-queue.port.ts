export type NotificationJobPayload = {
  recipientId: string;
  channel: 'push' | 'sms' | 'email';
  message: string;
};

export type NotificationQueueResult = {
  disabled: boolean;
  jobId?: string;
};

export const notificationQueueToken = Symbol('NotificationQueue');

export interface NotificationQueuePort {
  addFoundationProbe(payload: NotificationJobPayload): Promise<NotificationQueueResult>;
}
