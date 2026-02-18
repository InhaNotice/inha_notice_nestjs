/*
 * This is file of the project inha_notice
 * Licensed under the MIT License.
 * Copyright (c) 2025-2026 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2026-02-18
 */

import { Logger, Inject } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { NotificationPayload } from 'src/interfaces/notification-payload.interface';
import { FirebaseNotificationContext } from 'src/firebase/firebase-notification.context';
import { FirebaseNotifiable } from 'src/interfaces/firebase-notificable.interface';
import { BaseScraper } from 'src/notices/scrapers/base.scraper';
import { NoticeRepository } from 'src/database/notice.repository';

/**
 * 공지사항 크롤링 스케줄러를 제공하는 추상클래스이다.
 * 
 * AbsoluteStyle, RelativeStyle 모두 지원한다.
 * 
 * ### 주요 기능:
 * - 크롤링, 오래된 공지 삭제 등 스케줄러 동작 정의
 * - 기타 헬퍼 함수 정의
 */
export abstract class BaseScheduler extends FirebaseNotifiable {
    protected logger: Logger;
    protected scraperService: BaseScraper;
    protected context: FirebaseNotificationContext;

    @Inject(NoticeRepository)
    protected noticeRepository: NoticeRepository;

    protected async executeCrawling(logPrefix: string): Promise<void> {
        this.logger.log(`📌 ${logPrefix} 크롤링 실행 중...`);

        try {
            const allNotices: Record<string, NotificationPayload[]> = await this.scraperService.fetchAllNotices();
            const today: string = this.getTodayDate();

            for (const noticeType of Object.keys(allNotices)) {
                const notices: NotificationPayload[] = allNotices[noticeType];
                if (!notices || notices.length === 0) continue;

                // 2. 오늘 날짜가 아닌 공지는 필터링
                const todayNotices: NotificationPayload[] = notices.filter(n => n.date === today);

                if (todayNotices.length === 0) continue;

                for (const notice of todayNotices) {
                    // 3. Repository를 통해 중복 확인 및 저장
                    // - true: DB에 없어서 저장 성공 (신규)
                    // - false: DB에 이미 있음 (중복)
                    const isNew: boolean = await this.noticeRepository.save(noticeType, notice);

                    if (isNew) {
                        // 4. 신규 공지라면 알림 전송
                        await this.sendFirebaseMessaging(notice, noticeType);
                    }
                }
            }
        } catch (error) {
            this.logger.error(`❌ ${logPrefix} 크롤링 중 오류 발생: ${error.message}`);
        } finally {
            this.logger.log(`🏁 ${logPrefix} 정기 크롤링 끝!`);
        }
    }

    /**
     * 오늘 날짜를 제외한 모든 공지사항 삭제
     */
    protected async deleteOldNotices(logPrefix: string): Promise<void> {
        const todayDate: string = this.getTodayDate();

        try {
            const deletedCount: number = await this.noticeRepository.deleteNoticesExcludingDate(todayDate);

            if (deletedCount > 0) {
                this.logger.log(`🗑️ ${logPrefix} 지난 공지 ${deletedCount}건 삭제 완료`);
            }
        } catch (error) {
            this.logger.error(`❌ ${logPrefix} 오래된 공지 삭제 중 오류: ${error.message}`);
        }
    }

    protected getTodayDate(): string {
        return dayjs().format('YYYY.MM.DD');
    }
}