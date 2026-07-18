import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class UpdatePrStatusDto {
  @IsEnum([
    'Draft',
    'Pending Approval',
    'Approved',
    'Rejected',
    'RFQ Created',
    'Cancelled',
  ])
  @IsNotEmpty()
  status!: string;

  @IsString()
  @IsOptional()
  approvedBy?: string;

  @IsString()
  @IsOptional()
  comments?: string;
}
