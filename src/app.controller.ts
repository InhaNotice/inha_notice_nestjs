import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) { }

  @Get()
  getHello(): string {
    return this.configService.get<string>('DATABASE_HOST') ?? 'localhost';
  }
}