import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { WeatherController } from './weather/weather.controller';
import { WeatherModule } from './weather/weather.module';
import { ConfigModule } from '@nestjs/config';
import { WeatherServices } from './weather/weather.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/userSchema';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminController } from './admin/admin.controller';
import { AdminModule } from './admin/admin.module';
import { AdminService } from './admin/admin.service';
import { Admin, AdminSchema } from './schemas/Admin';
import { AdminMiddleware } from './admin/middleware/admin.middleware';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    WeatherModule,
    ConfigModule.forRoot({ envFilePath: '.env.local' }),
    MongooseModule.forRoot(process.env.DATABASE_URI),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]),
    ScheduleModule.forRoot(),
    AdminModule,
  ],
  controllers: [AppController, AdminController],
  providers: [WeatherServices, AppService, AdminService, JwtService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AdminMiddleware).exclude('admin/login');
    consumer.apply(AdminMiddleware).exclude('admin/login/google');
    consumer.apply(AdminMiddleware).exclude('admin/register');
    consumer.apply(AdminMiddleware).forRoutes('admin/users');
    consumer.apply(AdminMiddleware).forRoutes('admin/user');
    consumer.apply(AdminMiddleware).forRoutes('admin/blockUser');
    consumer.apply(AdminMiddleware).forRoutes('admin/blockUsers');
  }
}
