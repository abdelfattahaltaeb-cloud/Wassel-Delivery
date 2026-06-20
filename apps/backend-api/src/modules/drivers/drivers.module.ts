import { Module } from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';

@Module({
  controllers: [DriversController],
  providers: [DriversService, UsersService]
})
export class DriversModule {}
