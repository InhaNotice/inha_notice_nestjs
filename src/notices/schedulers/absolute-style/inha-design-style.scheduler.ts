/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-13
 */

import { Injectable, Logger, Scope } from "@nestjs/common";
import { AbsoluteStyleScheduler } from "src/notices/schedulers/absolute-style/absolute-style.scheduler";
import { FirebaseService } from "src/firebase/firebase.service";
import { InhaDesignStyleScraper } from "src/notices/scrapers/absolute-style/inha-design-style.scraper";
import * as path from 'path';
import { Cron } from "@nestjs/schedule";
import { Notice } from 'src/notices/interfaces/notice.interface';
import { InhaDesignStyleConstant } from "src/constants/notice/scheduler/inha-design-style.constant";
import { FirebaseNotificationContext } from "src/firebase/firebase-notification.context";
import { InhaDesignStyleState } from "src/firebase/notifications/states/inha-design-style.state";

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
export class InhaDesignStyleScheduler extends AbsoluteStyleScheduler {
    // ========================================
    // 1. 생성자 초기화
    // ========================================
    constructor(
        private readonly firebaseService: FirebaseService,
        private readonly inhadesignStyleNoticeScraperService: InhaDesignStyleScraper
    ) {
        super();
        this.logger = new Logger(InhaDesignStyleScheduler.name);
        this.directoryName = 'inhadesign_styles';
        this.scraperService = this.inhadesignStyleNoticeScraperService;
        this.databaseDirectory = path.join(process.cwd(), 'database', this.directoryName);
        this.databases = {};
        this.cachedNoticeIds = {};
        this.context = new FirebaseNotificationContext(new InhaDesignStyleState());
        // 디렉터리 생성
        this.initializeDatabaseDirectory();
        this.initializeDatabases();
    }

    // ========================================
    // 2. 스케줄링 메서드 (Cron, 2개)
    // ========================================

    @Cron(InhaDesignStyleConstant.CRON_WEEKDAYS, { timeZone: 'Asia/Seoul' })
    async handleWeekDays() {
        await this.executeCrawling(InhaDesignStyleConstant.TASK_WEEKDAYS);
    }

    @Cron(InhaDesignStyleConstant.CRON_DELETE_OLD, { timeZone: 'Asia/Seoul' })
    async handleDelete() {
        await this.deleteOldNotices(InhaDesignStyleConstant.TASK_DELETE_OLD);
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