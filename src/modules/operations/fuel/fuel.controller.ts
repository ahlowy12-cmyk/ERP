import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { FuelService } from './fuel.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('operations/fuel')
export class FuelController {
  constructor(private readonly svc: FuelService) {}

  // GET  /api/v1/operations/fuel/tanks
  @Get('tanks')
  getTanks(
    @Query('projectCode') projectCode?: string,
    @Query('fuelType') fuelType?: string,
    @Query('status') status?: string,
  ) { return this.svc.getTanks({ projectCode, fuelType, status }); }

  // POST /api/v1/operations/fuel/tanks
  @Post('tanks')
  createTank(@Body() dto: any, @CurrentUser('id') userId: string) {
    return this.svc.createTank(dto, userId);
  }

  // GET  /api/v1/operations/fuel/tanks/:id
  @Get('tanks/:id')
  getTank(@Param('id') id: string) { return this.svc.getTank(id); }

  // GET  /api/v1/operations/fuel/receipts
  @Get('receipts')
  getReceipts(@Query('tankId') tankId?: string) {
    return this.svc.getReceipts(tankId);
  }

  // POST /api/v1/operations/fuel/receipts
  @Post('receipts')
  createReceipt(@Body() dto: any, @CurrentUser('id') userId: string) {
    return this.svc.createReceipt(dto, userId);
  }

  // GET  /api/v1/operations/fuel/issues
  @Get('issues')
  getIssues(
    @Query('tankId') tankId?: string,
    @Query('projectCode') projectCode?: string,
    @Query('costCenterCode') costCenterCode?: string,
  ) { return this.svc.getIssues({ tankId, projectCode, costCenterCode }); }

  // POST /api/v1/operations/fuel/issues
  @Post('issues')
  createIssue(@Body() dto: any, @CurrentUser('id') userId: string) {
    return this.svc.createIssue(dto, userId);
  }
}
