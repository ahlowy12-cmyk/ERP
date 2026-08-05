import { Module } from '@nestjs/common';
import { CampsService } from './camps.service';
import { CampsController } from './camps.controller';
import { CampModel, CampAllocationModel } from './entities/camp.model';

@Module({
  imports: [CampModel, CampAllocationModel],
  providers: [CampsService],
  controllers: [CampsController],
  exports: [CampsService, CampModel],
})
export class CampsModule {}
