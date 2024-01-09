import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NextFunction, Response } from 'express';

const allowedOrigins = ['http://localhost:5173'];
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  if (process.env.APP_ENV !== 'production') {
    app.enableCors({
      origin: 'http://localhost:5173',
      credentials: true,
    });
  } else {
    app.enableCors({
      origin: 'http://localhost:5173',
      credentials: true,
    });
  }

  app.use(function (request: Request, response: Response, next: NextFunction) {
    const origin = request.headers['origin'];
    if (allowedOrigins.includes(origin)) {
      // console.log(origin);
      response.header('Access-Control-Allow-Origin', 'true');
    }
    next();
  });
  await app.listen(4000);
}
bootstrap();
