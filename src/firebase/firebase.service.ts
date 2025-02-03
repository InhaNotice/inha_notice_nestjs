import { Injectable, Inject, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private static readonly logger: Logger = new Logger(FirebaseService.name);
  constructor(@Inject('FIREBASE_ADMIN') private readonly firebaseAdmin: typeof admin) { } // ✅ Firebase Admin SDK 주입

  // 특정 디바이스로 알림
  async sendNotificationToDevice(
    token: string,
    noticeTitle: string,
    data?: Record<string, string>,
  ): Promise<void> {
    try {
      const notificationTitle: string = "[인하공지] 새로운 공지사항이 있습니다!";
      const notificationBody: string = noticeTitle;
      const message: admin.messaging.Message = {
        token: token,
        notification: {
          title: notificationTitle,
          body: notificationBody
        },
        data: data || {},
      };

      const response = await this.firebaseAdmin.messaging().send(message);
      FirebaseService.logger.log(`✅ 푸시알림 보내기 성공: ${response}`);
    } catch (error) {
      FirebaseService.logger.error(`🚨 푸시알림 보내기 실패: ${error.message}`);
    }
  }

  // 학사 새로운 공지사항 알림
  async sendWholeNotification(
    noticeTitle: string,
    data?: Record<string, string> // { url: notice.link }
  ): Promise<void> {
    try {
      const notificationTitle: string = "[인하공지] 새로운 공지사항이 있습니다!";
      const notificationBody: string = noticeTitle;
      const topic: string = 'all-notices';

      const message: admin.messaging.Message = {
        notification: {
          title: notificationTitle,
          body: notificationBody
        },
        data: data || {},
        topic: topic,
      };

      const response = await this.firebaseAdmin.messaging().send(message);
      FirebaseService.logger.log(`✅ 푸시알림 보내기 성공: ${response}`);
    } catch (error) {
      FirebaseService.logger.error(`🚨 푸시알림 보내기 실패: ${error.message}`);
    }
  }

  // 학과 새로운 공지사항 알림
  async sendMajorNotification(
    noticeTitle: string,
    topic: string,
    data?: Record<string, string> // { url: notice.link }
  ): Promise<void> {
    try {
      const notificationTitle: string = "[학과] 새로운 공지사항이 있습니다!";
      const notificationBody: string = noticeTitle;

      const message: admin.messaging.Message = {
        notification: {
          title: notificationTitle,
          body: notificationBody
        },
        data: data || {},
        topic: topic
      };

      const response = await this.firebaseAdmin.messaging().send(message);
      FirebaseService.logger.log(`✅ 푸시알림 보내기 성공: ${response}`);
    } catch (error) {
      FirebaseService.logger.error(`🚨 푸시알림 보내기 실패: ${error.message}`);
    }
  }
}