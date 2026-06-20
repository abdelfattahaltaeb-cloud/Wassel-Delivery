import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCustomerUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsString()
  defaultAddress?: string;

  @IsString()
  @MinLength(6)
  temporaryPassword!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
