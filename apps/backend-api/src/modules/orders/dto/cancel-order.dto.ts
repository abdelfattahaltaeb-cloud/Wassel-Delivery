import { IsOptional, IsString } from 'class-validator';

export class CancelOrderDto {
  @IsString()
  cancellationReason!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
