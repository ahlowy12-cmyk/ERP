import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*])[A-Za-z\d@#$!%*]{8,128}$/;
const PASSWORD_MESSAGE =
  'Password must contain at least 1 uppercase, 1 lowercase, 1 number and 1 special character (@#$!%*)';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  newPassword!: string;
}
