import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsIn,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FindPrsDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() search?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() limit?: number;

  @IsOptional() @IsString() sortBy?: string;
  @IsOptional() @IsIn(['ASC', 'DESC']) sortOrder?: 'ASC' | 'DESC';
}
