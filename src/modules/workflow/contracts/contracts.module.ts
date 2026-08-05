import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { ContractModel } from './entities/contract.model';
import { ProjectModel } from '../../projects/entities/project.model';
import { CostCenterModel } from '../../cost-centers/entities/cost-center.model';
import { EquipmentModel } from '../../assets/equipment/entities/equipment.model';

@Module({
  imports: [
    ContractModel,
    ProjectModel,      // needed by Auto-Engine
    CostCenterModel,   // needed by Auto-Engine
    EquipmentModel,    // needed by Auto-Engine
  ],
  providers: [ContractsService],
  controllers: [ContractsController],
  exports: [ContractsService, ContractModel],
})
export class ContractsModule {}
