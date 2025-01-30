import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app/app.module';
import * as morgan from 'morgan';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (process.env.NODE_ENV == 'production') {
    app.use(morgan('combined'));  // Production logging
  } else {
    app.use(morgan('dev'));  // Development logging
  }

  // NestFactory에서 app.get을 통하여 AppConfigService 주입받아 사용함
  const configService: ConfigService = app.get(ConfigService);

  await app.listen(configService.get('server.port') ?? '4000', () => {
    console.log(`${configService.get('server.port')}번 포트에서 NestJS 서버 실행중!`);
  });
}
bootstrap();

