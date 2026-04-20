import { IsOptional, IsString } from 'class-validator';

export class FailDeliveryDto {
  @IsString()
  failureReason!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
