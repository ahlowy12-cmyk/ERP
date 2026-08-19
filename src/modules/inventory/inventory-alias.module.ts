import { Module } from '@nestjs/common';
import { InventoryAliasController } from './inventory-alias.controller';
import { MrvsModule } from './mrvs/mrvs.module';
import { MivsModule } from './mivs/mivs.module';

@Module({
  imports: [MrvsModule, MivsModule],
  controllers: [InventoryAliasController],
})
export class InventoryAliasModule {}
