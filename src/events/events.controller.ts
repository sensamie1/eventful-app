import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Request, UploadedFile, ValidationPipe, UseInterceptors, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { AttendEventDto } from './dto/attend-event.dto';
import { AdmittedDto } from './dto/admitted.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventsGuard } from './events.guard';
import { Cron } from '@nestjs/schedule';


@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('creators/events/upload-image')
  @UseGuards(EventsGuard)
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@Request() req, @UploadedFile() file: Express.Multer.File) {
    // Extract the bearer token from the request headers
    const token = req.headers.authorization.replace('Bearer ', '');
    return this.eventsService.uploadImage(token, file);
  }

  @Post('creators/events/create')
  @UseGuards(EventsGuard)
  create(@Request() req, @Body(new ValidationPipe()) createEventDto: CreateEventDto) {
    // Extract the bearer token from the request headers
    const token = req.headers.authorization.replace('Bearer ', '');
    return this.eventsService.createEvent(token, createEventDto);
  }

  @Get('/events')
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('name') name?: string,
    @Query('type') type?: string
  ) {
    return this.eventsService.findAll(page, limit, name, type);
  }

  @Get('events/:id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }
  

  @Get('creators/events/get')
  findAllForCreators(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('name') name?: string,
    @Query('type') type?: string
  ) {
    return this.eventsService.findAll(page, limit, name, type);
  }

  @Get('users/events/get')
  findAllForUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('name') name?: string,
    @Query('type') type?: string
  ) {
    return this.eventsService.findAll(page, limit, name, type);
  }

  @Get('creators/events/:id')
  findOneForCreators(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Get('users/events/:id')
  findOneForUsers(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Get('creators/my-events/get')
  @UseGuards(EventsGuard)
  findAllCreatorEvents(
    @Request() req, 
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('name') name?: string,
    @Query('type') type?: string
  ) {
    // Extract the bearer token from the request headers
    const token = req.headers.authorization.replace('Bearer ', '');
    return this.eventsService.findAllCreatorEvents(token, page, limit, name, type);
  }

  @Post('users/events/:eventId/book')
  @UseGuards(EventsGuard)
  async bookEventTicket(
    @Param('eventId') eventId: string,
    @Request() req, 
    @Body() attendDto: AttendEventDto, // AttendEventDto contains user ID and reminder date
  ) {
    // Extract the bearer token from the request headers
    const token = req.headers.authorization.replace('Bearer ', '');
    const { reminder_date } = attendDto;
    return this.eventsService.addUserToAttendees(token, eventId, reminder_date);
  }

  @Get('creators/events/:eventId/share')
  @UseGuards(EventsGuard)
  async craetorShareEventUrl(
    @Param('eventId') eventId: string,
    @Request() req, 
  ) {
    // Extract the bearer token from the request headers
    const token = req.headers.authorization.replace('Bearer ', '');
    return this.eventsService.generateEventUrl(token, eventId);
  }

  @Get('users/events/:eventId/share')
  @UseGuards(EventsGuard)
  async UserShareEventUrl(
    @Param('eventId') eventId: string,
    @Request() req, 
  ) {
    // Extract the bearer token from the request headers
    const token = req.headers.authorization.replace('Bearer ', '');
    return this.eventsService.generateEventUrl(token, eventId);
  }


  @Get('creators/events/:eventId/attendees')
  @UseGuards(EventsGuard)
  async getEventAttendees(
    @Param('eventId') eventId: string, 
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    ) {
    // Extract the bearer token from the request headers
    const token = req.headers.authorization.replace('Bearer ', '');
      return this.eventsService.getEventAttendees(token, eventId, page, limit);
  }

  @Get('creators/all-events/attendees')
  @UseGuards(EventsGuard)
  async getAllEventAttendees(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    // Extract the bearer token from the request headers
    const token = req.headers.authorization.replace('Bearer ', '');
      return this.eventsService.getAllEventAttendees(token, page, limit);
  }

  @Get('creators/events/:eventId/:userEmail/admit')
  @UseGuards(EventsGuard)
  async admitUser(
    @Param('eventId') eventId: string,
    @Param('userEmail') userEmail: string,
    @Request() req,
  ) {
    const admittedDto: AdmittedDto = { user_email: userEmail };
    // Extract the bearer token from the request headers
    const token = req.headers.authorization.replace('Bearer ', '');
    return this.eventsService.admitUserToEvent(token, eventId, admittedDto);
  }

  @Get('users/events/:eventId/:userEmail/details')
  @UseGuards(EventsGuard)
  async getUserEventDetails(
    @Param('eventId') eventId: string,
    @Param('userEmail') userEmail: string,
    @Request() req,
  ) {
    // Extract the bearer token from the request headers
    const token = req.headers.authorization.replace('Bearer ', '');
    return this.eventsService.getUserEventDetails(token, eventId, userEmail);
  }

  @Get('creators/events/:eventId/admitted')
  @UseGuards(EventsGuard)
  async getEventAdmitted(
    @Param('eventId') eventId: string, 
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    ) {
    // Extract the bearer token from the request headers
    const token = req.headers.authorization.replace('Bearer ', '');
      return this.eventsService.getEventAdmitted(token, eventId, page, limit);
  }

  @Get('creators/all-events/admitted')
  @UseGuards(EventsGuard)
  async getAllEventAdmitted(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 5,
  ) {
    // Extract the bearer token from the request headers
    const token = req.headers.authorization.replace('Bearer ', '');
      return this.eventsService.getAllEventAdmitted(token, page, limit);
  }

  @Patch('creators/events/:id')
  @UseGuards(EventsGuard)
  update(@Param('id') id: string, @Request() req, @Body() updateEventDto: UpdateEventDto) {
    // Extract the bearer token from the request headers
    const token = req.headers.authorization.replace('Bearer ', '');
    return this.eventsService.update(token, id, updateEventDto);
  }

  @Delete('creators/events/:id')
  @UseGuards(EventsGuard)
  remove(@Param('id') id: string, @Request() req, ) {
    // Extract the bearer token from the request headers
    const token = req.headers.authorization.replace('Bearer ', '');
    return this.eventsService.remove(token, id);
  }

  @Cron('00 07 * * *')
  handleCron() {
    this.eventsService.creatorsReminders()
    this.eventsService.usersReminders()
    console.log("Scheduled reminders sent.");
  }

}