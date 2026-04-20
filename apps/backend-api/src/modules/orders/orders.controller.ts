import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { RequirePermissions } from '../../common/auth/permissions.decorator';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { DeliverOrderDto } from './dto/deliver-order.dto';
import { FailDeliveryDto } from './dto/fail-delivery.dto';
import { ManualAssignDriverDto } from './dto/manual-assign-driver.dto';
import { TransitionNoteDto } from './dto/transition-note.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @RequirePermissions('orders.read')
  @Get()
  listOrders(@Query('status') status?: string) {
    return this.ordersService.listOrders(status);
  }

  @RequirePermissions('orders.read')
  @Get(':orderId')
  getOrder(@Param('orderId') orderId: string) {
    return this.ordersService.getOrderById(orderId);
  }

  @RequirePermissions('orders.write')
  @Post()
  createOrder(@Body() body: CreateOrderDto, @CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.createOrder(body, user);
  }

  @RequirePermissions('orders.write')
  @Post(':orderId/assignments/manual')
  manualAssignDriver(
    @Param('orderId') orderId: string,
    @Body() body: ManualAssignDriverDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.ordersService.manualAssignDriver(orderId, body, user);
  }

  @RequirePermissions('orders.write')
  @Post(':orderId/driver-acceptance')
  driverAccept(
    @Param('orderId') orderId: string,
    @Body() body: TransitionNoteDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.ordersService.driverAccept(orderId, body, user);
  }

  @RequirePermissions('orders.write')
  @Post(':orderId/pickup')
  pickupOrder(
    @Param('orderId') orderId: string,
    @Body() body: TransitionNoteDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.ordersService.pickupOrder(orderId, body, user);
  }

  @RequirePermissions('orders.write')
  @Post(':orderId/in-transit')
  markInTransit(
    @Param('orderId') orderId: string,
    @Body() body: TransitionNoteDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.ordersService.markInTransit(orderId, body, user);
  }

  @RequirePermissions('orders.write')
  @Post(':orderId/deliver')
  deliverOrder(
    @Param('orderId') orderId: string,
    @Body() body: DeliverOrderDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.ordersService.deliverOrder(orderId, body, user);
  }

  @RequirePermissions('orders.write')
  @Post(':orderId/fail-delivery')
  failDelivery(
    @Param('orderId') orderId: string,
    @Body() body: FailDeliveryDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.ordersService.failDelivery(orderId, body, user);
  }

  @RequirePermissions('orders.write')
  @Post(':orderId/cancel')
  cancelOrder(
    @Param('orderId') orderId: string,
    @Body() body: CancelOrderDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.ordersService.cancelOrder(orderId, body, user);
  }
}
