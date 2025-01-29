import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as morgan from 'morgan';

dotenv.config({
  path: path.resolve(
    (process.env.NODE_ENV == 'production') ? '.production.env'
      : (process.env.NODE_ENV == 'stage') ? '.stage.env' : '.development.env'
  )
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  if (process.env.NODE_ENV == 'production') {
    app.use(morgan('combined'));  // Production logging
  } else {
    app.use(morgan('dev'));  // Development logging
  }
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
