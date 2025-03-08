/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-03-08
 */

import { Controller, Post, Body } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';

/**
 * FirebaseController
 *
 * 이 컨트롤러는 Firebase를 통한 알림 전송 관련 API 엔드포인트를 제공합니다.
 * 
 * ### 주요 기능:
 * - POST /send-to-device
 * - POST /send-to-major
 */
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

  // 학과 새로운 공지사항 알림
  @Post('send-to-major')
  async sendNotificationToAll(@Body() body: any): Promise<void> {
    const { topic, noticeTitle, data } = body;

    // Firebase 푸시 알림 발송 (전체 사용자)
    await this.firebaseService.sendMajorNotification(noticeTitle, topic, data);
  }
}