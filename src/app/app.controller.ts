import { Controller, Get } from '@nestjs/common';
import { AppService } from 'src/app/app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHome(): string {
    return this.appService.getHome();
  }

  @Get('health')
  check() {
    return this.appService.healthCheck();
  }
}