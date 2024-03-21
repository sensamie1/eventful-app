import { Module } from '@nestjs/common';
import { CreatorsService } from './creators.service';
import { CreatorsController } from './creators.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CreatorSchema } from './entities/creator.entity';


@Module({
  imports: [MongooseModule.forFeature([{ name: 'Creator', schema: CreatorSchema }])],
  controllers: [CreatorsController],
  providers: [CreatorsService],
})
export class CreatorsModule {}
