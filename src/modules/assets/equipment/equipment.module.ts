import { Module } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { EquipmentController } from './equipment.controller';
import { EquipmentModel } from './entities/equipment.model';

@Module({
  imports: [EquipmentModel],
  providers: [EquipmentService],
  controllers: [EquipmentController],
  exports: [EquipmentService, EquipmentModel],
})
export class EquipmentModule {}
