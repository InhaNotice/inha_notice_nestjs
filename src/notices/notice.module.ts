import { Module } from '@nestjs/common';
import { MajorNoticeScraperService } from 'src/notices/scraper/major-notice-scraper.service';
import { MajorNoticeSchedulerService } from 'src/notices/scheduler/major-notice-scheduler.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { WholeNoticeScraperService } from 'src/notices/scraper/whole-notice-scraper.service';
import { WholeNoticeSchedulerService } from './scheduler/whole-notice-scheduler.service';

@Module({
    providers: [WholeNoticeScraperService, WholeNoticeSchedulerService, MajorNoticeScraperService, MajorNoticeSchedulerService, FirebaseService],
    exports: [WholeNoticeScraperService, WholeNoticeSchedulerService, MajorNoticeScraperService, MajorNoticeSchedulerService],
})
export class NoticeModule { }