import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsMongoId,
  IsIn,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*])[A-Za-z\d@#$!%*]{8,128}$/;

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @IsOptional()
  fullNameAr?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_REGEX, {
    message: 'Password must contain uppercase, lowercase, number and special char',
  })
  @IsOptional()
  password?: string;  // إذا لم يُرسَل، سيتم توليد كلمة سر مؤقتة تلقائياً

  @IsMongoId()
  @IsNotEmpty()
  roleId!: string;

  @IsMongoId()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  employeeId?: string;

  @IsString()
  @IsIn(['Active', 'Inactive', 'Pending'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsIn(['ar', 'en'])
  @IsOptional()
  preferredLanguage?: string;
}
