import { IsOptional, IsString } from 'class-validator';

export class DeliverOrderDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  deliveredPhotoUrl?: string;

  @IsOptional()
  @IsString()
  otpCode?: string;

  @IsOptional()
  @IsString()
  recipientName?: string;
}
