import { Controller, Get, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('inventory')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  async getSummary() {
    return this.reportsService.getSummary();
  }

  @Get('valuation')
  async getValuation() {
    return this.reportsService.getValuation();
  }

  @Get('item-ledger/:itemCode')
  async getItemLedger(@Param('itemCode') itemCode: string) {
    return this.reportsService.getItemLedger(itemCode);
  }
}
