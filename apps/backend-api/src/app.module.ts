import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { JwtAuthGuard } from './common/auth/jwt-auth.guard';
import { PermissionsGuard } from './common/auth/permissions.guard';
import { appConfig } from './config/app.config';
import { validateEnv } from './config/env.validation';
import { QueueModule } from './core/queue/queue.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { RedisModule } from './core/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { CitiesZonesServiceAreasModule } from './modules/cities-zones-service-areas/cities-zones-service-areas.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DispatchModule } from './modules/dispatch/dispatch.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { MerchantsModule } from './modules/merchants/merchants.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ProofOfDeliveryModule } from './modules/proof-of-delivery/proof-of-delivery.module';
import { RolesPermissionsModule } from './modules/roles-permissions/roles-permissions.module';
import { SettlementsModule } from './modules/settlements/settlements.module';
import { SystemModule } from './modules/system/system.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig],
      validate: validateEnv
    }),
    PrismaModule,
    RedisModule,
    QueueModule,
    SystemModule,
    AuthModule,
    UsersModule,
    RolesPermissionsModule,
    CitiesZonesServiceAreasModule,
    MerchantsModule,
    CustomersModule,
    DriversModule,
    OrdersModule,
    DispatchModule,
    TrackingModule,
    ProofOfDeliveryModule,
    SettlementsModule,
    NotificationsModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard
    }
  ]
})
export class AppModule {}
