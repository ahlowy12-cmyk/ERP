import { Module } from '@nestjs/common';
import { PurchaseRequestsController } from './purchase-requests.controller';
import { PurchaseRequestsService } from './purchase-requests.service';
import { PurchaseRequestModel } from './entities/purchase-request.model';
import { PurchaseRequestRepository } from './purchase-requests.repository';

import { MivsModule } from 'src/modules/inventory/mivs/mivs.module';

@Module({
  imports: [PurchaseRequestModel, MivsModule],
  controllers: [PurchaseRequestsController],
  providers: [PurchaseRequestsService, PurchaseRequestRepository],
  exports: [PurchaseRequestsService, PurchaseRequestRepository],
})
export class PurchaseRequestsModule {}
