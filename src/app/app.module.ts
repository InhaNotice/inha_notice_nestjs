import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { FirebaseService } from '../firebase/firebase.service';
import { FirebaseController } from '../firebase/firebase.controller';
import { NoticeModule } from '../notices/notice.module';
import configuration from '../config/configuration';
import { ConfigModule } from '@nestjs/config';
import { MajorNoticeScraperService } from 'src/notices/major-notice_scraper.service';

@Module({
  imports: [
    NoticeModule,
    ConfigModule.forRoot({
      envFilePath: (process.env.NODE_ENV === 'production') ? './env/.production.env' : './env/.development.env',
      load: [configuration],
      isGlobal: true,
    }),
    FirebaseModule
  ],
  controllers: [AppController, FirebaseController],
  providers: [AppService, FirebaseService, MajorNoticeScraperService],
})
export class AppModule { }