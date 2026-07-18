import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsOptional,
  IsMongoId,
  IsDate,
} from 'class-validator';

export class MrvItemDto {
  @IsString() @IsNotEmpty() itemCode!: string;
  @IsString() @IsNotEmpty() itemName!: string;
  @IsNumber() @Min(0) quantityOrdered!: number;
  @IsNumber() @Min(0.001) quantityReceived!: number;
  @IsNumber() @Min(0) unitPrice!: number;
  @IsNumber() @Min(0) totalPrice!: number;
  @IsString() @IsNotEmpty() uom!: string;
}

export class CreateMrvDto {
  @IsMongoId() @IsOptional() poId?: string;
  @IsString() @IsOptional() poNumber?: string;
  @IsMongoId() @IsNotEmpty() warehouseId!: string;
  @Type(() => Date) @IsDate() @IsOptional() receivedDate?: Date;
  @IsString() @IsNotEmpty() receivedBy!: string;
  @IsString() @IsNotEmpty() supplierName!: string;
  @IsString() @IsOptional() chargeType?: string;
  @IsString() @IsOptional() projectId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MrvItemDto)
  @IsNotEmpty()
  items!: MrvItemDto[];
}
