/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-18
 */

import { Logger } from "@nestjs/common";
import { NotificationPayload } from "src/interfaces/notification-payload.interface";

export abstract class BaseScraper {
    protected logger: Logger;
    protected configName: string;
    protected noticeTypes: string[];
    protected noticeTypeUrls: Record<string, string>;
    protected noticeTypeQueryUrls: Record<string, string>;

    /**
     * 공지사항 크롤링 URL(기본 URL 또는 조회 URL)을 초기화하는 함수
     * @param {Record<string, { baseUrl: string; queryUrl: string }>} noticeConfig - 공지타입별 baseUrl 및 queryUrl이 담긴 설정 객체
     * @param {'baseUrl' | 'queryUrl'} key - 가져오고자 하는 URL의 종류 ('baseUrl' 또는 'queryUrl')
     * @returns {Record<string, string>} noticeTypes를 키로 하고, 해당 URL(baseUrl 또는 queryUrl)을 값으로 갖는 객체
     */
    protected loadUrls(
        noticeConfig: Record<string, { baseUrl: string; queryUrl: string }>,
        key: 'baseUrl' | 'queryUrl'
    ): Record<string, string> {
        const results: Record<string, string> = {};

        for (let i = 0; i < this.noticeTypes.length; i++) {
            const noticeType = this.noticeTypes[i];
            results[noticeType] = noticeConfig[noticeType]?.[key] || '';
        }

        return results;
    }

    /**
     * 모든 공지사항을 크롤링 후 전처리한 공지 반환
     * @returns {Promise<Record<string, NotificationPayload[]>>} 전처리된 모든 공지들 반환
     */
    async fetchAllNotices(): Promise<Record<string, NotificationPayload[]>> {
        const results: Record<string, NotificationPayload[]> = {};

        for (const noticeType of this.noticeTypes) {
            try {
                const notices: { general: NotificationPayload[] } = await this.fetchNotices(noticeType, 1);
                results[noticeType] = notices.general;
            } catch (error) {
                this.logger.error(`❌ ${noticeType} 공지사항 크롤링 실패:`, error.message);
            }
        }

        return results;
    }

    abstract fetchNotices(noticeType: string, page: number): Promise<{ general: NotificationPayload[] }>;

    /**
    * noticeTypes의 접근자
    * @returns {string[]} - 공지 타입 리스트 반환
    */
    getAllNoticeTypes(): string[] {
        return this.noticeTypes;
    }
}