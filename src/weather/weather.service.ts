import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { Telegraf, Context } from 'telegraf';
import { User } from 'src/schemas/userSchema';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class WeatherServices {
  private bot: Telegraf<Context>; // Adjust the type based on the actual type of your bot
  private logger = new Logger(WeatherServices.name);

  constructor(@InjectModel(User.name) private userModel: Model<User>) {
    this.initializeBot();
  }

  private initializeBot() {
    // this.bot = new Telegraf(process.env.TelgramBotApiKey);
    if (process.env.environment == 'PRODUCTION') {
      // if environment is "Production"
      this.bot = new Telegraf(process.env.TelgramBotApiKey as string);
    } else {
      // Else local
      this.bot = new Telegraf(process.env.TelgramBotApiKey as string);
    }

    this.bot.start((ctx) => this.start(ctx));
    this.bot.command('subscribe', (ctx) => this.subscribe(ctx));
    this.bot.hears(/^location:/i, (ctx) => this.handleLocation(ctx));
    this.bot.hears(/^updates/i, (ctx) => this.sendUpdates(ctx));

    // this.bot.launch().then(() => {
    //   this.logger.log('Bot started');
    // });
  }

  private async start(ctx: Context) {
    ctx.reply('Welcome to WeatherWise Bot');
  }

  private async subscribe(ctx: Context) {
    const chatId = ctx.chat.id.toString();
    const duplicate = await this.userModel.findOne({ chatId });

    if (duplicate?.blocked) {
      ctx.reply('No service available!');
      return;
    }

    if (duplicate) {
      ctx.reply(
        'You are already subscribed. You will receive weather updates daily at 7 AM.',
      );
      return;
    }

    ctx.reply('Enter the name of your location. (e.g., location:Mumbai)');
  }

  private async handleLocation(ctx: Context) {
    const chatId = ctx.chat.id.toString();
    if (!('text' in ctx.message)) {
      return 'Text not found';
    }
    const locationName = ctx.message.text.split(':')[1]?.trim().toLowerCase();

    if (!locationName) {
      ctx.reply('Invalid location!');
      return;
    }

    const data = await this.fetchWeatherDataForLocation(locationName);
    const username = ctx.from.first_name;

    ctx.reply(this.generateMessage(data));

    await this.userModel.updateOne(
      { chatId },
      {
        $set: {
          chatId,
          username,
          locationName,
        },
      },
      { upsert: true },
    );

    ctx.reply(
      'Congratulations! You will receive weather updates daily at 7 AM.',
    );
    ctx.reply('Thanks for choosing WeatherWise!');
  }

  private async sendUpdates(ctx: Context) {
    const chatId = ctx.chat.id.toString();
    const user = await this.userModel.findOne({ chatId });

    if (!user) {
      ctx.reply(
        'You are not subscribed to the service yet. Send /subscribe to receive daily weather updates!',
      );
      return;
    }

    const data = await this.fetchWeatherDataForLocation(user.locationName);
    const message = this.generateMessage(data);

    ctx.reply(message);
  }

  @Cron('0 7 * * *')
  private async scheduledSendUpdates() {
    // Fetch weather data for each subscriber and send them a message.
    const users = await this.userModel.find({ blocked: false });

    for (const user of users) {
      const data = await this.fetchWeatherDataForLocation(user.locationName);
      const message = this.generateMessage(data);
      this.bot.telegram.sendMessage(user.chatId, message);
    }
  }

  private async fetchWeatherDataForLocation(locationName: string) {
    // implement the code to handle location name
    try {
      const response = await axios.get(
        `http://api.openweathermap.org/data/2.5/weather?q=${locationName}&appid=${process.env.openWeatherAPIKey}`,
      );
      if (response.data.message === 'city not found') {
        return 'No response';
      }
      return response.data;
    } catch (error) {
      return 'No response';
    }
  }
  private async fetchWeatherData([longitude, latitude]: [number, number]) {
    // Fetch weather data from the OpenWeather API.
    // Replace 'YOUR_OPENWEATHER_API_KEY' with your actual API key.
    try {
      const response = await axios.get(
        `http://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.openWeatherAPIKey}`,
      );
      return response.data;
    } catch (error) {
      return 'No response';
    }
  }

  generateMessage(data: any) {
    const weather = data.weather[0].description;
    const temperature = data.main.temp - 273.15;
    const city = data.name;
    const humidity = data.main.humidity;
    const pressure = data.main.pressure;
    const windSpeed = data.wind.speed;
    const message = `The weather in ${city} is ${weather} with a temperature of ${temperature.toFixed(
      2,
    )}°C. The humidity is ${humidity}%, the pressure is ${pressure}hPa, and the wind speed is ${windSpeed}m/s.`;
    return message;
  }
}
