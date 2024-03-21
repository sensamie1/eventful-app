import { IsEmail, IsString } from 'class-validator';

export class CreatorSignInDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
