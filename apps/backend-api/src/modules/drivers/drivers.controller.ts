import { Body, Controller, Get, Post } from '@nestjs/common';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { RequirePermissions } from '../../common/auth/permissions.decorator';
import { CreateDriverUserDto } from '../users/dto/create-driver-user.dto';
import { UsersService } from '../users/users.service';
import { DriversService } from './drivers.service';

@Controller('drivers')
export class DriversController {
  constructor(
    private readonly driversService: DriversService,
    private readonly usersService: UsersService
  ) {}

  @RequirePermissions('drivers.read')
  @Get()
  listDrivers() {
    return this.driversService.listDrivers();
  }

  @Post()
  createDriver(@Body() body: CreateDriverUserDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.createDriver(body, user);
  }
}
