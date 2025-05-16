/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-16
 */

import { Injectable, Logger, Scope } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Notice } from 'src/notices/interfaces/notice.interface';
import * as path from 'path';
import { WholeScraper } from 'src/notices/scrapers/absolute-style/whole.scraper';
import { WHOLE_CRON } from 'src/constants/crons/whole.cron.constant';
import { AbsoluteStyleScheduler } from './absolute-style.scheduler';
import { FirebaseNotificationContext } from 'src/firebase/firebase-notification.context';
import { WholeState } from 'src/firebase/notifications/states/whole.state';

/**
 * 학사 공지(전체공지, 장학, 모집/채용) 스캐줄러
 * 
 * ### 주요 기능:
 * - 학사 공지를 크롤링하여 새로운 공지가 존재시 FCM 알림 전송
 * - 오래된 공지사항 주기적으로 삭제 진행
 * - 캐싱 전략을 사용한 효율적인 연산
 * 
 * ### 목차:
 * 1. 생성자 초기화
 * 2. 스케줄링 메서드 (Cron, 4개)
 * 3. sendFirebaseMessaging() 구현
 */
@Injectable({ scope: Scope.DEFAULT })
export class WholeNoticeSchedulerService extends AbsoluteStyleScheduler {
    // ========================================
    // 1. 생성자 초기화
    // ========================================

    constructor(
        private readonly firebaseService: FirebaseService,
        private readonly wholeNoticeScraperService: WholeScraper,
    ) {
        // 초기화
        super();
        this.logger = new Logger(WholeNoticeSchedulerService.name);
        this.directoryName = 'wholes';
        this.scraperService = this.wholeNoticeScraperService;
        this.databaseDirectory = path.join(process.cwd(), 'database', this.directoryName);
        this.databases = {};
        this.cachedNoticeIds = {};
        this.context = new FirebaseNotificationContext(new WholeState());
        // 디렉터리 생성
        this.initializeDatabaseDirectory();
        this.initializeDatabases();
    }

    // ========================================
    // 2. 스케줄링 메서드 (Cron, 4개)
    // ========================================

    @Cron(WHOLE_CRON.CRON_WEEKDAYS, { timeZone: 'Asia/Seoul' })
    async handleWeekDays() {
        await this.executeCrawling(WHOLE_CRON.TASK_WEEKDAYS);
    }

    @Cron(WHOLE_CRON.CRON_EVENING, { timeZone: 'Asia/Seoul' })
    async handleEvening() {
        await this.executeCrawling(WHOLE_CRON.TASK_EVENING);
    }

    @Cron(WHOLE_CRON.CRON_WEEKEND, { timeZone: 'Asia/Seoul' })
    async handleWeekend() {
        await this.executeCrawling(WHOLE_CRON.TASK_WEEKEND);
    }

    @Cron(WHOLE_CRON.CRON_DELETE_OLD, { timeZone: 'Asia/Seoul' })
    async handleDelete() {
        await this.deleteOldNotices(WHOLE_CRON.TASK_DELETE_OLD);
    }

    // ========================================
    // 3. sendFirebaseMessaging() 구현
    // ========================================

    /**
     * 
     * @param {Notice} notice - 새로운 공지 정보가 담긴 객체
     * @param {string} noticeType - 알림을 보낼 공지 타입
     */
    async sendFirebaseMessaging(notice: Notice, noticeType: string): Promise<void> {
        const { title, body, data } = this.buildFirebaseMessagePayload(notice, noticeType);
        return await this.firebaseService.sendNotificationToTopic(noticeType, title, body, data);
    }
}
