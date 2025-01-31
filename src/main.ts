import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from 'src/app/app.module';
import * as morgan from 'morgan';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap'); // ✅ bootstrap 함수용 Logger 인스턴스 생성
  const app = await NestFactory.create(AppModule);

  if (process.env.NODE_ENV == 'production') {
    app.use(morgan('combined'));  // Production logging
  } else {
    app.use(morgan('dev'));  // Development logging
  }

  // NestFactory에서 app.get을 통하여 AppConfigService 주입받아 사용함
  const configService: ConfigService = app.get(ConfigService);
  const port = configService.get<number>('server.port') || 4000;

  await app.listen(port);
  logger.log(`${port}번 포트에서 NestJS 서버 실행중!`); // ✅ bootstrap에서 직접 로깅
}
bootstrap();

