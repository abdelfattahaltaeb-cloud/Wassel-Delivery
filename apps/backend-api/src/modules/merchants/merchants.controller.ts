import { Controller, Get } from '@nestjs/common';

import { RequirePermissions } from '../../common/auth/permissions.decorator';
import { MerchantsService } from './merchants.service';

@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @RequirePermissions('merchants.read')
  @Get()
  listMerchants() {
    return this.merchantsService.listMerchants();
  }
}
