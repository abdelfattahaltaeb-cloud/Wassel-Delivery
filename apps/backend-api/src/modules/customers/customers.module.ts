import { Module } from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService, UsersService]
})
export class CustomersModule {}
