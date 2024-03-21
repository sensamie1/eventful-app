import { IsString, IsNotEmpty, IsArray, IsDateString, IsOptional } from 'class-validator';

export class CreateEventDto {
  @IsString()
  image_url: string;

  @IsNotEmpty()
  @IsString()
  event_name: string;

  @IsNotEmpty()
  @IsString()
  event_type: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsOptional()
  @IsArray()
  sponsors: string[];

  @IsNotEmpty()
  @IsDateString()
  event_date: Date;

  @IsNotEmpty()
  @IsDateString()
  reminder_date: Date;

}
