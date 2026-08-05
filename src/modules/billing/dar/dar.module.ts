import { Module } from '@nestjs/common';
import { DARService } from './dar.service';
import { DARController } from './dar.controller';
import { DARModel } from './entities/dar.model';
import { ContractModel } from '../../workflow/contracts/entities/contract.model';
import { EquipmentModel } from '../../assets/equipment/entities/equipment.model';
import { ProjectModel } from '../../projects/entities/project.model';

@Module({
  imports: [DARModel, ContractModel, EquipmentModel, ProjectModel],
  providers: [DARService],
  controllers: [DARController],
  exports: [DARService, DARModel],
})
export class DARModule {}
