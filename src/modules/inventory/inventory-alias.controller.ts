import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { UserRole } from 'src/DB/enums/user.enum';
import { MrvsService } from './mrvs/mrvs.service';
import { MivsService } from './mivs/mivs.service';

@Controller('inventory')
export class InventoryAliasController {
  constructor(
    private readonly mrvsService: MrvsService,
    private readonly mivsService: MivsService,
  ) {}

  // POST /api/v1/inventory/transactions — (Alias for MRV / MIV creation based on type)
  @Post('transactions')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.OperationsManager, UserRole.ProjectManager)
  @RequirePermissions('edit:inventory')
  async createTransaction(
    @Body() dto: any,
    @CurrentUser('id') userId: string,
  ) {
    const type = dto.type || dto.transactionType;
    if (type === 'Receipt' || type === 'IN') {
      return this.mrvsService.create(dto, userId);
    } else if (type === 'Issue' || type === 'OUT') {
      return this.mivsService.create(dto, userId);
    } else {
      throw new BadRequestException('Transaction type must be Receipt/IN or Issue/OUT');
    }
  }
}
