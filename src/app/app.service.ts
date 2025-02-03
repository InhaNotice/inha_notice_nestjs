import { Injectable } from '@nestjs/common';
import { MajorNoticeScraperService } from 'src/notices/scraper/major-notice-scraper.service';
import { Notice } from 'src/notices/interfaces/notice.interface';

@Injectable()
export class AppService {
  constructor(private readonly majorNoticeScraperService: MajorNoticeScraperService) { }

  async getMajorNotices(): Promise<{ general: Notice[] }> {
    const result = await this.majorNoticeScraperService.fetchNotices('CSE', 1);
    return result;
  }
}