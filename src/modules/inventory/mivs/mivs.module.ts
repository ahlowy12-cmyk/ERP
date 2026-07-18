import { Module } from '@nestjs/common';
import { MivsController } from './mivs.controller';
import { MivsService } from './mivs.service';
import { MIVModel } from './entities/miv.model';
import { MivsRepository } from './mivs.repository';

@Module({
  imports: [MIVModel],
  controllers: [MivsController],
  providers: [MivsService, MivsRepository],
  exports: [MivsService, MivsRepository], // ضروري لأن PurchaseRequestsService يستخدمه
})
export class MivsModule {}
