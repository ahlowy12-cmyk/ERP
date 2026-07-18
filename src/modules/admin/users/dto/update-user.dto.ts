import { IsString, IsOptional, IsMongoId, IsIn } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  fullNameAr?: string;

  @IsMongoId()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  employeeId?: string;

  @IsString()
  @IsIn(['ar', 'en'])
  @IsOptional()
  preferredLanguage?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  companyName?: string;
}
