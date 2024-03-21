import { IsEmail, IsNotEmpty } from 'class-validator';

export class AdmittedDto {
  @IsNotEmpty()
  @IsEmail()
  user_email: string;
}
