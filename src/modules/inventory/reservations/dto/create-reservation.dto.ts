import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  IsDate,
  Min,
  IsOptional,
} from 'class-validator';

export class ReservationItemDto {
  @IsString() @IsNotEmpty() itemCode!: string;
  @IsString() @IsNotEmpty() itemName!: string;
  @IsString() @IsNotEmpty() uom!: string;
  @IsNumber() @Min(0.001) requestedQuantity!: number;
  @IsNumber() @Min(0) unitPrice!: number;
}

export class CreateReservationDto {
  @IsString() @IsNotEmpty() projectCode!: string;
  @IsString() @IsNotEmpty() projectName!: string;
  @IsString() @IsNotEmpty() requestedBy!: string;

  @Type(() => Date) @IsDate() @IsNotEmpty() requiredDate!: Date;
  @IsString() @IsOptional() notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReservationItemDto)
  @IsNotEmpty()
  items!: ReservationItemDto[];
}
