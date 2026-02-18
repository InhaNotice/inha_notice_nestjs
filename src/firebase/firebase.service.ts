/*
 * This is file of the project inha_notice
 * Licensed under the MIT License.
 * Copyright (c) 2025-2026 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-19
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { IDENTIFIER_CONSTANT } from 'src/constants/identifiers/identifier.constant';

@Injectable()
export class FirebaseService {
  private static readonly logger: Logger = new Logger(FirebaseService.name);

  constructor(@Inject('FIREBASE_ADMIN') private readonly firebaseAdmin: typeof admin) { }

  /**
   * 특정 디바이스 1대에 알림을 보낸다.
   * @param {string} deviceToken 
   * @param {string} noticeTitle 
   * @param {Record<string, string>} data 
   * @returns {Promise<void>}
   */
  async sendNotificationToDevice(
    deviceToken: string,
    noticeTitle: string,
    data?: Record<string, string>,
  ): Promise<void> {
    try {
      const notificationTitle: string = '새로운 공지사항이 있어요!';
      const notificationBody: string = noticeTitle;

      const message: admin.messaging.Message = {
        notification: {
          title: notificationTitle,
          body: notificationBody
        },
        data: data || {},
        token: deviceToken,
        android: {
          priority: 'high',
        },
      };

      const notificationDate: string = data?.date ?? IDENTIFIER_CONSTANT.UNKNOWN_DATE;

      if (process.env.NODE_ENV === IDENTIFIER_CONSTANT.kProduction) {
        await this.firebaseAdmin.messaging().send(message);
        FirebaseService.logger.log(`🔔 ${deviceToken}: \"${notificationBody}\"-\"${notificationDate}\"`);
      } else {
        FirebaseService.logger.debug(`🔕 ${deviceToken}: \"${notificationBody}\"-\"${notificationDate}\"`);
      }
    } catch (error) {
      FirebaseService.logger.error(`🚨 푸시알림 보내기 실패: ${error.message}`);
    }
  }

  /**
   * 토픽을 구독하고 있는 모든 디바이스로 알림을 보낸다.
   * @param {string} topic
   * @param {string} notificationTitle 
   * @param {string} notificationBody 
   * @param {Record<string, string>} data 
   * @returns 
   */
  async sendNotificationToTopic(
    topic: string,
    notificationTitle: string,
    notificationBody: string,
    data?: Record<string, string>
  ): Promise<void> {
    try {
      const message: admin.messaging.Message = {
        notification: {
          title: notificationTitle,
          body: notificationBody
        },
        data: data || {},
        topic: topic,
        android: {
          priority: 'high',
        },
      };

      const notificationDate: string = data?.date ?? IDENTIFIER_CONSTANT.UNKNOWN_DATE;

      if (process.env.NODE_ENV == IDENTIFIER_CONSTANT.kProduction) {
        await this.firebaseAdmin.messaging().send(message);
        FirebaseService.logger.log(`🔔 ${topic}: \"${notificationBody}\"-\"${notificationDate}\"`);
        return;
      }
      FirebaseService.logger.debug(`🔕 ${topic}: \"${notificationBody}\"-\"${notificationDate}\"`);
    } catch (e) {
      FirebaseService.logger.error(`🚨 푸시알림 보내기 실패: ${e.message}`);
    }
  }
}