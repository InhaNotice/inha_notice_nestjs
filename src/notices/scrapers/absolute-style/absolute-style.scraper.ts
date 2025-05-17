/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-17
 */

import { Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { NotificationPayload } from 'src/interfaces/notification-payload.interface';
import { HTTP_STATUS } from 'src/constants/http/http-status.constant';

/**
 * AbsoluteStyle의 공지사항 크롤링을 제공하는 추상클래스
 * 
 * ### 주요 기능:
 * - noticeType 별 공지사항 크롤링
 * - uniqueNoticeId 생성
 */
export abstract class AbsoluteStyleScraper {
    protected logger: Logger;
    protected configName: string;
    protected noticeTypes: string[];
    protected noticeTypeUrls: Record<string, string>;
    protected noticeTypeQueryUrls: Record<string, string>;

    /**
     * 응답 받은 HTML을 전처리하는 함수
     * @param {cheerio.CheerioAPI} $ - Cheerio API 인스턴스  
     * @param {string} baseUrl - 공지사항 표준 링크 (이후 게시물 링크 생성)
     * @return {NotificationPayload[]} - 전처리된 공지사항 배열 객체
     */
    abstract fetchGeneralNotices($: cheerio.CheerioAPI, baseUrl: string): NotificationPayload[];

    abstract parseHTML(response: AxiosResponse<ArrayBuffer>): Promise<cheerio.CheerioAPI>;

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
    public async fetchAllNotices(): Promise<Record<string, NotificationPayload[]>> {
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

    /**
     * 공지타입과 페이지 기반의 일반 공지사항을 크롤링하는 함수
     * @param {string} noticeType - 공지타입
     * @param {number} page - 페이지 번호
     * @returns {Promise<{general: NotificationPayload[]}>} - 공지사항 객체 배열로 반환
     */
    protected async fetchNotices(noticeType: string, page: number): Promise<{ general: NotificationPayload[] }> {
        const baseUrl: string = this.noticeTypeUrls[noticeType];
        const queryUrl: string = this.noticeTypeQueryUrls[noticeType];

        if (!baseUrl || !queryUrl) {
            this.logger.error(`${noticeType} 타입에 대응하는 env 정보 없음: ${noticeType}`);
            return { general: [] };
        }

        try {
            const connectUrl: string = `${queryUrl}${page}`;
            const response: AxiosResponse<ArrayBuffer> = await axios.get(connectUrl, {
                responseType: 'arraybuffer',
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
            throw new Error(`❌ ${noticeType}의 공지사항 크롤링 실패: ${error.message}`);
        }
    }

    /**
    * noticeTypes의 접근자
    * @returns {string[]} - 공지 타입 리스트 반환
    */
    public getAllNoticeTypes(): string[] {
        return this.noticeTypes;
    }
}