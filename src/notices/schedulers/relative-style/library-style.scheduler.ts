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
import { FirebaseNotificationContext } from 'src/firebase/firebase-notification.context';
import { FirebaseMessagePayload } from 'src/interfaces/firebase-notificable.interface';
import { BaseScheduler } from 'src/notices/schedulers/base.scheduler';
import { LibraryStyleScraper } from 'src/notices/scrapers/relative-style/library-style.scraper';
import { LibraryStyleState } from 'src/firebase/states/library-style.state';
import { LIBRARY_STYLE_CRON } from 'src/constants/crons/library-style.cron.constant';

/**
 * 정석학술정보관 스타일의 공지 스캐줄러
 * 
 * ### 주요 기능:
 * - 정석학술정보관 공지를 크롤링하여 새로운 공지가 존재시 FCM 알림 전송
 * - 오래된 공지사항 주기적으로 삭제 진행
 */
@Injectable({ scope: Scope.DEFAULT })
export class LibraryStyleScheduler extends BaseScheduler {
    constructor(
        private readonly firebaseService: FirebaseService,
        private readonly libraryStyleScraper: LibraryStyleScraper
    ) {
        super();
        this.logger = new Logger(LibraryStyleScraper.name);
        this.scraperService = this.libraryStyleScraper;
        this.context = new FirebaseNotificationContext(new LibraryStyleState());
    }

    @Cron(LIBRARY_STYLE_CRON.CRON_WEEKDAYS, { timeZone: 'Asia/Seoul' })
    async handleWeekDays() {
        await this.executeCrawling(LIBRARY_STYLE_CRON.TASK_WEEKDAYS);
    }

    @Cron(LIBRARY_STYLE_CRON.CRON_DELETE_OLD, { timeZone: 'Asia/Seoul' })
    async handleDelete() {
        await this.deleteOldNotices(LIBRARY_STYLE_CRON.TASK_DELETE_OLD);
    }

    async sendFirebaseMessaging(notice: NotificationPayload, topic: string): Promise<void> {
        const { title, body, data }: FirebaseMessagePayload = this.buildFirebaseMessagePayload(this.context, notice, topic);
        return await this.firebaseService.sendNotificationToTopic(topic, title, body, data);
    }
}