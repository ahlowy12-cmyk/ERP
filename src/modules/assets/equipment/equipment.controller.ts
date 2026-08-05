import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto, UpdateEquipmentStatusDto } from './dto/equipment.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('assets/equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  // GET /api/v1/assets/equipment
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.equipmentService.findAll({ search, category, status, page, limit });
  }

  // GET /api/v1/assets/equipment/stats
  @Get('stats')
  getStats() {
    return this.equipmentService.getStats();
  }

  // GET /api/v1/assets/equipment/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.equipmentService.findOne(id);
  }

  // POST /api/v1/assets/equipment
  @Post()
  create(
    @Body() dto: CreateEquipmentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.equipmentService.create(dto, userId);
  }

  // PATCH /api/v1/assets/equipment/:id/status
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEquipmentStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.equipmentService.updateStatus(id, dto, userId);
  }

  // DELETE /api/v1/assets/equipment/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.equipmentService.remove(id);
  }
}
