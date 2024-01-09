import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ type: 'number' })
  chatId: string;

  @Prop({ type: 'string' })
  username: string;

  @Prop({ type: 'string' })
  locationName?: string;

  @Prop({ type: 'Boolean' })
  blocked: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
