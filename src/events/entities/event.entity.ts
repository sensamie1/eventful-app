import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { CreatorDocument } from '../../creators/entities/creator.entity';

export type EventDocument = Event & mongoose.Document;

@Schema({
  timestamps: true,
})
export class Event {
  @Prop({ required: true })
  image_url: string;

  @Prop({ required: true })
  event_name: string;

  @Prop({ required: true })
  event_type: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  location: string;
  
  @Prop()
  sponsors: string[];
  
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Creator' }) // Reference to the Creator entity
  creator: mongoose.Types.ObjectId | CreatorDocument;

  @Prop({ required: true })
  event_date: Date;

  @Prop({ required: true })
  reminder_date: Date;

  @Prop({ 
    type: [
      {
        _id: false,
        user_email: String,
        user_reminder_date: Date
      }
    ]
  }) 
  attendees: { user_email: string, user_reminder_date: Date }[];

  @Prop({ type: [String] }) // Array of admitted user emails
  admitted: string[];
}

export const EventSchema = SchemaFactory.createForClass(Event);

// Export the Event model
export const EventModel = mongoose.model<EventDocument>('Event', EventSchema);


