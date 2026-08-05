import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';

@Injectable()
export class SystemService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    @Optional() private readonly redisService?: RedisService
  ) {}

  async getHealth() {
    await this.prismaService.$queryRawUnsafe('SELECT 1');

    const lowCostMode = this.configService.get<boolean>('LOW_COST_MODE', false);
    const redisStatus = lowCostMode ? 'disabled' : 'ok';

    if (!lowCostMode) {
      if (!this.redisService) {
        throw new Error('Redis service is required outside low-cost mode');
      }

      await this.redisService.ping();
    }

    return {
      status: 'ok' as const,
      service: 'backend-api',
      timestamp: new Date().toISOString(),
      dependencies: {
        postgres: 'ok',
        redis: redisStatus
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
      totalUsers,
      totalDrivers,
      totalCustomers,
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
      this.prismaService.user.count(),
      this.prismaService.driver.count(),
      this.prismaService.customer.count(),
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
        totalDrivers,
        availableDrivers,
        busyDrivers
      },
      users: {
        total: totalUsers,
        drivers: totalDrivers,
        customers: totalCustomers
      },
      merchants,
      finance: {
        pendingSettlementAmount: pendingSettlements._sum.amount ?? 0,
        codVolume: codVolume._sum.codAmount ?? 0
      }
    };
  }
}
