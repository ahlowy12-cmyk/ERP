import { Module } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { DepartmentModel } from './entities/department.model';

@Module({
  imports: [DepartmentModel],
  providers: [DepartmentsService],
  controllers: [DepartmentsController],
  exports: [DepartmentsService, DepartmentModel],
})
export class DepartmentsModule {}
