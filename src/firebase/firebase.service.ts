import { Injectable, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  constructor(@Inject('FIREBASE_ADMIN') private readonly firebaseAdmin: typeof admin) { } // ✅ Firebase Admin SDK 주입

  async sendNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    try {
      const message: admin.messaging.Message = {
        token,
        notification: { title, body },
        data: data || {}, // 선택적 데이터
      };

      const response = await this.firebaseAdmin.messaging().send(message);
      console.log(`Successfully sent message: ${response}`);
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('FCM notification failed');
    }
  }

  async sendNotificationToAll(
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    try {
      const message: admin.messaging.Message = {
        notification: { title, body },
        data: data || {}, // 선택적 데이터
        topic: 'all-users', // ✅ 모든 사용자에게 보낼 토픽
      };

      const response = await this.firebaseAdmin.messaging().send(message);
      console.log(`Successfully sent message to all: ${response}`);
    } catch (error) {
      console.error('Error sending message to all:', error);
      throw new Error('Failed to send notification to all users');
    }
  }
}