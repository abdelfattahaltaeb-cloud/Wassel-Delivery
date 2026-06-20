import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterCustomerDto {
  @IsString()
  name!: string;

  @IsString()
  phone!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(8)
  confirmPassword!: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsString()
  defaultArea?: string;

  @IsOptional()
  @IsString()
  defaultPickupAddress?: string;
}
