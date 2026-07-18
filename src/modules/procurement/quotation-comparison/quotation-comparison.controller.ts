import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { QuotationComparisonService } from './quotation-comparison.service';

@Controller('procurement/quotation-comparison')
export class QuotationComparisonController {
  constructor(private readonly comparisonService: QuotationComparisonService) {}

  @Get()
  async getAllComparisons(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.comparisonService.getAllComparisons(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get(':rfqId')
  async getComparisonDetails(@Param('rfqId') rfqId: string) {
    return this.comparisonService.getComparisonDetails(rfqId);
  }
}
