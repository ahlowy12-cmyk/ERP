import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { EquipmentModel } from './equipment/entities/equipment.model';
import {
  AssetAssignmentModel,
  AssetTransferModel,
  AssetDisposalModel,
  AssetHistoryModel,
} from './entities/assets.model';

@Module({
  imports: [
    EquipmentModel,
    AssetAssignmentModel,
    AssetTransferModel,
    AssetDisposalModel,
    AssetHistoryModel,
  ],
  providers: [AssetsService],
  controllers: [AssetsController],
  exports: [
    AssetsService,
    AssetAssignmentModel,
    AssetTransferModel,
    AssetDisposalModel,
    AssetHistoryModel,
  ],
})
export class AssetsModule {}
