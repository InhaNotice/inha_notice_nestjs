/*
 * This is file of the project inha_notice
 * Licensed under the MIT License.
 * Copyright (c) 2025-2026 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-17
 */

import { Controller, Post, Body } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';

/**
 * 이 컨트롤러는 Firebase를 통한 알림 전송 관련 API 엔드포인트를 제공한다.
 * 
 * ### 주요 기능:
 * - POST /send-to-device
 */
@Controller('notifications')
export class FirebaseController {
  constructor(private readonly firebaseService: FirebaseService) { }

  // 특정 디바이스로 알림
  @Post('send-to-device')
  async sendNotification(@Body() body: any): Promise<void> {
    const { deviceToken, noticeTitle, data } = body;

    // Firebase 푸시 알림 발송
    await this.firebaseService.sendNotificationToDevice(deviceToken, noticeTitle, data);
  }
}