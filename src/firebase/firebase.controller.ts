import { Controller, Post, Body } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

@Controller('notifications')
export class FirebaseController {
  constructor(private readonly firebaseService: FirebaseService) {}

  @Post('send')
  async sendNotification(@Body() body: any): Promise<void> {
    const { token, title, message, data } = body;

    // Firebase 푸시 알림 발송
    await this.firebaseService.sendNotification(token, title, message, data);
  }
  
  @Post('send-to-all')
  async sendNotificationToAll(@Body() body: any): Promise<void> {
    const { title, message, data } = body;

    // Firebase 푸시 알림 발송 (전체 사용자)
    await this.firebaseService.sendNotificationToAll(title, message, data);
  }
}