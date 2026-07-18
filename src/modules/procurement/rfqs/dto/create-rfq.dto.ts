import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsDate,
  IsOptional,
  IsEmail,
  IsMongoId,
} from 'class-validator';

export class RfqVendorDto {
  @IsMongoId() @IsNotEmpty() vendorId!: string;
  @IsString() @IsNotEmpty() vendorName!: string;
  @IsEmail() @IsOptional() contactEmail?: string;
}

export class CreateRfqDto {
  @IsMongoId() @IsNotEmpty() purchaseRequestId!: string;
  @IsString() @IsNotEmpty() title!: string;

  @Type(() => Date) @IsDate() @IsNotEmpty() deadlineDate!: Date;
  @Type(() => Date) @IsDate() @IsOptional() requiredDeliveryDate?: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RfqVendorDto)
  @IsNotEmpty()
  vendors!: RfqVendorDto[];
}
