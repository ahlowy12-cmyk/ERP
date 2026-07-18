import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ItemsService } from './items.service';
import { CreateInventoryItemDto } from './dto/create-item.dto';
@Controller('inventory/items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  async create(@Body() createDto: CreateInventoryItemDto) {
    return this.itemsService.create(createDto);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.itemsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return this.itemsService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.itemsService.remove(id);
  }

  // مسار فحص التوافر
  @Get(':itemCode/availability')
  async checkAvailability(@Param('itemCode') itemCode: string) {
    return this.itemsService.checkAvailability(itemCode);
  }

  // مسار الاستيراد المجمع
  @Post('bulk-import')
  @UseInterceptors(FileInterceptor('file'))
  async bulkImport(@UploadedFile() file: Express.Multer.File) {
    return this.itemsService.bulkImport(file);
  }
}
