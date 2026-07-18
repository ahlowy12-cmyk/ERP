import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class ApprovePoStepDto {
  @IsEnum(['Procurement Manager', 'Finance Director', 'CEO'])
  @IsNotEmpty()
  role!: string;

  @IsString()
  @IsNotEmpty()
  approverName!: string;

  @IsString()
  @IsOptional()
  comments?: string;
}
