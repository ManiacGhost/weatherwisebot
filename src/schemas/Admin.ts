import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminDocument = Admin & Document;

@Schema()
export class Admin {
  @Prop({ type: 'number' })
  username: string;

  @Prop({ type: 'string' })
  email: string;

  @Prop({ type: 'string' })
  password: string;

  roles: {
    Admin: {
      type: number;
      default: 5150;
    };
  };
  refreshToken: string;
  apiKey: string;
  isVerified: boolean;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
