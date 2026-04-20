import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator';

const stopTypes = ['PICKUP', 'DROPOFF'] as const;
const paymentCollectionTypes = ['COD', 'PREPAID'] as const;

export class CreateOrderStopDto {
  @Type(() => Number)
  @IsNumber()
  sequence!: number;

  @IsString()
  @IsIn(stopTypes)
  type!: (typeof stopTypes)[number];

  @IsString()
  label!: string;

  @IsString()
  addressLine!: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  merchantId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  zoneId?: string;

  @IsOptional()
  @IsString()
  serviceAreaId?: string;

  @Type(() => Number)
  @IsNumber()
  totalAmount!: number;

  @Type(() => Number)
  @IsNumber()
  codAmount!: number;

  @IsOptional()
  @IsString()
  @IsIn(paymentCollectionTypes)
  paymentCollectionType?: (typeof paymentCollectionTypes)[number];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderStopDto)
  stops!: CreateOrderStopDto[];
}
