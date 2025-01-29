import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MajorNoticeScraperService } from './major-notice_scraper.service';

@Module({
    imports: [ConfigModule],
    providers: [MajorNoticeScraperService],
    exports: [MajorNoticeScraperService],
})
export class NoticeModule { }