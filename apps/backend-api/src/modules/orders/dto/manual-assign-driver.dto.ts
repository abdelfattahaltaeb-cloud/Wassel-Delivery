import { IsOptional, IsString } from 'class-validator';

export class ManualAssignDriverDto {
  @IsString()
  driverId!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
