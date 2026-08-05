import { Module } from '@nestjs/common';
import { FuelService } from './fuel.service';
import { FuelController } from './fuel.controller';
import { FuelTankModel, FuelReceiptModel, FuelIssueModel } from './entities/fuel.model';

@Module({
  imports: [FuelTankModel, FuelReceiptModel, FuelIssueModel],
  providers: [FuelService],
  controllers: [FuelController],
  exports: [FuelService, FuelTankModel, FuelIssueModel],
})
export class FuelModule {}
