/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-03-10
 */
import { Injectable, Logger, Scope } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Notice } from 'src/notices/interfaces/notice.interface';
import * as path from 'path';
import { WholeNoticeScraperService } from 'src/notices/scrapers/absolute-style/whole-notice-scraper.service';
import { WholeNoticeSchedulerConstants } from 'src/constants/schedulers/whole-notice-scheduler-constants';
import { AbsoluteStyleNoticeSchedulerService } from './absolute-style-notice-scheduler.service';

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
export class WholeNoticeSchedulerService extends AbsoluteStyleNoticeSchedulerService {
    // ========================================
    // 1. 생성자 초기화
    // ========================================

    constructor(
        private readonly firebaseService: FirebaseService,
        private readonly wholeNoticeScraperService: WholeNoticeScraperService,
    ) {
        // 초기화
        super();
        this.logger = new Logger(WholeNoticeSchedulerService.name);
        this.directoryName = 'wholes';
        this.scraperService = this.wholeNoticeScraperService;
        this.databaseDirectory = path.join(process.cwd(), 'database', this.directoryName);
        this.databases = {};
        this.cachedNoticeIds = {};
        // 디렉터리 생성
        this.initializeDatabaseDirectory();
        this.initializeDatabases();
    }

    // ========================================
    // 2. 스케줄링 메서드 (Cron, 4개)
    // ========================================

    @Cron(WholeNoticeSchedulerConstants.CRON_WEEKDAYS, { timeZone: 'Asia/Seoul' })
    async handleWeekDaysCron() {
        await this.executeCrawling(WholeNoticeSchedulerConstants.TASK_WEEKDAYS);
    }

    @Cron(WholeNoticeSchedulerConstants.CRON_EVENING, { timeZone: 'Asia/Seoul' })
    async handleEveningCron() {
        await this.executeCrawling(WholeNoticeSchedulerConstants.TASK_EVENING);
    }

    @Cron(WholeNoticeSchedulerConstants.CRON_WEEKEND, { timeZone: 'Asia/Seoul' })
    async handleWeekendCron() {
        await this.executeCrawling(WholeNoticeSchedulerConstants.TASK_WEEKEND);
    }

    @Cron(WholeNoticeSchedulerConstants.CRON_DELETE_OLD, { timeZone: 'Asia/Seoul' })
    async handleDeleteCron() {
        await this.deleteOldNotices(WholeNoticeSchedulerConstants.TASK_DELETE_OLD);
    }

    // ========================================
    // 3. sendFirebaseMessaging() 구현
    // ========================================

    /**
     * 
     * @param {Notice} notice - 새로운 공지 정보가 담긴 객체
     * @param {string} noticeType - 알림을 보낼 공지 타입
     */
    async sendFirebaseMessaging(
        notice: Notice, noticeType: string
    ): Promise<void> {
        return this.firebaseService.sendWholeNotification(
            noticeType,
            notice.title,
            {
                id: notice.id,
                link: notice.link,
                date: notice.date,
            }
        )
    }
}
