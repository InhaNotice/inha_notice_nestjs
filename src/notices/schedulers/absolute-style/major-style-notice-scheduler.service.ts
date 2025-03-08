/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-03-08
 */
import { Injectable, Logger, Scope } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MajorStyleNoticeScraperService } from 'src/notices/scrapers/absolute-style/major-style-notice-scraper.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Notice } from 'src/notices/interfaces/notice.interface';
import * as path from 'path';
import { MajorStyleNoticeSchedulerConstants } from 'src/constants/schedulers/major-style-notice-scheduler-constants';
import { AbsoluteStyleNoticeSchedulerService } from 'src/notices/schedulers/absolute-style/absolute-style-notice-scheduler.service';

/**
 * 학과 스타일(국제처, SW중심대학사업단, 단과대, 대학원) 공지 스캐줄러
 * 
 * 주요 기능
 * - 학과 스타일의 공지를 크롤링하여 새로운 공지가 존재시 FCM 알림 전송
 * - 오래된 공지사항을 주기적으로 삭제 진행
 * - 캐싱 전략을 사용한 효율적인 연산
 * 
 * ### 목차:
 * 1. 생성자 초기화
 * 2. 스케줄링 메서드 (Cron, 2개)
 * 3. sendFirebaseMessaging() 구현
 */
@Injectable({ scope: Scope.DEFAULT })
export class MajorStyleNoticeSchedulerService extends AbsoluteStyleNoticeSchedulerService {
    // ========================================
    // 1. 생성자 초기화
    // ========================================

    constructor(
        private readonly firebaseService: FirebaseService,
        private readonly majorStyleNoticesScraperService: MajorStyleNoticeScraperService,
    ) {
        // 초기화
        super();
        this.logger = new Logger(MajorStyleNoticeSchedulerService.name);
        this.directoryName = 'major_styles';
        this.scraperService = this.majorStyleNoticesScraperService;
        this.databaseDirectory = path.join(process.cwd(), 'database', this.directoryName);
        this.databases = {};
        this.cachedNoticeIds = {};
        // 디렉터리 생성
        this.initializeDatabaseDirectory();
        this.initializeDatabases();
    }

    // ========================================
    // 2. 스케줄링 메서드 (Cron, 2개)
    // ========================================

    @Cron(MajorStyleNoticeSchedulerConstants.CRON_WEEKDAYS, { timeZone: 'Asia/Seoul' })
    async handleWeekDaysCron() {
        await this.executeCrawling(MajorStyleNoticeSchedulerConstants.TASK_WEEKDAYS);
    }

    @Cron(MajorStyleNoticeSchedulerConstants.CRON_DELETE_OLD, { timeZone: 'Asia/Seoul' })
    async handleDeleteCron() {
        await this.deleteOldNotices(MajorStyleNoticeSchedulerConstants.TASK_DELETE_OLD);
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
        return this.firebaseService.sendMajorStyleNotification(
            notice.title,
            noticeType,
            {
                id: notice.id,
                link: notice.link,
            }
        );
    }
}