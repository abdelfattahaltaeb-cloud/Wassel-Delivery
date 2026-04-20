import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { RequirePermissions } from '../../common/auth/permissions.decorator';
import { Public } from '../../common/auth/public.decorator';
import { CreateDriverLocationDto } from './dto/create-driver-location.dto';
import { TrackingService } from './tracking.service';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @RequirePermissions('tracking.write')
  @Post('driver-locations')
  recordDriverLocation(
    @Body() body: CreateDriverLocationDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.trackingService.recordDriverLocation(body, user);
  }

  @RequirePermissions('tracking.read')
  @Get('orders/:orderId/timeline')
  getOrderTimeline(@Param('orderId') orderId: string) {
    return this.trackingService.getOrderTimeline(orderId);
  }

  @Public()
  @Get('public/:trackingCode')
  getPublicTimeline(@Param('trackingCode') trackingCode: string) {
    return this.trackingService.getPublicTrackingTimeline(trackingCode);
  }

  @RequirePermissions('tracking.read')
  @Get()
  getFoundationStatus() {
    return this.trackingService.getTrackingFoundationSummary();
  }
}
