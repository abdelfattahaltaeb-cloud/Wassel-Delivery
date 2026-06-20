import { Body, Controller, Get, Post } from '@nestjs/common';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { CreateCustomerUserDto } from '../users/dto/create-customer-user.dto';
import { UsersService } from '../users/users.service';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly usersService: UsersService
  ) {}

  @Get()
  getFoundationStatus() {
    return this.customersService.getFoundationStatus();
  }

  @Post()
  createCustomer(@Body() body: CreateCustomerUserDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.createCustomer(body, user);
  }
}
