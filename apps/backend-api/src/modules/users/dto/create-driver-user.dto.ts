import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export const transportMethods = ['CAR', 'BIKE', 'WALK', 'OTHER'] as const;

export class CreateDriverUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  secondPhone?: string;

  @IsString()
  city!: string;

  @IsString()
  serviceArea!: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsString()
  @IsIn(transportMethods)
  transportMethod!: (typeof transportMethods)[number];

  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @IsString()
  @MinLength(6)
  temporaryPassword!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
