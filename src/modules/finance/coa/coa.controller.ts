import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { CoaService } from './coa.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { UserRole } from 'src/DB/enums/user.enum';

@Controller('finance/coa')
export class CoaController {
  constructor(private readonly coaService: CoaService) {}

  @Get()
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('view:finance')
  findAll(
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
    @Query('parentCode') parentCode?: string,
    @Query('leafOnly') leafOnly?: string,
  ) {
    const isActiveBool = isActive !== undefined ? isActive === 'true' : undefined;
    const leafOnlyBool = leafOnly !== undefined ? leafOnly === 'true' : undefined;
    return this.coaService.findAll({ type, isActive: isActiveBool, parentCode, leafOnly: leafOnlyBool });
  }

  @Post('seed')
  @Roles(UserRole.SuperAdmin)
  @RequirePermissions('edit:finance')
  seedDefaultAccounts() {
    return this.coaService.seedDefaultAccounts();
  }

  @Get(':id')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('view:finance')
  findOne(@Param('id') id: string) {
    return this.coaService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('edit:finance')
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.coaService.create(dto, user._id || user.id);
  }

  @Patch(':id')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('edit:finance')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.coaService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SuperAdmin)
  @RequirePermissions('edit:finance')
  remove(@Param('id') id: string) {
    return this.coaService.remove(id);
  }

  // Alias: GET /api/v1/finance/accounts → same as GET /finance/coa (frontend compatibility)
  @Get('/accounts-alias')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('view:finance')
  findAllAlias(@Query('type') type?: string, @Query('parentId') parentId?: string) {
    return this.coaService.findAll({ type, parentCode: parentId });
  }
}
