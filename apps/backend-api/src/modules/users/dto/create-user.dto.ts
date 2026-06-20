import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export const supportedUserRoles = [
  'super_admin',
  'admin',
  'dispatcher',
  'finance',
  'support',
  'driver',
  'customer',
  'merchant_admin'
] as const;

export const userStatuses = ['ACTIVE', 'INVITED', 'SUSPENDED'] as const;

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  @IsIn(supportedUserRoles)
  role!: (typeof supportedUserRoles)[number];

  @IsOptional()
  @IsString()
  @IsIn(userStatuses)
  status?: (typeof userStatuses)[number];

  @IsString()
  @MinLength(6)
  temporaryPassword!: string;

  @IsOptional()
  @IsBoolean()
  linkProfile?: boolean;

  @IsOptional()
  @IsString()
  defaultAddress?: string;
}
