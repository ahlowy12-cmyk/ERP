import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ItemLedgerModel } from './entities/item-ledger.model';
import { ItemLedgerRepository } from './item-ledger.repository';
import { ItemsModule } from '../items/items.module'; // للوصول لـ InventoryItemRepository

@Module({
  imports: [ItemLedgerModel, ItemsModule],
  controllers: [ReportsController],
  providers: [ReportsService, ItemLedgerRepository],
  exports: [ReportsService, ItemLedgerRepository],
})
export class ReportsModule {}
