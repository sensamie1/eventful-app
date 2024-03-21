import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSchema } from './entities/event.entity';
import { MulterModule } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary-service';
import { multerOptions } from './multer-config';
import { UserSchema } from '../users/entities/user.entity';
import { CreatorSchema } from '../creators/entities/creator.entity';
import { UsersModule } from '../users/users.module';
import { CreatorsModule } from '../creators/creators.module';
import { CreatorsService } from '../creators/creators.service';
import { UsersService } from '../users/users.service';
import { ScheduleModule } from '@nestjs/schedule';



@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Event', schema: EventSchema }, { name: 'User', schema: UserSchema }, { name: 'Creator', schema: CreatorSchema }]), 
    MulterModule.register(multerOptions),
    UsersModule,
    CreatorsModule,
    ScheduleModule.forRoot()
  ],
  controllers: [EventsController],
  providers: [EventsService, CloudinaryService, CreatorsService, UsersService],
})
export class EventsModule {}
