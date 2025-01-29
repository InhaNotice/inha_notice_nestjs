import { Injectable } from '@nestjs/common';
import { MajorNoticeScraperService } from 'src/notices/major-notice_scraper.service';
import { Notice } from 'src/notices/notice.interface';
import { Page } from 'src/notices/page.interface';

@Injectable()
export class AppService {
  constructor(private readonly majorNoticeScraperService: MajorNoticeScraperService) { }

  async getMajorNotices(): Promise<{ headline: Notice[]; general: Notice[]; pages: Page[] }> {
    const result = await this.majorNoticeScraperService.fetchNotices(1);
    return result;
  }
}