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

export class CountItemDto {
  @IsString() @IsNotEmpty() itemCode!: string;
  @IsString() @IsNotEmpty() itemName!: string;
  @IsNumber() @Min(0) systemQuantity!: number;
  @IsNumber() @Min(0) countedQuantity!: number;
}

export class CreateCountDto {
  @IsMongoId() @IsNotEmpty() warehouseId!: string;
  @IsString() @IsNotEmpty() countedBy!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CountItemDto)
  @IsNotEmpty()
  items!: CountItemDto[];
}
