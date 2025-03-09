/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-03-09
 */
import { Injectable, Logger, Scope } from "@nestjs/common";
import { AbsoluteStyleNoticeSchedulerService } from "src/notices/schedulers/absolute-style/absolute-style-notice-scheduler.service";
import { FirebaseService } from "src/firebase/firebase.service";
import { InhadesignStyleNoticeScraperService } from "src/notices/scrapers/absolute-style/inhadesign-style-notice-scraper.service";
import * as path from 'path';
import { Cron } from "@nestjs/schedule";
import { Notice } from 'src/notices/interfaces/notice.interface';
import { InhadesignStyleNoticeSchedulerConstants } from "src/constants/schedulers/inhadesign-style-scheduler-constants";

/**
 * 디자인융합학과 스타일 공지 크롤링 스케줄러
 * 
 * ### 주요 기능:
 * - 디자인융합학과 스타일 공지를 크롤링하여 새로운 공지가 존재시 FCM 알림 전송
 * - 오래된 공지사항을 주기적으로 삭제 진행
 * - 캐싱 전략을 사용한 효율적인 연산
 * 
 * ### 목차:
 * 1. 생성자 초기화
 * 2. 스케줄링 메서드 (Cron, 2개)
 * 3. sendFirebaseMessaging() 구현
 */
@Injectable({ scope: Scope.DEFAULT })
export class InhadesignStyleNoticeSchedulerService extends AbsoluteStyleNoticeSchedulerService {
    // ========================================
    // 1. 생성자 초기화
    // ========================================
    constructor(
        private readonly firebaseService: FirebaseService,
        private readonly inhadesignStyleNoticeScraperService: InhadesignStyleNoticeScraperService
    ) {
        super();
        this.logger = new Logger(InhadesignStyleNoticeSchedulerService.name);
        this.directoryName = 'inhadesign_styles';
        this.scraperService = this.inhadesignStyleNoticeScraperService;
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

    @Cron(InhadesignStyleNoticeSchedulerConstants.CRON_WEEKDAYS, { timeZone: 'Asia/Seoul' })
    async handleWeekDaysCron() {
        await this.executeCrawling(InhadesignStyleNoticeSchedulerConstants.TASK_WEEKDAYS);
    }

    @Cron(InhadesignStyleNoticeSchedulerConstants.CRON_DELETE_OLD, { timeZone: 'Asia/Seoul' })
    async handleDeleteCron() {
        await this.deleteOldNotices(InhadesignStyleNoticeSchedulerConstants.TASK_DELETE_OLD);
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
        return this.firebaseService.sendInhadesignStyleNotification(
            notice.title,
            noticeType,
            {
                id: notice.id,
                link: notice.link,
                date: notice.date,
            }
        );
    }
}