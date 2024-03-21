import { IsNotEmpty, IsDate } from 'class-validator';

export class AttendEventDto {
  @IsNotEmpty()
  @IsDate()
  reminder_date: Date;
}
