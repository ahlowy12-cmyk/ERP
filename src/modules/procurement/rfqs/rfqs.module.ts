import { Module } from '@nestjs/common';
import { RfqsController } from './rfqs.controller';
import { RfqsService } from './rfqs.service';
import { RfqModel } from './entities/rfq.model';
import { QuotationModel } from './entities/quotation.model';
import { RfqsRepository } from './rfqs.repository';
import { QuotationsRepository } from './quotations.repository';
import { PurchaseRequestsModule } from '../purchase-requests/purchase-requests.module';
import { PurchaseOrdersModule } from '../purchase-orders/purchase-orders.module';

@Module({
  imports: [
    RfqModel,
    QuotationModel,
    PurchaseRequestsModule, // ضروري للوصول لـ PurchaseRequestRepository
    PurchaseOrdersModule, // ضروري للوصول لـ PurchaseOrdersService
  ],
  controllers: [RfqsController],
  providers: [RfqsService, RfqsRepository, QuotationsRepository],
  exports: [RfqsService, RfqsRepository, QuotationsRepository],
})
export class RfqsModule {}
