import { Module } from '@nestjs/common';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';
import { WarehouseModel } from 'src/DB/models/warehouse.model';
import { WarehouseRepository } from 'src/DB/repositories/warehouse.repository';

@Module({
  imports: [WarehouseModel],
  controllers: [WarehousesController],
  providers: [WarehousesService, WarehouseRepository],
  exports: [WarehousesService, WarehouseRepository],
})
export class WarehousesModule {}
