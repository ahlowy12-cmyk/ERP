import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  fullNameAr?: string;

  @IsString()
  @IsIn(['ar', 'en'])
  @IsOptional()
  preferredLanguage?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;
}
