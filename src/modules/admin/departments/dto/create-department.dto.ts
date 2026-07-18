import { IsString, IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  nameEn!: string;

  @IsString()
  @IsNotEmpty()
  nameAr!: string;

  @IsMongoId()
  @IsOptional()
  parentId?: string;

  @IsMongoId()
  @IsOptional()
  managerId?: string;
}

export class UpdateDepartmentDto {
  @IsString()
  @IsOptional()
  nameEn?: string;

  @IsString()
  @IsOptional()
  nameAr?: string;

  @IsMongoId()
  @IsOptional()
  parentId?: string;

  @IsMongoId()
  @IsOptional()
  managerId?: string;
}
