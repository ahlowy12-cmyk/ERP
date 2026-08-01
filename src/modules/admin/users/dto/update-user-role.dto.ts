import {
  IsMongoId,
  IsNotEmpty,
  IsString,
  IsIn,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

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

  // TASK 8: تاريخ انتهاء التعليق (اختياري — يُستخدم فقط عند status = 'Suspended')
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  suspendUntil?: Date;
}

