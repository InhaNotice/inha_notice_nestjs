import { Controller, Post, Body } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

@Controller('notifications')
export class FirebaseController {
  constructor(private readonly firebaseService: FirebaseService) { }

  // 특정 디바이스로 알림
  @Post('send-to-device')
  async sendNotification(@Body() body: any): Promise<void> {
    const { token, noticeTitle, data } = body;

    // Firebase 푸시 알림 발송
    await this.firebaseService.sendNotificationToDevice(token, noticeTitle, data);
  }

  // 학사 새로운 공지사항 알림
  @Post('send-to-all')
  async sendNotificationToAll(@Body() body: any): Promise<void> {
    const { noticeTitle, data } = body;

    // Firebase 푸시 알림 발송 (전체 사용자)
    await this.firebaseService.sendNotificationToAll(noticeTitle, data);
  }
}