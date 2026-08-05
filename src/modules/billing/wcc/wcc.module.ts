import { Module } from '@nestjs/common';
import { WCCService } from './wcc.service';
import { WCCController } from './wcc.controller';
import { WCCModel } from './entities/wcc.model';
import { DARModel } from '../dar/entities/dar.model';
import { ContractModel } from '../../workflow/contracts/entities/contract.model';

@Module({
  imports: [WCCModel, DARModel, ContractModel],
  providers: [WCCService],
  controllers: [WCCController],
  exports: [WCCService, WCCModel],
})
export class WCCModule {}
