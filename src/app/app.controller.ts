import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from 'src/app/app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHome(): string {
    return 'Hello World!';
  }

  @Get('health')
  check(@Res() res: Response) {
    try {
      return res.status(HttpStatus.OK).json({ message: 'health check에 성공하였습니다.' });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'health check에 실패하였습니다.',
        error: error.message,
      });
    }
  }
}