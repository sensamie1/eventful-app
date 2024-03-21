import { IsEmail, IsString } from 'class-validator';

export class UserSignInDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
