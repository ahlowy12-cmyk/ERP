import {
  Controller, Get, Post, Patch, Body, Param, Query,
} from '@nestjs/common';
import { ProjectResourcesService } from './project-resources.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('projects')
export class ProjectResourcesController {
  constructor(private readonly svc: ProjectResourcesService) {}

  // ── Equipment Assignments ─────────────────────────────────────────────────
  @Get(':code/equipment')
  getEquipment(@Param('code') code: string) {
    return this.svc.getEquipmentAssignments(code);
  }

  @Post(':code/equipment')
  createEquipment(
    @Param('code') code: string,
    @Body() dto: any,
    @CurrentUser('id') userId: string,
  ) {
    return this.svc.createEquipmentAssignment(code, dto, userId);
  }

  // ── Material Consumptions ────────────────────────────────────────────────
  @Get(':code/materials')
  getMaterials(@Param('code') code: string) {
    return this.svc.getMaterialConsumptions(code);
  }

  @Post(':code/materials')
  createMaterial(
    @Param('code') code: string,
    @Body() dto: any,
    @CurrentUser('id') userId: string,
  ) {
    return this.svc.createMaterialConsumption(code, dto, userId);
  }

  // ── Labor Records ────────────────────────────────────────────────────────
  @Get(':code/labor')
  getLabor(@Param('code') code: string) {
    return this.svc.getLaborRecords(code);
  }

  @Post(':code/labor')
  createLabor(
    @Param('code') code: string,
    @Body() dto: any,
    @CurrentUser('id') userId: string,
  ) {
    return this.svc.createLaborRecord(code, dto, userId);
  }

  // ── Equipment Transfers ──────────────────────────────────────────────────
  @Get(':code/transfers')
  getTransfers(@Param('code') code: string) {
    return this.svc.getEquipmentTransfers(code);
  }

  @Post(':code/transfers')
  createTransfer(
    @Param('code') code: string,
    @Body() dto: any,
    @CurrentUser('id') userId: string,
  ) {
    return this.svc.createEquipmentTransfer(code, dto, userId);
  }

  @Patch('transfers/:id/status')
  updateTransferStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.svc.updateTransferStatus(id, status);
  }
}
