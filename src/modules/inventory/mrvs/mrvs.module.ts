import { Module } from '@nestjs/common';
import { MrvsController } from './mrvs.controller';
import { MrvsService } from './mrvs.service';
import { MrvModel } from './entities/mrv.model';
import { MrvsRepository } from './mrvs.repository';
import { PurchaseOrdersModule } from 'src/modules/procurement/purchase-orders/purchase-orders.module';
import { ItemsModule } from 'src/modules/inventory/items/items.module';

@Module({
  imports: [
    MrvModel,
    PurchaseOrdersModule, // للوصول لتحديث حالة PO
    ItemsModule, // لتمكين حقن InventoryItemRepository
  ],
  controllers: [MrvsController],
  providers: [MrvsService, MrvsRepository],
  exports: [MrvsService, MrvsRepository],
})
export class MrvsModule {}
