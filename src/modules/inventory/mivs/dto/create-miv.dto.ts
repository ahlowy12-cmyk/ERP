import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  IsEnum,
  Min,
  IsOptional,
} from 'class-validator';

export class MivItemDto {
  @IsString() @IsNotEmpty() itemCode!: string;
  @IsString() @IsNotEmpty() itemName!: string;
  @IsString() @IsNotEmpty() uom!: string;
  @IsNumber() @Min(0.001) quantityRequested!: number;
  @IsNumber() @Min(0) unitPrice!: number;
  @IsString() @IsOptional() inventoryCreditAcc?: string;
  @IsString() @IsOptional() consumptionDebitAcc?: string;
}

export class CreateMivDto {
  @IsEnum(['Project', 'Cost Center', 'Rig', 'Workshop', 'Vehicle', 'Camp'])
  @IsNotEmpty()
  issueTo!: string;

  @IsString() @IsNotEmpty() destinationId!: string;
  @IsString() @IsOptional() referenceNumber?: string;
  @IsString() @IsNotEmpty() requestedBy!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MivItemDto)
  @IsNotEmpty()
  items!: MivItemDto[];
}
