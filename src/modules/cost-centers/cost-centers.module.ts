import { Module } from '@nestjs/common';
import { CostCentersService } from './cost-centers.service';
import { CostCentersController } from './cost-centers.controller';
import { CostCenterModel } from './entities/cost-center.model';
import { ProjectBudgetModel } from '../finance/entities/budget.model';

@Module({
  imports: [CostCenterModel, ProjectBudgetModel],
  providers: [CostCentersService],
  controllers: [CostCentersController],
  exports: [CostCentersService, CostCenterModel],
})
export class CostCentersModule {}
