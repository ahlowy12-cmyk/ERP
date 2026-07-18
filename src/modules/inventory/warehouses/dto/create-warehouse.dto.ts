import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class CreateWarehouseDto {
  @IsString() @IsNotEmpty() code!: string;
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsOptional() location?: string;
  @IsEnum(['Active', 'Inactive']) @IsOptional() status?: string;
}
