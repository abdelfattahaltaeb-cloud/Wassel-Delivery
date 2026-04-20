import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

import { NotificationsProcessor } from './queue.processor';
import { notificationsQueueName } from './queue.constants';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', '127.0.0.1'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD')
        }
      })
    }),
    BullModule.registerQueue({
      name: notificationsQueueName
    })
  ],
  providers: [NotificationsProcessor],
  exports: [BullModule]
})
export class QueueModule {}
