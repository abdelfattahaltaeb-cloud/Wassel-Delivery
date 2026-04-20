import { Controller, Get } from '@nestjs/common';

import { RequirePermissions } from '../../common/auth/permissions.decorator';
import { SettlementsService } from './settlements.service';

@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @RequirePermissions('settlements.read')
  @Get()
  listSettlements() {
    return this.settlementsService.listSettlements();
  }
}
