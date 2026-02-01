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
import * as cheerio from 'cheerio';
import { NotificationPayload } from 'src/interfaces/notification-payload.interface';
import { HTTP_STATUS } from 'src/constants/http/http-status.constant';
import { BaseScraper } from '../base.scraper';

/**
 * AbsoluteStyle의 공지사항 크롤링을 제공하는 추상클래스
 * 
 * ### 주요 기능:
 * - noticeType 별 공지사항 크롤링
 * - uniqueNoticeId 생성
 */
export abstract class AbsoluteStyleScraper extends BaseScraper {
    abstract fetchGeneralNotices($: cheerio.CheerioAPI, baseUrl: string): NotificationPayload[];
    abstract parseHTML(response: AxiosResponse<ArrayBuffer>): Promise<cheerio.CheerioAPI>;

    /**
     * 공지타입과 페이지 기반의 일반 공지사항을 크롤링하는 함수
     * @param {string} noticeType - 공지타입
     * @param {number} page - 페이지 번호
     * @returns {Promise<{general: NotificationPayload[]}>} - 공지사항 객체 배열로 반환
     */
    async fetchNotices(noticeType: string, page: number): Promise<{ general: NotificationPayload[] }> {
        const baseUrl: string = this.noticeTypeUrls[noticeType];
        const queryUrl: string = this.noticeTypeQueryUrls[noticeType];

        if (!baseUrl || !queryUrl) {
            this.logger.error(`${noticeType} 타입에 대응하는 env 정보 없음: ${noticeType}`);
            return { general: [] };
        }

        const minDelay: number = 500;
        const maxDelay: number = 1500;
        const randomDelay: number = Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay);
        await new Promise(resolve => setTimeout(resolve, randomDelay));

        try {
            const connectUrl: string = `${queryUrl}${page}`;
            const response: AxiosResponse<ArrayBuffer> = await axios.get(connectUrl, {
                responseType: 'arraybuffer',
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                }
            });

            if (response.status === HTTP_STATUS.STATUS_OKAY) {
                const $: cheerio.CheerioAPI = await this.parseHTML(response);
                return {
                    general: this.fetchGeneralNotices($, baseUrl),
                };
            } else {
                throw new Error(`❌ 인하대 서버 응답 오류: ${response.status}`);
            }
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                this.logger.error(`⏰ ${noticeType} 요청 타임아웃 발생`);
            }
            throw new Error(`❌ ${noticeType}의 공지사항 크롤링 실패: ${error.message}`);
        }
    }
}