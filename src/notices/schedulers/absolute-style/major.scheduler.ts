/*
 * This is file of the project inha_notice
 * Licensed under the MIT License.
 * Copyright (c) 2025-2026 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2026-02-18
 */

import { Injectable, Logger, Scope } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FirebaseService } from 'src/firebase/firebase.service';
import { NotificationPayload } from 'src/interfaces/notification-payload.interface';
import { MAJOR_CRON } from 'src/constants/crons/major.cron.constant';
import { MajorScraper } from 'src/notices/scrapers/absolute-style/major.scraper';
import { FirebaseNotificationContext } from 'src/firebase/firebase-notification.context';
import { MajorState } from 'src/firebase/states/major.state';
import { FirebaseMessagePayload } from 'src/interfaces/firebase-notificable.interface';
import { BaseScheduler } from 'src/notices/schedulers/base.scheduler';

/**
 * 모든 학과 공지 스캐줄러
 * 
 * ### 주요 기능:
 * - 모든 학과를 크롤링하여 새로운 공지가 존재시 FCM 알림 전송
 * - 오래된 공지사항을 주기적으로 삭제 진행
 */
@Injectable({ scope: Scope.DEFAULT })
export class MajorNoticeScheduler extends BaseScheduler {
    constructor(
        private readonly firebaseService: FirebaseService,
        private readonly majorNoticeScraperService: MajorScraper,
    ) {
        // 초기화
        super();
        this.logger = new Logger(MajorNoticeScheduler.name);
        this.scraperService = this.majorNoticeScraperService;
        this.context = new FirebaseNotificationContext(new MajorState());
    }

    @Cron(MAJOR_CRON.CRON_WEEKDAYS, { timeZone: 'Asia/Seoul' })
    async handleWeekDays() {
        await this.executeCrawling(MAJOR_CRON.TASK_WEEKDAYS);
    }

    @Cron(MAJOR_CRON.CRON_DELETE_OLD, { timeZone: 'Asia/Seoul' })
    async handleDelete() {
        await this.deleteOldNotices(MAJOR_CRON.TASK_DELETE_OLD);
    }

    async sendFirebaseMessaging(notice: NotificationPayload, topic: string): Promise<void> {
        const { title, body, data }: FirebaseMessagePayload = this.buildFirebaseMessagePayload(this.context, notice, topic);
        return await this.firebaseService.sendNotificationToTopic(topic, title, body, data);
    }
}