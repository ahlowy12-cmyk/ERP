import { Module } from '@nestjs/common';
import { TimesheetsService } from './timesheets.service';
import { TimesheetsController } from './timesheets.controller';
import { TimesheetModel } from './entities/timesheet.model';
import { EquipmentModel } from '../../assets/equipment/entities/equipment.model';
import { ProjectModel } from '../../projects/entities/project.model';

@Module({
  imports: [TimesheetModel, EquipmentModel, ProjectModel],
  providers: [TimesheetsService],
  controllers: [TimesheetsController],
  exports: [TimesheetsService, TimesheetModel],
})
export class TimesheetsModule {}
