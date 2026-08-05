import { Module } from '@nestjs/common';
import { ProjectResourcesService } from './project-resources.service';
import { ProjectResourcesController } from './project-resources.controller';
import { ProjectModel } from './entities/project.model';
import { EquipmentModel } from '../assets/equipment/entities/equipment.model';
import { EquipmentAssignmentModel } from './equipment-assignments/entities/equipment-assignment.model';
import { MaterialConsumptionModel } from './material-consumptions/entities/material-consumption.model';
import { LaborRecordModel } from './labor-records/entities/labor-record.model';
import { EquipmentTransferModel } from './equipment-transfers/entities/equipment-transfer.model';

@Module({
  imports: [
    ProjectModel,
    EquipmentModel,
    EquipmentAssignmentModel,
    MaterialConsumptionModel,
    LaborRecordModel,
    EquipmentTransferModel,
  ],
  providers: [ProjectResourcesService],
  controllers: [ProjectResourcesController],
  exports: [
    ProjectResourcesService,
    EquipmentAssignmentModel,
    MaterialConsumptionModel,
    LaborRecordModel,
    EquipmentTransferModel,
  ],
})
export class ProjectResourcesModule {}
