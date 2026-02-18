/*
 * This is file of the project inha_notice
 * Licensed under the MIT License.
 * Copyright (c) 2025-2026 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2026-02-18
 */

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from 'src/app/app.module';
import * as morgan from 'morgan';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  if (process.env.NODE_ENV == 'production') {
    app.use(morgan('combined'));
  } else {
    app.use(morgan('dev'));
  }

  const configService: ConfigService = app.get(ConfigService);
  const port = configService.get<number>('server.port') || 4000;

  await app.listen(port);
  logger.log(`${port}번 포트에서 NestJS 서버 실행중!`);
}
bootstrap();

