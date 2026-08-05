import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto, UpdateContractStatusDto } from './dto/contract.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('workflow/contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  // GET /api/v1/workflow/contracts
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('clientName') clientName?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.contractsService.findAll({ search, status, clientName, page, limit });
  }

  // GET /api/v1/workflow/contracts/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  // POST /api/v1/workflow/contracts
  @Post()
  create(
    @Body() dto: CreateContractDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.contractsService.create(dto, userId);
  }

  // PATCH /api/v1/workflow/contracts/:id
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateContractDto>,
    @CurrentUser('id') userId: string,
  ) {
    return this.contractsService.update(id, dto, userId);
  }

  // PATCH /api/v1/workflow/contracts/:id/status  ← ⚡ Auto-Engine Trigger
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateContractStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.contractsService.updateStatus(id, dto, userId);
  }

  // DELETE /api/v1/workflow/contracts/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contractsService.remove(id);
  }
}
