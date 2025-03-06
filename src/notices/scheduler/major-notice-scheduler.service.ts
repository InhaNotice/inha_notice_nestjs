/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-03-04
 */

import { Injectable, Logger, Scope } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Notice } from 'src/notices/interfaces/notice.interface';
import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as dayjs from 'dayjs';
import * as fs from 'fs';
import { IdentifierConstants } from 'src/constants/identifiers';
import { MajorNoticeSchedulerConstants } from 'src/constants/scheduler-constants/major-notice-scheduler-constants';
import { MajorNoticeScraperService } from '../scraper/absolute-style-scraper/major-notice-scraper.service';
import { AbsoluteStyleNoticeSchedulerService } from './absolute-style-notice-scheduler.service';

/**
 * 모든 학과 공지 스캐줄러
 * 
 * ### 주요 기능:
 * - 모든 학과를 크롤링하여 새로운 공지가 존재시 FCM 알림 전송
 * - 오래된 공지사항을 주기적으로 삭제 진행
 * - 캐싱 전략을 사용한 효율적인 연산
 * 
 * ### 목차:
 * 1. 생성자 초기화
 * 2. 스케줄링 메서드 (Cron, 2개)
 * 3. sendFirebaseMessaging() 구현
 */
@Injectable({ scope: Scope.DEFAULT })
export class MajorNoticeSchedulerService extends AbsoluteStyleNoticeSchedulerService {
    // ========================================
    // 1. 생성자 초기화
    // ========================================

    constructor(
        private readonly firebaseService: FirebaseService,
        private readonly majorNoticeScraperService: MajorNoticeScraperService,
    ) {
        // 초기화
        super();
        this.logger = new Logger(MajorNoticeSchedulerService.name);
        this.directoryName = 'majors';
        this.scraperService = this.majorNoticeScraperService;
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

    @Cron(MajorNoticeSchedulerConstants.CRON_WEEKDAYS, { timeZone: 'Asia/Seoul' })
    async handleWeekDaysCron() {
        await this.executeCrawling(MajorNoticeSchedulerConstants.TASK_WEEKDAYS);
    }

    @Cron(MajorNoticeSchedulerConstants.CRON_DELETE_OLD, { timeZone: 'Asia/Seoul' })
    async handleDeleteCron() {
        await this.deleteOldNotices(MajorNoticeSchedulerConstants.TASK_DELETE_OLD);
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
        if (process.env.NODE_ENV === IdentifierConstants.kProduction) {
            await this.firebaseService.sendMajorNotification(
                notice.title,
                noticeType,
                {
                    id: notice.id,
                    link: notice.link,
                }
            )
        }
    }
}