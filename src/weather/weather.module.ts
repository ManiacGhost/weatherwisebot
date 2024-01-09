import { Module } from '@nestjs/common';
import { WeatherServices } from './weather.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/userSchema';
import { Admin, AdminSchema } from 'src/schemas/Admin';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]),
  ],
  providers: [WeatherServices],
})
export class WeatherModule {}
