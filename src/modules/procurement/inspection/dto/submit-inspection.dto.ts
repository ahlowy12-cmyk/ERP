import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  IsEnum,
  IsDate,
  IsOptional,
} from 'class-validator';

export class InspectedItemDto {
  @IsString() @IsNotEmpty() itemCode!: string;
  @IsString() @IsNotEmpty() itemName!: string;
  @IsNumber() @IsNotEmpty() quantityOrdered!: number;
  @IsNumber() @IsNotEmpty() quantityAccepted!: number;
  @IsNumber() @IsNotEmpty() quantityRejected!: number;
  @IsString() @IsOptional() uom?: string;
  @IsEnum(['Pending', 'Passed', 'Failed']) @IsOptional() status?: string;
}

export class SubmitInspectionDto {
  @IsString() @IsNotEmpty() inspectorName!: string;
  @Type(() => Date) @IsDate() @IsNotEmpty() inspectionDate!: Date;
  @IsEnum(['Accepted', 'Rejected', 'Conditional'])
  @IsNotEmpty()
  status!: string;
  @IsString() @IsOptional() notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InspectedItemDto)
  @IsNotEmpty()
  items!: InspectedItemDto[];
}
