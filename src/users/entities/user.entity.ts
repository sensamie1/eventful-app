import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & mongoose.Document;

@Schema({
  timestamps: true,
})
export class User {
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



export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<User>('save', async function (next) {
  const user = this;
  try {
    const hash = await bcrypt.hash(user.password, 10);

    this.password = hash;
  } catch (error) {
    return next(error);
  }
});


// Export the User model
export const UserModel = mongoose.model<UserDocument>('User', UserSchema);
