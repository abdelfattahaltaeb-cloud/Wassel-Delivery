import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';

@Injectable()
export class SystemService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService
  ) {}

  async getHealth() {
    await this.prismaService.$queryRawUnsafe('SELECT 1');
    await this.redisService.ping();

    return {
      status: 'ok' as const,
      service: 'backend-api',
      timestamp: new Date().toISOString(),
      dependencies: {
        postgres: 'ok',
        redis: 'ok'
      }
    };
  }

  getBuildInfo() {
    return {
      appName: 'backend-api',
      version: this.configService.get<string>('APP_VERSION', '0.1.0'),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      commitSha: this.configService.get<string>('COMMIT_SHA', 'local-dev'),
      builtAt: this.configService.get<string>('BUILT_AT', new Date().toISOString())
    };
  }

  async getDashboardSummary() {
    const [
      totalOrders,
      activeOrders,
      deliveredOrders,
      failedOrders,
      availableDrivers,
      busyDrivers,
      merchants,
      pendingSettlements,
      codVolume
    ] = await Promise.all([
      this.prismaService.order.count(),
      this.prismaService.order.count({
        where: {
          status: {
            in: ['CREATED', 'ASSIGNED', 'DRIVER_ACCEPTED', 'PICKED_UP', 'IN_TRANSIT']
          }
        }
      }),
      this.prismaService.order.count({ where: { status: 'DELIVERED' } }),
      this.prismaService.order.count({ where: { status: 'FAILED_DELIVERY' } }),
      this.prismaService.driver.count({ where: { status: 'AVAILABLE' } }),
      this.prismaService.driver.count({ where: { status: 'BUSY' } }),
      this.prismaService.merchant.count(),
      this.prismaService.settlement.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true }
      }),
      this.prismaService.order.aggregate({
        _sum: { codAmount: true }
      })
    ]);

    return {
      orders: {
        total: totalOrders,
        active: activeOrders,
        delivered: deliveredOrders,
        failed: failedOrders
      },
      fleet: {
        availableDrivers,
        busyDrivers
      },
      merchants,
      finance: {
        pendingSettlementAmount: pendingSettlements._sum.amount ?? 0,
        codVolume: codVolume._sum.codAmount ?? 0
      }
    };
  }
}
