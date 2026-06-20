import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

import { supportedUserRoles, userStatuses } from './create-user.dto';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @IsIn(supportedUserRoles)
  role?: (typeof supportedUserRoles)[number];

  @IsOptional()
  @IsString()
  @IsIn(userStatuses)
  status?: (typeof userStatuses)[number];
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(6)
  temporaryPassword!: string;
}
