import { Controller, Module } from '@nestjs/common';
import { WeatherServices } from './weather.service';
// import { Message } from 'node-telegram-bot-api';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/userSchema';

@Controller('bot')
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
})
export class WeatherController {
  constructor(private readonly weatherServices: WeatherServices) {}
  //   @Post('start')
  //   async start(@Body() msg: Message) {
  //     const chatId = msg.chat.id;
  //     this.weatherServices.start(chatId);
  //   }

  //   @Post('subscribe')
  //   async subscribe(@Body() msg: Message) {
  //     const chatId = msg.chat.id;
  //     // if (msg.location) {
  //     // const location: [number, number] = [
  //     //   msg.location.longitude,
  //     //   msg.location.latitude,
  //     // ];
  //     await this.weatherServices.subscribe(msg);
  //     this.weatherServices.sendMessage(
  //       chatId,
  //       'You have been subscribed to daily weather updates!',
  //     );
  //     // } else {
  //     //   this.weatherServices.sendMessage(chatId, 'Please share your location.');
  //     // }
  //   }
}
