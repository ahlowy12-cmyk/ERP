import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { IsEnum, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class UpdateProjectStatusDto {
  @IsEnum(['Active', 'On_Hold', 'Completed', 'Cancelled', 'Suspended', 'Delayed'])
  status!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  progressPercent?: number;
}

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // GET /api/v1/projects
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('customer') customer?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.projectsService.findAll({ search, status, customer, page, limit });
  }

  // GET /api/v1/projects/:code
  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.projectsService.findByCode(code);
  }

  // GET /api/v1/projects/:code/cost-summary
  @Get(':code/cost-summary')
  getCostSummary(@Param('code') code: string) {
    return this.projectsService.getCostSummary(code);
  }

  // PATCH /api/v1/projects/:code/status
  @Patch(':code/status')
  updateStatus(
    @Param('code') code: string,
    @Body() dto: UpdateProjectStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.projectsService.updateStatus(
      code,
      dto.status,
      dto.progressPercent,
      userId,
    );
  }
}
