import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CreatorsModule } from './creators/creators.module';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsModule } from './events/events.module';
import { UsersService } from './users/users.service';
import { UserSchema } from './users/entities/user.entity';
import { UserJwtAuthGuard } from './user-jwt-auth.guard';
import { CreatorsService } from './creators/creators.service';
import { CreatorSchema } from './creators/entities/creator.entity';
import { CreatorJwtAuthGuard } from './creator-jwt-auth.guard';
import { EventsService } from './events/events.service';
import { EventSchema } from './events/entities/event.entity';
import { CloudinaryService } from './events/cloudinary-service';




@Module({
  imports: [
    UsersModule, 
    CreatorsModule,
    EventsModule,
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }, { name: 'Creator', schema: CreatorSchema }, { name: 'Event', schema: EventSchema }]),
    MongooseModule.forRoot(process.env.MONGODB_URL)
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    UsersService, 
    CreatorsService, 
    EventsService, 
    UserJwtAuthGuard, 
    CreatorJwtAuthGuard, 
    CloudinaryService
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply the middleware to the desired routes
    consumer.apply(UserJwtAuthGuard).forRoutes(
      'views/users/logout',
      'views/users/user-home', 
      'views/users/user-auth-terms',
      'views/users/users-events',
      'views/users/my-events',
      'views/users/events/:id',
      'views/users/events/:id/book'
    );
    consumer.apply(CreatorJwtAuthGuard).forRoutes(
      'views/creators/logout',
      'views/creators/creator-home', 
      'views/creators/creator-auth-terms',
      'views/creators/events/upload-image',
      'views/creators/events/create',
      'views/creators/creators-events',
      'views/creators/events/:id',
      'views/creators/my-events',
      'views/creators/my-event/:id',
      'views/creators/my-event/:id/admit',
      'views/creators/my-event/:id/:userEmail/admit'
    );
  }
}
