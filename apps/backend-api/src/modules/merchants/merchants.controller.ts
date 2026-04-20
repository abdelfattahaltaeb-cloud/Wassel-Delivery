import { Controller, Get } from '@nestjs/common';

import { MerchantsService } from './merchants.service';

@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Get()
  getFoundationStatus() {
    return this.merchantsService.getFoundationStatus();
  }
}
