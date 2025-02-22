/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-02-22
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { majorMappings } from 'src/firebase/mappings/major-mappings';
import { noticeTypeMappings } from 'src/firebase/mappings/notice-type-mappings';
import { IdentifierConstants } from 'src/constants/identifiers';

@Injectable()
export class FirebaseService {
  private static readonly logger: Logger = new Logger(FirebaseService.name);
  constructor(@Inject('FIREBASE_ADMIN') private readonly firebaseAdmin: typeof admin) { }

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

      if (process.env.NODE_ENV === 'production') {
        const response: string = await this.firebaseAdmin.messaging().send(message);
        const noticeId: string = (data && 'id' in data) ? data['id'] : IdentifierConstants.UNKNOWN_ID;
        FirebaseService.logger.log(`✅ 푸시알림 보내기 성공: ${noticeId}-${response}`);
      } else {
        FirebaseService.logger.log(`🔕 개발 환경이므로 알림을 보내지 않습니다.`);
      }
    } catch (error) {
      FirebaseService.logger.error(`🚨 푸시알림 보내기 실패: ${error.message}`);
    }
  }

  // 학사 새로운 공지사항 알림
  async sendWholeNotification(
    noticeTitle: string,
    data?: Record<string, string>
  ): Promise<void> {
    try {
      const notificationTitle: string = "학사";
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
      if (process.env.NODE_ENV === 'production') {
        const response: string = await this.firebaseAdmin.messaging().send(message);
        const noticeId: string = (data && 'id' in data) ? data['id'] : IdentifierConstants.UNKNOWN_ID;
        FirebaseService.logger.log(`✅ 푸시알림 보내기 성공: ${noticeId}-${response}`);
      } else {
        FirebaseService.logger.log(`🔕 개발 환경이므로 알림을 보내지 않습니다.`);
      }
    } catch (error) {
      FirebaseService.logger.error(`🚨 푸시알림 보내기 실패: ${error.message}`);
    }
  }

  // 학과 새로운 공지사항 알림
  async sendMajorNotification(
    noticeTitle: string,
    topic: string,
    data?: Record<string, string>
  ): Promise<void> {
    try {
      const notificationTitle: string = majorMappings[topic] ?? "학과";
      const notificationBody: string = noticeTitle;

      const message: admin.messaging.Message = {
        notification: {
          title: notificationTitle,
          body: notificationBody
        },
        data: data || {},
        topic: topic
      };

      if (process.env.NODE_ENV === 'production') {
        const response: string = await this.firebaseAdmin.messaging().send(message);
        const noticeId: string = (data && 'id' in data) ? data['id'] : IdentifierConstants.UNKNOWN_ID;
        FirebaseService.logger.log(`✅ 푸시알림 보내기 성공: ${noticeId}-${response}`);
      } else {
        FirebaseService.logger.log(`🔕 개발 환경이므로 알림을 보내지 않습니다.`);
      }
    } catch (error) {
      FirebaseService.logger.error(`🚨 푸시알림 보내기 실패: ${error.message}`);
    }
  }

  // 학과 스타일 공지사항 알림
  // 지원 대상: 국제처, SW중심대학사업단
  async sendMajorStyleNotification(
    noticeTitle: string,
    topic: string,
    data?: Record<string, string>
  ): Promise<void> {
    try {
      const notificationTitle: string = noticeTypeMappings[topic] ?? "새로운 공지사항이 있습니다!";
      const notificationBody: string = noticeTitle;

      const message: admin.messaging.Message = {
        notification: {
          title: notificationTitle,
          body: notificationBody
        },
        data: data || {},
        topic: topic
      };

      if (process.env.NODE_ENV === 'production') {
        const response: string = await this.firebaseAdmin.messaging().send(message);
        const noticeId: string = (data && 'id' in data) ? data['id'] : IdentifierConstants.UNKNOWN_ID;
        FirebaseService.logger.log(`✅ 푸시알림 보내기 성공: ${noticeId}-${response}`);
      } else {
        FirebaseService.logger.log(`🔕 개발 환경이므로 알림을 보내지 않습니다.`);
      }
    } catch (error) {
      FirebaseService.logger.error(`🚨 푸시알림 보내기 실패: ${error.message}`);
    }
  }
}