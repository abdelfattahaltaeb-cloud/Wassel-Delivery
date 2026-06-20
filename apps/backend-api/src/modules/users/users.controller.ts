import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { CreateCustomerUserDto } from './dto/create-customer-user.dto';
import { CreateDriverUserDto } from './dto/create-driver-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetPasswordDto, UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  listUsers(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.listUsers(user);
  }

  @Get('roles')
  listSupportedRoles(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.listSupportedRoles(user);
  }

  @Post()
  createUser(@Body() body: CreateUserDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.createUser(body, user);
  }

  @Post('create-driver')
  createDriver(@Body() body: CreateDriverUserDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.createDriver(body, user);
  }

  @Post('create-customer')
  createCustomer(@Body() body: CreateCustomerUserDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.createCustomer(body, user);
  }

  @Get(':id')
  getUser(@Param('id') userId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getUser(userId, user);
  }

  @Patch(':id')
  updateUser(
    @Param('id') userId: string,
    @Body() body: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.usersService.updateUser(userId, body, user);
  }

  @Post(':id/deactivate')
  deactivateUser(@Param('id') userId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.deactivateUser(userId, user);
  }

  @Post(':id/activate')
  activateUser(@Param('id') userId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.activateUser(userId, user);
  }

  @Post(':id/reset-password')
  resetPassword(
    @Param('id') userId: string,
    @Body() body: ResetPasswordDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.usersService.resetPassword(userId, body, user);
  }
}
