import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsMongoId,
} from 'class-validator';

export class TransferItemDto {
  @IsString() @IsNotEmpty() itemCode!: string;
  @IsString() @IsNotEmpty() itemName!: string;
  @IsString() @IsNotEmpty() uom!: string;
  @IsNumber() @Min(0.001) quantity!: number;
}

export class CreateTransferDto {
  @IsMongoId() @IsNotEmpty() fromWarehouseId!: string;
  @IsMongoId() @IsNotEmpty() toWarehouseId!: string;
  @IsString() @IsNotEmpty() requestedBy!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  @IsNotEmpty()
  items!: TransferItemDto[];
}
