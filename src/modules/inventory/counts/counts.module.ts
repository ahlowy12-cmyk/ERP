import { Module } from '@nestjs/common';
import { CountsController } from './counts.controller';
import { CountsService } from './counts.service';
import { StockCountModel } from './entities/stock-count.model';
import { CountsRepository } from './counts.repository';

@Module({
  imports: [StockCountModel],
  controllers: [CountsController],
  providers: [CountsService, CountsRepository],
  exports: [CountsService, CountsRepository],
})
export class CountsModule {}
