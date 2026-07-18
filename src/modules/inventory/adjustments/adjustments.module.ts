import { Module } from '@nestjs/common';
import { AdjustmentsController } from './adjustments.controller';
import { AdjustmentsService } from './adjustments.service';
import { StockAdjustmentModel } from './entities/adjustment.model';
import { AdjustmentsRepository } from './adjustments.repository';

@Module({
  imports: [StockAdjustmentModel],
  controllers: [AdjustmentsController],
  providers: [AdjustmentsService, AdjustmentsRepository],
  exports: [AdjustmentsService, AdjustmentsRepository],
})
export class AdjustmentsModule {}
