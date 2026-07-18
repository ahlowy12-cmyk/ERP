import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  IsEnum,
  Min,
  IsMongoId,
  IsOptional,
} from 'class-validator';

export class AdjustmentItemDto {
  @IsString() @IsNotEmpty() itemCode!: string;
  @IsString() @IsNotEmpty() itemName!: string;
  @IsNumber() @Min(0) systemQuantity!: number;
  @IsNumber() @Min(0) adjustedQuantity!: number;
  @IsEnum(['Addition', 'Deduction']) @IsNotEmpty() adjustmentType!: string;
  @IsNumber() @Min(0) unitPrice!: number;
  @IsString() @IsOptional() reason?: string;
}

export class CreateAdjustmentDto {
  @IsMongoId() @IsNotEmpty() warehouseId!: string;
  @IsString() @IsNotEmpty() requestedBy!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdjustmentItemDto)
  @IsNotEmpty()
  items!: AdjustmentItemDto[];
}
