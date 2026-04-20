import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { RequirePermissions } from '../../common/auth/permissions.decorator';
import { ManualAssignDriverDto } from '../orders/dto/manual-assign-driver.dto';
import { DispatchService } from './dispatch.service';

@Controller('dispatch')
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @RequirePermissions('dispatch.read')
  @Get()
  getOpenJobs() {
    return this.dispatchService.getOpenJobs();
  }

  @RequirePermissions('dispatch.write')
  @Post('orders/:orderId/manual-assign')
  manualAssign(
    @Param('orderId') orderId: string,
    @Body() body: ManualAssignDriverDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.dispatchService.manualAssign(orderId, body, user);
  }
}
