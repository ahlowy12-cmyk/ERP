import { IsMongoId, IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator';

export class UpdateUserRoleDto {
  @IsMongoId()
  @IsNotEmpty()
  roleId!: string;
}

export class UpdateUserStatusDto {
  @IsString()
  @IsIn(['Active', 'Inactive', 'Suspended'])
  @IsNotEmpty()
  status!: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
