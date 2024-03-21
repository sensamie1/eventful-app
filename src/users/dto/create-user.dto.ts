import { IsString, IsEmail, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  readonly first_name: string;

  @IsString()
  readonly last_name: string;

  @IsEmail()
  readonly email: string;

  @IsString()
  @MinLength(6) // Minimum password length of 6 characters
  readonly password: string;
}
