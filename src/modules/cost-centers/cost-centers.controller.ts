import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { CostCentersService } from './cost-centers.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('cost-centers')
export class CostCentersController {
  constructor(private readonly costCentersService: CostCentersService) {}

  @Get()
  findAll(
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.costCentersService.findAll({ type, isActive, page, limit });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.costCentersService.findOne(id);
  }

  @Post()
  create(@Body() dto: any, @CurrentUser('id') userId: string) {
    return this.costCentersService.create(dto, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.costCentersService.update(id, dto);
  }
}
