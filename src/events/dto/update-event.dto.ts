import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';
import { IsArray, IsString } from 'class-validator';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @IsArray()
  @IsString({ each: true })
  sponsors: string[];
}
