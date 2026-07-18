import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDate,
  Min,
  IsMongoId,
} from 'class-validator';

export class QuotationItemDto {
  @IsString() @IsNotEmpty() itemCode!: string;
  @IsString() @IsNotEmpty() itemName!: string;
  @IsString() @IsNotEmpty() uom!: string;
  @IsNumber() @Min(0.001) quantity!: number;
  @IsNumber() @Min(0) unitPrice!: number;
  @IsNumber() @Min(0) totalPrice!: number;
}

export class AddQuotationDto {
  @IsMongoId() @IsNotEmpty() vendorId!: string;
  @IsString() @IsNotEmpty() vendorName!: string;

  @Type(() => Date) @IsDate() @IsOptional() validityDate?: Date;
  @IsString() @IsOptional() paymentTerms?: string;

  @IsNumber() @Min(0) price!: number;
  @IsNumber() @Min(0) subtotal!: number;
  @IsNumber() @Min(0) taxPercent!: number;
  @IsNumber() @Min(0) taxAmount!: number;
  @IsNumber() @Min(0) totalAmount!: number;
  @IsNumber() @Min(1) deliveryWeeks!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  @IsNotEmpty()
  items!: QuotationItemDto[];
}
