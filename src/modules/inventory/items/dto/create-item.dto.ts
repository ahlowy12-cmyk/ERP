import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { ItemType } from 'src/DB/models/inventory-item.model';

export class CreateInventoryItemDto {
  @IsString() @IsNotEmpty() itemCode!: string;
  @IsString() @IsNotEmpty() itemName!: string;
  @IsString() @IsNotEmpty() uom!: string;
  @IsEnum(ItemType) @IsOptional() itemType?: ItemType;
  @IsString() @IsOptional() category?: string;

  @IsNumber() @Min(0) @Type(() => Number) quantity!: number;
  @IsNumber() @Min(0) @Type(() => Number) minQuantity!: number;
  @IsNumber() @Min(0) @Type(() => Number) unitPrice!: number;

  @IsString() @IsOptional() location?: string;
}
