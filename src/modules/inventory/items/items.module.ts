import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { InventoryItemModel } from 'src/DB/models/inventory-item.model';
import { InventoryItemRepository } from 'src/DB/repositories/inventory-item.repository';

@Module({
  imports: [InventoryItemModel],
  controllers: [ItemsController],
  providers: [ItemsService, InventoryItemRepository],
  exports: [ItemsService, InventoryItemRepository],
})
export class ItemsModule {}
