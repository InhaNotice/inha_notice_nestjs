/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-08
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { majorMapping } from 'src/constants/notice/mappings/major.mapping';
import { majorStyleMapping } from 'src/constants/notice/mappings/major-style.mapping';
import { IdentifierConstants } from 'src/constants/identifiers';
import { wholeMapping } from 'src/constants/notice/mappings/whole.mapping';
import { oceanographyStyleMapping } from 'src/constants/notice/mappings/oceanography-style.mapping';
import { inhadesignStyleMapping } from 'src/constants/notice/mappings/inhadesign-style.mapping';

@Injectable()
export class FirebaseService {
  private static readonly logger: Logger = new Logger(FirebaseService.name);
  private static readonly kDefaultNotificationTitle: string = '새로운 공지사항이 있어요!';

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
      const notificationTitle: string = FirebaseService.kDefaultNotificationTitle;
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

      if (process.env.NODE_ENV === IdentifierConstants.kProduction) {
        await this.firebaseAdmin.messaging().send(message);

        const noticeId: string = data?.id ?? IdentifierConstants.UNKNOWN_ID;
        const noticeDate: string = data?.date ?? IdentifierConstants.UNKNOWN_DATE;
        FirebaseService.logger.log(`🔔 푸시알림 보내기 성공: \"${noticeId}\"-${noticeDate}`);
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
  private async sendNotificationToTopic(
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

      if (process.env.NODE_ENV === IdentifierConstants.kProduction) {
        await this.firebaseAdmin.messaging().send(message);

        const noticeId: string = data?.id ?? IdentifierConstants.UNKNOWN_ID;
        const noticeDate: string = data?.date ?? IdentifierConstants.UNKNOWN_DATE;
        FirebaseService.logger.log(`🔔 푸시알림 보내기 성공: \"${noticeId}\"-${noticeDate}`);
      }
    } catch (e) {
      FirebaseService.logger.error(`🚨 푸시알림 보내기 실패: ${e.message}`);
    }
  }

  /**
   * 학사(전체공지, 장학, 모집/채용)인 경우, 알림을 보낸다.
   * @param {string} topic - (ex) 'all-notices', 'SCHOLARSHIP' 등
   * @param {string} noticeTitle 
   * @param {Record<string, string} data 
   * @returns 
   */
  async sendWholeNotification(
    topic: string,
    noticeTitle: string,
    data?: Record<string, string>
  ): Promise<void> {
    const notificationTitle: string = wholeMapping[topic] ?? FirebaseService.kDefaultNotificationTitle;
    const notificationBody: string = noticeTitle;

    return this.sendNotificationToTopic(topic, notificationTitle, notificationBody, data);
  }


  /**
   * 학과인 경우, 일림을 보낸다.
   * @param {string} topic - (ex) 'MECH', 'CSE' 등
   * @param {string} noticeTitle 
   * @param {Record<string, string>} data 
   * @returns 
   */
  async sendMajorNotification(
    topic: string,
    noticeTitle: string,
    data?: Record<string, string>
  ): Promise<void> {
    const notificationTitle: string = majorMapping[topic] ?? FirebaseService.kDefaultNotificationTitle;
    const notificationBody: string = noticeTitle;

    return this.sendNotificationToTopic(topic, notificationTitle, notificationBody, data);
  }

  /**
   * 학과 스타일(국제처, SW중심대학사업단, 단과대, 대학원)인 경우, 일림을 보낸다.
   * @param {string} topic - (ex) 'INTERNATIONAL', 'SWUNIV' 등
   * @param {string} noticeTitle 
   * @param {Record<string, string>} data 
   * @returns 
   */
  async sendMajorStyleNotification(
    topic: string,
    noticeTitle: string,
    data?: Record<string, string>
  ): Promise<void> {
    const notificationTitle: string = majorStyleMapping[topic] ?? FirebaseService.kDefaultNotificationTitle;
    const notificationBody: string = noticeTitle;

    return this.sendNotificationToTopic(topic, notificationTitle, notificationBody, data);
  }

  /**
   * 해양과학과 스타일인 경우, 일림을 보낸다.
   * @param {string} topic - (ex) 'OCEANOGRAPHY'
   * @param {string} noticeTitle 
   * @param {Record<string, string>} data 
   * @returns 
   */
  async sendOceanographyStyleNotification(
    topic: string,
    noticeTitle: string,
    data?: Record<string, string>
  ): Promise<void> {
    const notificationTitle: string = oceanographyStyleMapping[topic] ?? FirebaseService.kDefaultNotificationTitle;
    const notificationBody: string = noticeTitle;

    return this.sendNotificationToTopic(topic, notificationTitle, notificationBody, data);
  }

  /**
   * 디자인융합학과 스타일인 경우, 일림을 보낸다.
   * @param {string} topic - (ex) 'INHADESIGN'
   * @param {string} noticeTitle 
   * @param {Record<string, string>} data 
   * @returns 
   */
  async sendInhadesignStyleNotification(
    topic: string,
    noticeTitle: string,
    data?: Record<string, string>
  ): Promise<void> {
    const notificationTitle: string = inhadesignStyleMapping[topic] ?? FirebaseService.kDefaultNotificationTitle;
    const notificationBody: string = noticeTitle;

    return this.sendNotificationToTopic(topic, notificationTitle, notificationBody, data);
  }
}