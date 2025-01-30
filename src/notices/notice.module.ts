import { Module } from '@nestjs/common';
import { MajorNoticeScraperService } from './major-notice_scraper.service';

@Module({
    providers: [MajorNoticeScraperService],
    exports: [MajorNoticeScraperService],
})
export class NoticeModule { }