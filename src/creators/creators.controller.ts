import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe, Query } from '@nestjs/common';
import { CreatorsService } from './creators.service';
import { CreateCreatorDto } from './dto/create-creator.dto';
import { CreatorSignInDto } from './dto/signin.dto';
// import { UpdateCreatorDto } from './dto/update-creator.dto';

@Controller('creators')
export class CreatorsController {
  constructor(private readonly creatorsService: CreatorsService) {}

  @Post('signup')
  create(@Body(new ValidationPipe()) createCreatorDto: CreateCreatorDto) {
    return this.creatorsService.create(createCreatorDto);
  }

  @Get('verify-email') // Define the verify-email route
  verifyEmail(@Query('token') token: string) {
    return this.creatorsService.verifyEmail(token);
  }

  @Post('resend-verification-email')
  reVerifyEmail(@Body('email', new ValidationPipe()) email: string) {
    return this.creatorsService.reVerifyEmail(email);
  }

  @Get()
  findAll() {
    return this.creatorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.creatorsService.findOne(id);
  }

  @Post('signin')
  signIn(@Body(new ValidationPipe()) signInDto: CreatorSignInDto) {
    return this.creatorsService.signIn(signInDto);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateCreatorDto: UpdateCreatorDto) {
  //   return this.creatorsService.update(+id, updateCreatorDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.creatorsService.remove(+id);
  // }
}
