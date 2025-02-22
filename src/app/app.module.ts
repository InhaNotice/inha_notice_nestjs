/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-02-22
 */

import { Module } from '@nestjs/common';
import { AppController } from 'src/app/app.controller';
import { AppService } from 'src/app/app.service';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { FirebaseService } from 'src/firebase/firebase.service';
import { FirebaseController } from 'src/firebase/firebase.controller';
import { NoticeModule } from 'src/notices/notice.module';
import configuration from 'src/config/configuration';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      load: [configuration],
      isGlobal: true,
    }),
    FirebaseModule,
    NoticeModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController, FirebaseController],
  providers: [AppService, FirebaseService],
})
export class AppModule { }