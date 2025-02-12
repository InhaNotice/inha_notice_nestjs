import { HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() { }

  getHome(): string {
    return "Hello World!";
  }


  healthCheck(): { status: number; message: string } {
    return {
      status: HttpStatus.OK,
      message: 'health check에 성공하였습니다.'
    };
  }
}