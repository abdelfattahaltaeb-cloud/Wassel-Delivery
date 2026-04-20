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
}
