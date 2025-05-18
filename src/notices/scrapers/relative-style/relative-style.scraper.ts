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
import axios, { AxiosResponse } from 'axios';
import { HTTP_STATUS } from "src/constants/http/http-status.constant";
import { NotificationPayload } from "src/interfaces/notification-payload.interface";
import { BaseScraper } from "../base.scraper";

export abstract class RelativeStyleScraper extends BaseScraper {
    protected logger: Logger;
    protected configName: string;
    protected noticeTypes: string[];
    protected noticeTypeUrls: Record<string, string>;
    protected noticeTypeQueryUrls: Record<string, string>;

    abstract fetchGeneralNotices(response: AxiosResponse<any>, queryUrl: string, noticeType: string): NotificationPayload[];

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

    async fetchAllNotices(): Promise<Record<string, NotificationPayload[]>> {
        const results: Record<string, NotificationPayload[]> = {};

        for (const noticeType of this.noticeTypes) {
            try {
                const notices: { general: NotificationPayload[] } = await this.fetchNotices(noticeType);
                results[noticeType] = notices.general;
            } catch (error) {
                this.logger.error(`❌ ${noticeType} 공지사항 크롤링 실패:`, error.message);
            }
        }

        return results;
    }


    async fetchNotices(noticeType: string): Promise<{ general: NotificationPayload[] }> {
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
            offset: '0',
        };

        try {
            const response: AxiosResponse<any> = await axios.get(baseUrl, { params: generalParams });

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

    getAllNoticeTypes(): string[] {
        return this.noticeTypes;
    }
}