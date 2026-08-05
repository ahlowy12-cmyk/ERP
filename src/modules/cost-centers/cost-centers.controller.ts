import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { CostCentersService } from './cost-centers.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { UserRole } from 'src/DB/enums/user.enum';

@Controller('finance/cost-centers')
export class CostCentersController {
  constructor(private readonly costCentersService: CostCentersService) {}

  @Get()
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager, UserRole.ProjectManager)
  @RequirePermissions('view:finance')
  findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.costCentersService.findAll({ type, status, search, page, limit });
  }

  @Post()
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('edit:finance')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: any, @CurrentUser('id') userId: string) {
    return this.costCentersService.create(dto, userId);
  }

  @Put(':code')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('edit:finance')
  updateByCode(@Param('code') code: string, @Body() dto: any) {
    return this.costCentersService.updateByCode(code, dto);
  }

  @Delete(':code')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager)
  @RequirePermissions('edit:finance')
  removeByCode(@Param('code') code: string) {
    return this.costCentersService.removeByCode(code);
  }

  @Patch(':code/toggle-status')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('edit:finance')
  toggleStatus(@Param('code') code: string) {
    return this.costCentersService.toggleStatus(code);
  }
}
