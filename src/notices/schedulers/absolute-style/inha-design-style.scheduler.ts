/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-17
 */

import { Injectable, Logger, Scope } from "@nestjs/common";
import { AbsoluteStyleScheduler } from "src/notices/schedulers/absolute-style/absolute-style.scheduler";
import { FirebaseService } from "src/firebase/firebase.service";
import { InhaDesignStyleScraper } from "src/notices/scrapers/absolute-style/inha-design-style.scraper";
import * as path from 'path';
import { Cron } from "@nestjs/schedule";
import { NotificationPayload } from 'src/interfaces/notification-payload.interface';
import { INHA_DESIGN_STYLE_CRON } from "src/constants/crons/inha-design-style.cron.constant";
import { FirebaseNotificationContext } from "src/firebase/firebase-notification.context";
import { FirebaseMessagePayload } from "src/interfaces/firebase-notificable.interface";
import { InhaDesignStyleState } from "src/firebase/states/inha-design-style.state";

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

    @Cron(INHA_DESIGN_STYLE_CRON.CRON_WEEKDAYS, { timeZone: 'Asia/Seoul' })
    async handleWeekDays() {
        await this.executeCrawling(INHA_DESIGN_STYLE_CRON.TASK_WEEKDAYS);
    }

    @Cron(INHA_DESIGN_STYLE_CRON.CRON_DELETE_OLD, { timeZone: 'Asia/Seoul' })
    async handleDelete() {
        await this.deleteOldNotices(INHA_DESIGN_STYLE_CRON.TASK_DELETE_OLD);
    }

    // ========================================
    // 3. sendFirebaseMessaging() 구현
    // ========================================

    async sendFirebaseMessaging(notice: NotificationPayload, topic: string): Promise<void> {
        const { title, body, data }: FirebaseMessagePayload = this.buildFirebaseMessagePayload(this.context, notice, topic);
        return await this.firebaseService.sendNotificationToTopic(topic, title, body, data);
    }
}