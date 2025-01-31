import { Module } from '@nestjs/common';
import { MajorNoticeScraperService } from 'src/notices/notice-scraper.service';
import { NoticeSchedulerService } from 'src/notices/notice-scheduler.service';
import { FirebaseService } from 'src/firebase/firebase.service';

@Module({
    providers: [MajorNoticeScraperService, NoticeSchedulerService, FirebaseService], // ✅ FirebaseService 추가
    exports: [MajorNoticeScraperService, NoticeSchedulerService], // ✅ 필요 시 다른 모듈에서 사용 가능
})
export class NoticeModule { }