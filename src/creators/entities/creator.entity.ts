import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

export type CreatorDocument = Creator & mongoose.Document;

@Schema({
  timestamps: true,
})
export class Creator {
  @Prop({ required: true })
  first_name: string;

  @Prop({ required: true })
  last_name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  isVerified: boolean;

  static async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
}

export const CreatorSchema = SchemaFactory.createForClass(Creator);

CreatorSchema.pre<Creator>('save', async function (next) {
  const creator = this;
  try {
    const hash = await bcrypt.hash(creator.password, 10);

    this.password = hash;
  } catch (error) {
    return next(error);
  }
});

// Export the Creator model
export const CreatorModel = mongoose.model<CreatorDocument>('Creator', CreatorSchema);



