import { Controller, Get } from '@nestjs/common';
import { AppService } from 'src/app/app.service';
import { Notice } from 'src/notices/notice.interface';
import { Page } from 'src/notices/page.interface';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHome(): string {
    return 'Hello World!';
  }

  @Get('/major_notices')
  async getMajorNotices(): Promise<{ headline: Notice[]; general: Notice[]; pages: Page[]; }> {
    return this.appService.getMajorNotices();
  }
}