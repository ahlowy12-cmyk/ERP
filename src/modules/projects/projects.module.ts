import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ProjectModel } from './entities/project.model';

@Module({
  imports: [ProjectModel],
  providers: [ProjectsService],
  controllers: [ProjectsController],
  exports: [ProjectsService, ProjectModel],
})
export class ProjectsModule {}
