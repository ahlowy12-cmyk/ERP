import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;
}
