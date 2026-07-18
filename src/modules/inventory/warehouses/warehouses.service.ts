import { Injectable, NotFoundException } from '@nestjs/common';
import { WarehouseRepository } from 'src/DB/repositories/warehouse.repository';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(private readonly _WarehouseRepository: WarehouseRepository) {}

  async create(data: CreateWarehouseDto) {
    const warehouse = await this._WarehouseRepository.create(data);
    return { message: 'Warehouse created successfully', data: warehouse };
  }

  async findAll(page: number = 1, limit: number = 20) {
    return await this._WarehouseRepository.findAll({
      paginate: { page, limit },
    });
  }

  async update(id: string, data: any) {
    const warehouse = await this._WarehouseRepository.findOneAndUpdate(
      { _id: id },
      data,
    );
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    return { message: 'Warehouse updated', data: warehouse };
  }
}
