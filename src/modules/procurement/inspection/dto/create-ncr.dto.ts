import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class CreateNcrDto {
  @IsEnum(['Low', 'Medium', 'High']) @IsNotEmpty() severity!: string;
  @IsString() @IsNotEmpty() description!: string;
  @IsString() @IsOptional() rootCause?: string;
  @IsString() @IsOptional() correctiveAction?: string;
}
