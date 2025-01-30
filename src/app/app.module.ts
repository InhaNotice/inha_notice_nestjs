import { Module } from '@nestjs/common';
import { AppController } from 'src/app/app.controller';
import { AppService } from 'src/app/app.service';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { FirebaseService } from 'src/firebase/firebase.service';
import { FirebaseController } from 'src/firebase/firebase.controller';
import { NoticeModule } from 'src/notices/notice.module';
import configuration from 'src/config/configuration';
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