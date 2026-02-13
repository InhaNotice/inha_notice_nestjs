/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2026-02-01
 */

import axios, { AxiosResponse } from 'axios';
import { HTTP_STATUS } from "src/constants/http/http-status.constant";
import { NotificationPayload } from "src/interfaces/notification-payload.interface";
import { BaseScraper } from 'src/notices/scrapers/base.scraper';

export abstract class RelativeStyleScraper extends BaseScraper {
    abstract fetchGeneralNotices(response: AxiosResponse<any>, queryUrl: string, noticeType: string): NotificationPayload[];

    /**
     * 공지타입과 페이지 기반의 일반 공지사항을 크롤링하는 함수
     * @param {string} noticeType - 공지타입
     * @param {number} page - 페이지 번호
     * @returns {Promise<{general: NotificationPayload[]}>} - 공지사항 객체 배열로 반환
     */
    async fetchNotices(noticeType: string, page: number): Promise<{ general: NotificationPayload[] }> {
        const baseUrl = this.noticeTypeUrls[noticeType];
        const queryUrl = this.noticeTypeQueryUrls[noticeType];

        if (!baseUrl || !queryUrl) {
            this.logger.error(`${noticeType} 타입에 대응하는 env 정보 없음: ${noticeType}`);
            return { general: [] };
        }

        const generalParams: Record<string, string> = {
            onlyNoticableBulletin: 'false',
            nameOption: '',
            onlyWriter: 'false',
            max: '10',
            offset: (page - 1).toString(),
        };

        const minDelay: number = 500;
        const maxDelay: number = 1500;
        const randomDelay: number = Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay);
        await new Promise(resolve => setTimeout(resolve, randomDelay));

        try {
            const response: AxiosResponse<any> = await axios.get(baseUrl, {
                params: generalParams,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                }
            });

            if (response.status === HTTP_STATUS.STATUS_OKAY) {
                return {
                    general: this.fetchGeneralNotices(response, queryUrl, noticeType)
                };
            } else {
                throw new Error(`❌ 인하대 서버 응답 오류: ${response.status}`);
            }
        } catch (error) {
            throw new Error(`❌ ${noticeType}의 공지사항 크롤링 실패: ${error.message}`);
        }
    }
}