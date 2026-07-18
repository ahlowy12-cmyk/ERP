import { Module } from '@nestjs/common';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';
import { TransferModel } from './entities/transfer.model';
import { TransfersRepository } from './transfers.repository';

@Module({
  imports: [TransferModel],
  controllers: [TransfersController],
  providers: [TransfersService, TransfersRepository],
  exports: [TransfersService, TransfersRepository],
})
export class TransfersModule {}
