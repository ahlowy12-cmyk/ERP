import { Module } from '@nestjs/common';
import { QuotationComparisonController } from './quotation-comparison.controller';
import { QuotationComparisonService } from './quotation-comparison.service';
// استيراد الموديولات الأخرى للوصول إلى الـ Repositories المُصدّرة (Exported)
import { RfqsModule } from '../rfqs/rfqs.module';
import { PurchaseRequestsModule } from '../purchase-requests/purchase-requests.module';

@Module({
  imports: [RfqsModule, PurchaseRequestsModule],
  controllers: [QuotationComparisonController],
  providers: [QuotationComparisonService],
})
export class QuotationComparisonModule {}
