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
import { MajorStyleScraper } from 'src/notices/scrapers/absolute-style/major-style.scraper';
import { FirebaseService } from 'src/firebase/firebase.service';
import { NotificationPayload } from 'src/interfaces/notification-payload.interface';
import { MAJOR_STYLE_CRON } from 'src/constants/crons/major-style.cron.constant';
import { FirebaseNotificationContext } from 'src/firebase/firebase-notification.context';
import { MajorStyleState } from 'src/firebase/states/major-style.state';
import { FirebaseMessagePayload } from 'src/interfaces/firebase-notificable.interface';
import { BaseScheduler } from 'src/notices/schedulers/base.scheduler';
/**
 * 학과 스타일(국제처, SW중심대학사업단, 단과대, 대학원) 공지 스캐줄러
 * 
 * 주요 기능
 * - 학과 스타일의 공지를 크롤링하여 새로운 공지가 존재시 FCM 알림 전송
 * - 오래된 공지사항을 주기적으로 삭제 진행
 */
@Injectable({ scope: Scope.DEFAULT })
export class MajorStyleScheduler extends BaseScheduler {
    constructor(
        private readonly firebaseService: FirebaseService,
        private readonly majorStyleNoticesScraperService: MajorStyleScraper,
    ) {
        // 초기화
        super();
        this.logger = new Logger(MajorStyleScheduler.name);
        this.scraperService = this.majorStyleNoticesScraperService;
        this.context = new FirebaseNotificationContext(new MajorStyleState());
    }

    @Cron(MAJOR_STYLE_CRON.CRON_WEEKDAYS, { timeZone: 'Asia/Seoul' })
    async handleWeekDays() {
        await this.executeCrawling(MAJOR_STYLE_CRON.TASK_WEEKDAYS);
    }

    @Cron(MAJOR_STYLE_CRON.CRON_DELETE_OLD, { timeZone: 'Asia/Seoul' })
    async handleDelete() {
        await this.deleteOldNotices(MAJOR_STYLE_CRON.TASK_DELETE_OLD);
    }

    async sendFirebaseMessaging(notice: NotificationPayload, topic: string): Promise<void> {
        const { title, body, data }: FirebaseMessagePayload = this.buildFirebaseMessagePayload(this.context, notice, topic);
        return await this.firebaseService.sendNotificationToTopic(topic, title, body, data);
    }
}