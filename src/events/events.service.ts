import { Injectable, NotFoundException, ConflictException, BadRequestException, UnauthorizedException, GoneException, HttpStatus, HttpException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { AdmittedDto } from './dto/admitted.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from './entities/event.entity';
import { Creator, CreatorDocument } from '../creators/entities/creator.entity';
import { User, UserDocument } from '../users/entities/user.entity';
// import * as QRCode from 'qrcode';
import { sendTicketEmail } from './events-email.service';
import { sendReminderEmail } from './events-reminder.service';
import { CloudinaryService } from './cloudinary-service';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
// import { TokenService } from './token-service';
// import  fs from 'fs';


@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    private readonly cloudinaryService: CloudinaryService, // Inject Cloudinary service
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Creator.name) private readonly creatorModel: Model<CreatorDocument>
  ) {}

  async uploadImage(token: string, file: Express.Multer.File) {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
      // console.log(decodedToken);

      const creatorId = decodedToken._id

      // Check if the Id exists in the Creator collection
      const creator = await this.creatorModel.findById(creatorId);
      if (!creator) {
        throw new UnauthorizedException('You are unauthorized.');
      }
      const imageUrl = await this.cloudinaryService.uploadImage(file);
      return {
        message: "Image uploaded succesfully. Copy url below for use in event creation.",
        image_url: imageUrl 
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError' || 'JsonWebTokenError') {
        throw new UnauthorizedException(error);
      } else {
        console.error('Error creating event:', error);
        throw new Error('Error creating event.');
      }
    }
    
  }

  async createEvent(token: string, createEventDto: CreateEventDto) {
    try {
      console.log(createEventDto);
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

      console.log(decodedToken);
      const creatorId = decodedToken._id

      // Check if the Id exists in the Creator collection
      const creator = await this.creatorModel.findById(creatorId);
      if (!creator) {
        throw new HttpException('You are unauthorized.', HttpStatus.UNAUTHORIZED);
      }
      const currentDate = new Date();
      const eventDate = new Date(createEventDto.event_date);
      const reminderDate = new Date(createEventDto.reminder_date);
      if (eventDate <= currentDate || reminderDate <= currentDate) {
        throw new HttpException('Event date or reminder date must be in the future.', HttpStatus.BAD_REQUEST);
      }

      // Check if an event with the same name, date, and location already exists
      const existingEvent = await this.eventModel.findOne({
        event_name: createEventDto.event_name,
        event_date: createEventDto.event_date,
        location: createEventDto.location,
      }).exec();

      if (existingEvent) {
        throw new HttpException('An event with the same name, date, and location already exists.', HttpStatus.CONFLICT);
      }

      const createdEvent = await this.eventModel.create({
        image_url: createEventDto.image_url,
        event_name: createEventDto.event_name,
        event_type: createEventDto.event_type,
        description: createEventDto.description,
        location: createEventDto.location,
        sponsors: createEventDto.sponsors,
        creator: creatorId,
        event_date: createEventDto.event_date,
        reminder_date: createEventDto.reminder_date
      })
      
      // Return success response
      return {
        message: 'Event created successfully',
        // data: savedEvent,
        data: createdEvent,
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
        if (error.name === 'TokenExpiredError' || 'JsonWebTokenError') {
          throw new HttpException(error, HttpStatus.UNAUTHORIZED);
        } else {
          console.error('Error creating event:', error);
          throw new Error('Error creating event.');
        }
      }
  }

  async createViewsEvent(token: string, createEventDto: any) {
    try {
      console.log(createEventDto);
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

      console.log(decodedToken);
      const creatorId = decodedToken._id

      // Check if the Id exists in the Creator collection
      const creator = await this.creatorModel.findById(creatorId);
      if (!creator) {
        throw new HttpException('You are unauthorized.', HttpStatus.UNAUTHORIZED);
      }
      const currentDate = new Date();
      const eventDate = new Date(createEventDto.event_date);
      const reminderDate = new Date(createEventDto.reminder_date);
      if (eventDate <= currentDate || reminderDate <= currentDate) {
        throw new HttpException('Event date or reminder date must be in the future.', HttpStatus.BAD_REQUEST);
      }

      // Check if an event with the same name, date, and location already exists
      const existingEvent = await this.eventModel.findOne({
        event_name: createEventDto.event_name,
        event_date: createEventDto.event_date,
        location: createEventDto.location,
      }).exec();

      if (existingEvent) {
        throw new HttpException('An event with the same name, date, and location already exists.', HttpStatus.CONFLICT);
      }

      // Convert comma-separated sponsors string to array of strings
      const sponsorsArray = createEventDto.sponsors.split(',').map((sponsor: string) => sponsor.trim());

      const createdEvent = await this.eventModel.create({
        image_url: createEventDto.image_url,
        event_name: createEventDto.event_name,
        event_type: createEventDto.event_type,
        description: createEventDto.description,
        location: createEventDto.location,
        sponsors: sponsorsArray, // Assign array of strings to sponsors field
        creator: creatorId,
        event_date: createEventDto.event_date,
        reminder_date: createEventDto.reminder_date
      })
      
      // Return success response
      return {
        message: 'Event created successfully',
        // data: savedEvent,
        data: createdEvent,
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
        if (error.name === 'TokenExpiredError' || 'JsonWebTokenError') {
          throw new HttpException(error, HttpStatus.UNAUTHORIZED);
        } else {
          console.error('Error creating event:', error);
          throw new Error('Error creating event.');
        }
      }
  }

  async ViewsFindAll(page: number = 1, limit: number = 10, name?: string, type?: string) {
    try {
      const currentDate = new Date();
      const skip = (page - 1) * limit;

      const query: any = { event_date: { $gte: currentDate } };

      if (name || type) {
        query.$or = [];
        if (name) {
          query.$or.push({ event_name: { $regex: new RegExp(name, 'i') } });
        }
        if (type) {
          query.$or.push({ event_type: { $regex: new RegExp(type, 'i') } });
        }
      }
      
      const events = await this.eventModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();

      if (!events || events.length === 0) {
        throw new NotFoundException('There are no upcoming events at this time.');
      }

      // Calculate total pages
      const totalPages = Math.ceil(events.length / limit);

      return {
        message: 'Events retrieved successfully.',
        totalPages: totalPages,
        pages: `${page} of ${totalPages}`,
        events: events,
        statusCode: HttpStatus.OK
      }
    } catch (error) {
      if (error.name === 'NotFoundException') {
        throw new NotFoundException(error);
      } else {
        console.error('Error retrieving events:', error);
        throw new Error('Error retrieving events.');
      }
      
    }
  }


  async findAll(page: number = 1, limit: number = 10, name?: string, type?: string) {
    try {
      const currentDate = new Date();
      const skip = (page - 1) * limit;

      const query: any = { event_date: { $gte: currentDate } };

      if (name || type) {
        query.$or = [];
        if (name) {
          query.$or.push({ event_name: { $regex: new RegExp(name, 'i') } });
        }
        if (type) {
          query.$or.push({ event_type: { $regex: new RegExp(type, 'i') } });
        }
      }
      
      const events = await this.eventModel
        .find(query)
        .select('_id image_url event_name event_type description location sponsors event_date')
        .skip(skip)
        .limit(limit)
        .exec();

      if (!events || events.length === 0) {
        throw new NotFoundException('There are no upcoming events at this time.');
      }

      // Calculate total pages
      const totalPages = Math.ceil(events.length / limit);

      return {
        message: 'Events retrieved successfully.',
        totalPages: totalPages,
        pages: `${page} of ${totalPages}`,
        events: events,
        statusCode: HttpStatus.OK
      }
    } catch (error) {
      if (error.name === 'NotFoundException') {
        throw new NotFoundException(error);
      } else {
        console.error('Error retrieving events:', error);
        throw new Error('Error retrieving events.');
      }
      
    }
  }




  async findOne(id: string) {
    try {
      const event = await this.eventModel.findById(id)
        .select('_id image_url event_name event_type description location sponsors event_date')
        .exec();
      if (!event) {
        throw new NotFoundException('Event not found or canceled by creator.');
      }
      // Check if the event date has passed
      const currentDate = new Date();
      if (event.event_date < currentDate) {
        throw new GoneException('This event has already passed.');
      }
      return {
        message: 'Event retrieved successfully.',
        event,
        statusCode: HttpStatus.OK
      }
    } catch (error) {
      if (error.name === 'NotFoundException') {
        throw new NotFoundException(error);
      } else {
        console.error('Error retrieving event:', error);
        throw new Error('Error retrieving event.');
      }
    }
    
  }

  async findOneViews(id: string) {
    try {
      const event = await this.eventModel.findById(id)
        .lean()
        .exec();
      if (!event) {
        throw new NotFoundException('Event not found or canceled by creator.');
      }
      // Check if the event date has passed
      const currentDate = new Date();
      if (event.event_date < currentDate) {
        throw new GoneException('This event has already passed.');
      }
      return {
        message: 'Event retrieved successfully.',
        event,
        statusCode: HttpStatus.OK
      }
    } catch (error) {
      if (error.name === 'NotFoundException') {
        throw new NotFoundException(error);
      } else {
        console.error('Error retrieving event:', error);
        throw new Error('Error retrieving event.');
      }
    }
    
  }

  async findAllCreatorEvents(token: string, page: number = 1, limit: number = 5, name?: string, type?: string) {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

      console.log(decodedToken);
      const creatorId = decodedToken._id

      // Check if the Id exists in the Creator collection
      const creator = await this.creatorModel.findById(creatorId);
      if (!creator) {
        throw new UnauthorizedException('You are unauthorized.');
      }

      const skip = (page - 1) * limit;

      const query: any = { creator: creatorId }; // Filter by creatorId

      if (name || type) {
        query.$or = [];
        if (name) {
          query.$or.push({ event_name: { $regex: new RegExp(name, 'i') } });
        }
        if (type) {
          query.$or.push({ event_type: { $regex: new RegExp(type, 'i') } });
        }
      }

      const events = await this.eventModel
        .find(query)
        .select('_id image_url event_name event_type description location sponsors event_date')
        .skip(skip)
        .limit(limit)
        .exec();

      if (!events || events.length === 0) {
        throw new NotFoundException('There are no events associated with this creator.');
      }

        // Calculate total pages
        const totalPages = Math.ceil(events.length / limit);

        return {
          message: 'Events associated with the creator retrieved successfully.',
          pages: `${page} of ${totalPages}`,
          events: events,
          statusCode: HttpStatus.OK
        }
    } catch (error) {
      if (error.name === 'NotFoundException') {
        throw new NotFoundException(error);
      } else if (error.name === 'TokenExpiredError' || 'JsonWebTokenError') {
        throw new UnauthorizedException(error);
      } else {
        console.error('Error retrieving events associated with the creator:', error);
        throw new Error('Error retrieving events associated with the creator.');
      }
    }
  }

  async findAllCreatorEventsViews(token: string, page: number = 1, limit: number = 5, name?: string, type?: string) {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

      console.log(decodedToken);
      const creatorId = decodedToken._id

      // Check if the Id exists in the Creator collection
      const creator = await this.creatorModel.findById(creatorId);
      if (!creator) {
        throw new UnauthorizedException('You are unauthorized.');
      }

      const skip = (page - 1) * limit;

      const query: any = { creator: creatorId }; // Filter by creatorId

      if (name || type) {
        query.$or = [];
        if (name) {
          query.$or.push({ event_name: { $regex: new RegExp(name, 'i') } });
        }
        if (type) {
          query.$or.push({ event_type: { $regex: new RegExp(type, 'i') } });
        }
      }

      const events = await this.eventModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();

      if (!events || events.length === 0) {
        throw new NotFoundException('There are no events associated with this creator.');
      }

      // Calculate total pages
      const totalEventsCount = await this.eventModel.countDocuments(query);
      const totalPages = Math.ceil(totalEventsCount / limit);


      return {
        message: 'Events associated with the creator retrieved successfully.',
        pages: `${page} of ${totalPages}`,
        events: events,
        statusCode: HttpStatus.OK
      }
    } catch (error) {
      if (error.name === 'NotFoundException') {
        throw new NotFoundException(error);
      } else if (error.name === 'TokenExpiredError' || 'JsonWebTokenError') {
        throw new UnauthorizedException(error);
      } else {
        console.error('Error retrieving events associated with the creator:', error);
        throw new Error('Error retrieving events associated with the creator.');
      }
    }
  }


  async addUserToAttendees(
    token: string,
    eventId: string,
    user_reminder_date: Date,
  ) {
      try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
        console.log(decodedToken);
        const userId = decodedToken._id
        const userEmail = decodedToken.email
        // const userName = `${decodedToken.first_name} ${decodedToken.last_name}`
        // Check if the Id exists in the Creator collection
        const user = await this.userModel.findById(userId);
        if (!user) {
          throw new UnauthorizedException('You are unauthorized.');
        }
        const event = await this.eventModel.findById(eventId).exec();
        if (!event) {
          throw new NotFoundException('Event not found');
        }

        // Check if the event date has already passed
        const currentDate = new Date();
        if (event.event_date < currentDate) {
          throw new BadRequestException('Event has already passed.');
        }

        // Check if the attendees array already contains the user email
        const userExists = event.attendees.some(att => att.user_email === userEmail);
        if (userExists) {
          throw new BadRequestException('You are already attending this event. Check your email for ticket details.');
        }

        event.attendees.push({ user_email: userEmail, user_reminder_date: user_reminder_date });
        await event.save();

        const qrCodeData1 = JSON.stringify(
          `${process.env.HOST}:${process.env.PORT}/users/events/${event._id}/${userEmail}/details`,
        );
        const qrCodeData2 = JSON.stringify(
          `${process.env.HOST}:${process.env.PORT}/creators/events/${event._id}/${userEmail}/admit`,
        );

        // Upload the QR code to Cloudinary
        const qrCodeUrl1 = await this.cloudinaryService.uploadQrCode(qrCodeData1, 'qr_codes');
        const qrCodeUrl2 = await this.cloudinaryService.uploadQrCode(qrCodeData2, 'qr_codes');

        // Send email with the Cloudinary URL for the QR code
        await sendTicketEmail(
          userEmail, 
          qrCodeUrl1, 
          qrCodeUrl2, 
          event.event_name, 
          event.event_date, 
          event.location
        );
        return {
          message: 'Ticket booked successfully. Check your email for QR Codes.',
          detailsQrCodeUrl: qrCodeUrl1,
          accessQrCodeUrl: qrCodeUrl2,
          statusCode: HttpStatus.OK
        }
      } catch (error) {
        if (error.name === 'TokenExpiredError' || 'JsonWebTokenError') {
          throw new UnauthorizedException(error);
        } else {
          console.error('Error booking ticket:', error);
          throw new Error('Error booking ticket.');
        }
      }
  }
  async addUserToAttendeesViews(
    token: string,
    eventId: string,
    user_reminder_date: Date,
  ) {
      try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
        console.log(decodedToken);
        const userId = decodedToken._id
        const userEmail = decodedToken.email
        // const userName = `${decodedToken.first_name} ${decodedToken.last_name}`
        // Check if the Id exists in the Creator collection
        const user = await this.userModel.findById(userId);
        if (!user) {
          throw new UnauthorizedException('You are unauthorized.');
        }
        const event = await this.eventModel.findById(eventId).exec();
        if (!event) {
          throw new NotFoundException('Event not found');
        }

        // Check if the event date has already passed
        const currentDate = new Date();
        if (event.event_date < currentDate) {
          throw new BadRequestException('Event has already passed.');
        }

        // Check if the attendees array already contains the user email
        const userExists = event.attendees.some(att => att.user_email === userEmail);
        if (userExists) {
          throw new BadRequestException('You are already attending this event. Check your email for ticket details.');
        }

        event.attendees.push({ user_email: userEmail, user_reminder_date: user_reminder_date });
        await event.save();

        const qrCodeData1 = JSON.stringify(
          `${process.env.HOST}:${process.env.PORT}/views/users/events/${event._id}/${userEmail}/details`,
        );
        const qrCodeData2 = JSON.stringify(
          `${process.env.HOST}:${process.env.PORT}/views/creators/events/${event._id}/${userEmail}/admit`,
        );

        // Upload the QR code to Cloudinary
        const qrCodeUrl1 = await this.cloudinaryService.uploadQrCode(qrCodeData1, 'qr_codes');
        const qrCodeUrl2 = await this.cloudinaryService.uploadQrCode(qrCodeData2, 'qr_codes');

        // Send email with the Cloudinary URL for the QR code
        await sendTicketEmail(
          userEmail, 
          qrCodeUrl1, 
          qrCodeUrl2, 
          event.event_name, 
          event.event_date, 
          event.location
        );
        return {
          message: 'Ticket booked successfully. Check your email for QR Codes.',
          detailsQrCodeUrl: qrCodeUrl1,
          accessQrCodeUrl: qrCodeUrl2,
          statusCode: HttpStatus.OK
        }
      } catch (error) {
        if (error.name === 'TokenExpiredError' || 'JsonWebTokenError') {
          throw new UnauthorizedException(error);
        } else {
          console.error('Error booking ticket:', error);
          throw new Error('Error booking ticket.');
        }
      }
  }

  async generateEventUrl(token: string, eventId: string) {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

      console.log(decodedToken);
      const authId = decodedToken._id

      // Check if the Id exists in the Creator collection
      const creator = await this.creatorModel.findById(authId);
      // Check if the Id exists in the User collection
      const user = await this.userModel.findById(authId);

      if (!creator && !user) {
        throw new UnauthorizedException('You are unauthorized.');
      }
      // Find the event by ID in the database
      const event = await this.eventModel.findById(eventId).exec();

      // If the event is not found, throw a NotFoundException
      if (!event) {
        throw new NotFoundException('Event not found.');
      }

      // Construct the URL for sharing the event on social media
      const eventUrl = `${process.env.HOST}:${process.env.PORT}/events/${event._id}`;
      return {
        message: 'Event url generated successfully. Copy and share.',
        url: eventUrl,
        statusCode: HttpStatus.CREATED
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError' || 'JsonWebTokenError') {
        throw new UnauthorizedException(error);
      } else {
        console.error('Error sharing event:', error);
        throw new Error('Error sharing event.');
      }
    }
  }

  async getEventAttendees(token: string, eventId: string, page: number = 1, limit: number = 5,) {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

      console.log(decodedToken);
      const creatorId = decodedToken._id

      // Check if the Id exists in the Creator collection
      const creator = await this.creatorModel.findById(creatorId);
      if (!creator) {
        throw new UnauthorizedException('You are unauthorized.');
      }

      const existingEvent = await this.eventModel.findById(eventId);
      if (!existingEvent) {
        throw new NotFoundException('Event not found');
      }

      const creatorObjectId = mongoose.Types.ObjectId.createFromHexString(creatorId);

      if (!(existingEvent.creator as mongoose.Types.ObjectId).equals(creatorObjectId)) {
        throw new UnauthorizedException('You are not the creator of this event. Hence you are unauthorized.');
      }

      // Extract the attendee emails from the event
      const attendeeEmails = existingEvent.attendees.map(attendee => attendee.user_email);

      // Search the user model with the extracted emails
      const attendees = await this.userModel
        .find({ email: { $in: attendeeEmails } })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      // Map the user objects to create an array of objects containing first_name, last_name, and email
      const attendeeDetails = attendees.map(user => ({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      }));

      const totalAttendees = attendeeDetails.length

      // Calculate total pages
      const totalPages = Math.ceil(totalAttendees / limit);

      return {
        message: 'Event attendees retrieved successfully.',
        total: totalAttendees,
        pages: `${page} of ${totalPages}`,
        attendees: attendeeDetails,
        statusCode: HttpStatus.OK
        };
    } catch (error) {
        if (error.name === 'TokenExpiredError' || 'JsonWebTokenError') {
          throw new UnauthorizedException(error);
        } else {
          console.error('Error booking ticket:', error);
          throw new Error('Error booking ticket.');
        }
    }
  }

  async getAllEventAttendees(token: string, page: number = 1, limit: number = 5,) {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
  
      console.log(decodedToken);
      const creatorId = decodedToken._id;
  
      // Check if the Id exists in the Creator collection
      const creator = await this.creatorModel.findById(creatorId);
      if (!creator) {
        throw new UnauthorizedException('You are unauthorized.');
      }
  
      // Find all events associated with the creator
      const allMyEvents = await this.eventModel.find({ creator: creatorId }).exec();
      if (!allMyEvents || allMyEvents.length === 0) {
        throw new NotFoundException('No events found');
      }
  
      // Extract the attendee emails from all events
      const attendeeEmails = allMyEvents.flatMap(event => event.attendees.map(attendee => attendee.user_email));
  
      // Search the user model with the extracted emails
      const attendees = await this.userModel
        .find({ email: { $in: attendeeEmails } })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
  
      // Map the user objects to create an array of objects containing first_name, last_name, and email
      const attendeeDetails = attendees.map(user => ({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      }));
  
      const totalAttendees = attendeeDetails.length;

      // Calculate total pages
      const totalPages = Math.ceil(totalAttendees / limit);
  
      return {
        message: 'All your events attendees retrieved successfully.',
        total: totalAttendees,
        pages: `${page} of ${totalPages}`,
        attendees: attendeeDetails,
        statusCode: HttpStatus.OK
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException(error);
      } else {
        console.error('Error retrieving events attendees:', error);
        throw new Error('Error retrieving events attendees.');
      }
    }
  }
  
  async findEventsByAttendeeEmail(token: string, page: number = 1, limit: number = 5,) {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
  
      const userEmail = decodedToken.email;

      const skip = (page - 1) * limit;

      // Find all events
      const events = await this.eventModel
        .find()
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();

      // Filter events based on attendee's email
      const eventsWithAttendee = events.filter(event =>
        event.attendees.some(attendee => attendee.user_email === userEmail),
      );

      // If no events are found, throw NotFoundException
      if (eventsWithAttendee.length === 0) {
        throw new NotFoundException(`No events found! You have not booked ticket for any event.`);
      }

      // Calculate total pages
      const totalPages = Math.ceil(eventsWithAttendee.length / limit);

      return {
        message: 'Events associated with the user retrieved successfully.',
        pages: `${page} of ${totalPages}`,
        events: eventsWithAttendee,
        statusCode: HttpStatus.OK
      }
    } catch (error) {
      if (error.name === 'NotFoundException') {
        throw new NotFoundException(error);
      } else if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException(error);
      } else {
        console.error('Error retrieving your events:', error);
        throw new Error('Error retrieving your events.');
      }
    }
  }
  
  async admitUserToEvent(token: string, eventId: string, admittedDto: AdmittedDto) {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

      console.log(decodedToken);
      const creatorId = decodedToken._id

      // Check if the Id exists in the Creator collection
      const creator = await this.creatorModel.findById(creatorId);
      if (!creator) {
        throw new UnauthorizedException('You are unauthorized.');
      }

      // Retrieve the event
      const event = await this.eventModel.findById(eventId).exec();
      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // Check if the creator is the creator of the event
      if (event.creator.toString() !== creatorId) {
        throw new UnauthorizedException('Unauthorized: You are not the creator of this event.');
      }

      // Check if the event date has already passed
      const currentDate = new Date();
      if (event.event_date < currentDate) {
        throw new BadRequestException('Event has already passed.');
      }

      // Check if the user's email is in the attendees array
      const attendee = event.attendees.find(att => att.user_email === admittedDto.user_email);
      if (!attendee) {
        throw new UnauthorizedException('Unauthorized: User have not booked a ticket.');
      }

      // Check if the user's email is in the admitted array
      const isAdmitted = event.admitted.some(user_email => user_email === admittedDto.user_email);
      if (isAdmitted) {
        throw new UnauthorizedException('Unauthorized: User has already been admitted.');
      }

      // Add the user's email to the admitted array
      event.admitted.push(admittedDto.user_email);
      await event.save();

      return {
        message: 'Valid attendee! Admitted to event successfully.',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError' || 'JsonWebTokenError') {
        throw new UnauthorizedException(error);
      } else {
        console.error('Error admitting user to event:', error);
        throw new Error('Error admitting user to event.');
      }
    }
  }

  async getUserEventDetails(token: string, eventId: string, userEmail: string) {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
      const userId = decodedToken._id;
      const user_email = decodedToken.email;

      console.log(decodedToken);


      // Retrieve the event
      const event = await this.eventModel.findById(eventId).exec();
      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // Check if the user is authorized to view event details
      if (user_email !== userEmail && event.creator.toString() !== userId) {
        throw new UnauthorizedException('Unauthorized: You are not authorized to view this event.');
      }

      // Get the event details
      const eventDetails = {
        event_id: event._id,
        event_name: event.event_name,
        event_date: event.event_date,
        location: event.location,
        description: event.description,
        sponsors: event.sponsors,
      };

      return {
        message: 'Event details retrieved successfully.',
        event: eventDetails,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError' || 'JsonWebTokenError' || 'Jwt malformed') {
        throw new UnauthorizedException(error);
      } else {
        console.error('Error retrieving event details:', error);
        throw new Error('Error retrieving event details.');
      }
    }
  }

  async getEventAdmitted(token: string, eventId: string, page: number = 1, limit: number = 5,) {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

      console.log(decodedToken);
      const creatorId = decodedToken._id

      // Check if the Id exists in the Creator collection
      const creator = await this.creatorModel.findById(creatorId);
      if (!creator) {
        throw new UnauthorizedException('You are unauthorized.');
      }

      const existingEvent = await this.eventModel.findById(eventId);
      if (!existingEvent) {
        throw new NotFoundException('Event not found');
      }

      const creatorObjectId = mongoose.Types.ObjectId.createFromHexString(creatorId);

      if (!(existingEvent.creator as mongoose.Types.ObjectId).equals(creatorObjectId)) {
        throw new UnauthorizedException('You are not the creator of this event. Hence you are unauthorized.');
      }

      // Extract the attendee emails from the event
      const admittedEmails = existingEvent.admitted.map(user_email => user_email);

      // Search the user model with the extracted emails
      const admitted = await this.userModel
        .find({ email: { $in: admittedEmails } })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      // Map the user objects to create an array of objects containing first_name, last_name, and email
      const admittedDetails = admitted.map(user => ({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      }));

      const totalAdmitted = admittedDetails.length

      // Calculate total pages
      const totalPages = Math.ceil(totalAdmitted / limit);

      return {
        message: 'Event admits retrieved successfully.',
        total: totalAdmitted,
        pages: `${page} of ${totalPages}`,
        admitted: admittedDetails,
        statusCode: HttpStatus.OK
        };
    } catch (error) {
        if (error.name === 'TokenExpiredError' || 'JsonWebTokenError') {
          throw new UnauthorizedException(error);
        } else {
          console.error('Error booking ticket:', error);
          throw new Error('Error booking ticket.');
        }
    }
  }

  async getAllEventAdmitted(token: string, page: number = 1, limit: number = 5,) {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
  
      console.log(decodedToken);
      const creatorId = decodedToken._id;
  
      // Check if the Id exists in the Creator collection
      const creator = await this.creatorModel.findById(creatorId);
      if (!creator) {
        throw new UnauthorizedException('You are unauthorized.');
      }
  
      // Find all events associated with the creator
      const allMyEvents = await this.eventModel.find({ creator: creatorId }).exec();
      if (!allMyEvents || allMyEvents.length === 0) {
        throw new NotFoundException('No events found');
      }
  
      // Extract the attendee emails from all events
      const admittedEmails = allMyEvents.flatMap(event => event.admitted.map(user_email => user_email));
  
      // Search the user model with the extracted emails
      const admitted = await this.userModel
        .find({ email: { $in: admittedEmails } })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
  
      // Map the user objects to create an array of objects containing first_name, last_name, and email
      const admittedDetails = admitted.map(user => ({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      }));
  
      const totalAdmitted = admittedDetails.length;

      // Calculate total pages
      const totalPages = Math.ceil(totalAdmitted / limit);
  
      return {
        message: 'All your events admits retrieved successfully.',
        total: totalAdmitted,
        pages: `${page} of ${totalPages}`,
        admitted: admittedDetails,
        statusCode: HttpStatus.OK
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException(error);
      } else {
        console.error('Error retrieving events attendees:', error);
        throw new Error('Error retrieving events attendees.');
      }
    }
  }
  

  async update(token: string, id: string, updateEventDto: UpdateEventDto) {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
      console.log(decodedToken);

      const creatorId = decodedToken._id

      // Check if the Id exists in the Creator collection
      const creator = await this.creatorModel.findById(creatorId);
      if (!creator) {
        throw new UnauthorizedException('You are unauthorized.');
      }
      const existingEvent = await this.eventModel.findById(id);
      if (!existingEvent) {
        throw new NotFoundException('Event not found');
      }

      const creatorObjectId = mongoose.Types.ObjectId.createFromHexString(creatorId);

      if (!(existingEvent.creator as mongoose.Types.ObjectId).equals(creatorObjectId)) {
        throw new UnauthorizedException('You are not the creator of this event. Hence you are unauthorized.');
      }

      // Check if sponsors field exists in the update DTO
      if (updateEventDto.sponsors) {
        // Create a Set from the existing sponsors array to ensure uniqueness
        const existingSponsorsSet = new Set(existingEvent.sponsors);

        // Iterate over the new sponsors array and add only unique strings to the existing sponsors Set
        updateEventDto.sponsors.forEach(sponsor => {
          existingSponsorsSet.add(sponsor);
        });

        // Convert the Set back to an array and assign it to the existing event sponsors
        existingEvent.sponsors = Array.from(existingSponsorsSet);
      }

      await existingEvent.save();

      return {
        message: 'Event updated successfully',
        event: existingEvent,
        statusCode: HttpStatus.CREATED
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError' || 'JsonWebTokenError') {
        throw new UnauthorizedException(error);
      } else if (error.name === 'NotFoundException') {
        throw new NotFoundException(error);
      } else {
        console.error('Error updating event:', error);
        throw new Error('Error updating event.');
      }
    }
  }

  async remove(token: string, id: string) {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
      console.log(decodedToken);

      const creatorId = decodedToken._id
      // Check if the Id exists in the Creator collection
      const creator = await this.creatorModel.findById(creatorId);
      if (!creator) {
        throw new UnauthorizedException('You are unauthorized.');
      }

      const existingEvent = await this.eventModel.findById(id);
      if (!existingEvent) {
        throw new NotFoundException(`Event with #ID - ${id} not found.`);
      }

      const creatorObjectId = mongoose.Types.ObjectId.createFromHexString(creatorId);

      if (!(existingEvent.creator as mongoose.Types.ObjectId).equals(creatorObjectId)) {
        throw new UnauthorizedException('You are not the creator of this event. Hence you are unauthorized.');
      }

      await this.eventModel.findByIdAndDelete(id).exec();

      return {
        message: `The event with ID - #${id} has been deleted successfully.`,
        statusCode: HttpStatus.NO_CONTENT,
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError' || 'JsonWebTokenError') {
        throw new UnauthorizedException(error);
      } else if (error.name === 'NotFoundException') {
        throw new NotFoundException(error);
      } else {
        console.error('Error deleting event:', error);
        throw new Error('Error deleting event.');
      }
    }
  }

  async creatorsReminders(): Promise<void> {
    // Get today's date
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0
    console.log(today);

    // Find events with reminder_date equal to today
    const events = await this.eventModel.find({ reminder_date: today });

    // Iterate over events and send reminders
    for (const event of events) {
      const { event_name, event_date, location, attendees } = event;

      // Check if the event has attendees
      if (attendees && attendees.length > 0) {
        // Iterate over attendees and send reminders to each attendee
        for (const attendee of attendees) {
          const { user_email } = attendee;
          await sendReminderEmail(user_email, event_name, event_date, location);
        }
      }
    }
  }
  async usersReminders(): Promise<void> {
    // Get today's date
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0
    console.log(today);

    // Find events with attendees having user_reminder_date equal to today
    const events = await this.eventModel.aggregate([
      {
        $match: { attendees: { $elemMatch: { user_reminder_date: today } } }
      }
    ]);

    // Iterate over events and send reminders to users
    for (const event of events) {
      const { event_name, event_date, location, attendees } = event;

      // Filter attendees with user_reminder_date equal to today
      const attendeesToday = attendees.filter((attendee: { user_reminder_date: { getTime: () => number; }; }) => attendee.user_reminder_date.getTime() === today.getTime());

      // Send reminders to each user attending the event
      for (const attendee of attendeesToday) {
        const { user_email } = attendee;
        await sendReminderEmail(user_email, event_name, event_date, location);
      }
    }
  }
}
