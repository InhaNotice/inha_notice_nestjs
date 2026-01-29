/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2026-01-29
 */

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AbsoluteStyleScraper } from "src/notices/scrapers/absolute-style/absolute-style.scraper";
import * as cheerio from 'cheerio';
import { AnyNode } from 'domhandler';
import { NotificationPayload } from 'src/interfaces/notification-payload.interface';
import { GeneralTagSelectors } from "src/notices/scrapers/selectors/inhadesign-style.selector";
import { AxiosResponse } from 'axios';
import { IDENTIFIER_CONSTANT } from "src/constants/identifiers/identifier.constant";

@Injectable()
export class InhaDesignStyleScraper extends AbsoluteStyleScraper {
    constructor(private readonly configService: ConfigService) {
        super();
        this.configName = 'inhaDesignStyles';
        const noticeConfig: Record<string, {
            baseUrl: string;
            queryUrl: string;
        }> = this.configService.get<Record<string, { baseUrl: string; queryUrl: string }>>(this.configName, {});

        this.logger = new Logger(InhaDesignStyleScraper.name);
        this.noticeTypes = Object.keys(noticeConfig);
        this.noticeTypeUrls = this.loadUrls(noticeConfig, 'baseUrl');
        this.noticeTypeQueryUrls = this.loadUrls(noticeConfig, 'queryUrl');
    }

    /**
     * 주어진 HTML에서 일반 공지사항 목록을 추출하는 함수
     * @param {cheerio.CheerioAPI} $ - Cheerio API 인스턴스
     * @param {string} baseUrl - 공지사항의 표준 링크 (게시물 링크 생성 시 사용)
     * @returns {NotificationPayload[]} - 전처리된 공지사항 객체 배열
     */
    fetchGeneralNotices($: cheerio.CheerioAPI, baseUrl: string): NotificationPayload[] {
        const results: NotificationPayload[] = [];
        const noticeBoard: cheerio.Cheerio<AnyNode> = $(GeneralTagSelectors.NOTICE_BOARD);

        if (!noticeBoard.length) return results;

        const generals: cheerio.Cheerio<AnyNode> = noticeBoard.find(GeneralTagSelectors.NOTICE_BOARD_POSTS);
        if (!generals.length) return results;

        generals.each((_, element) => {
            const general: cheerio.Cheerio<AnyNode> = $(element);

            const titleTag: cheerio.Cheerio<AnyNode> = general.find(GeneralTagSelectors.NOTICE_TITLE);
            const linkTag: cheerio.Cheerio<AnyNode> = general.find(GeneralTagSelectors.NOTICE_TITLE_LINK);
            const dateTag: cheerio.Cheerio<AnyNode> = general.find(GeneralTagSelectors.NOTICE_DATE);

            if (!titleTag.length || !linkTag.length || !dateTag.length) {
                return;
            }

            const id: string = general.attr('id') || 'UNKNOWN_ID';
            const title: string = titleTag.text().trim();
            const originalLink: string = linkTag.attr('href') || '';
            const link: string = this.parseLink(originalLink, baseUrl);
            const originalDate: string = dateTag.text().trim();
            const date: string = this.parseDate(originalDate);

            const writer: string = IDENTIFIER_CONSTANT.UNKNOWN_WRITER;
            const access: string = IDENTIFIER_CONSTANT.UNKNOWN_ACCESS;

            results.push({ id, title, link, date, writer, access });
        });

        return results;
    }

    /**
     * HTML을 parse하여 반환합니다.
     * @param {AxiosResponse<ArrayBuffer>} response - 서버로 응답 받은 원본 HTML
     * @returns {Promise<cheerio.CheerioAPI>}
     */
    async parseHTML(response: AxiosResponse<ArrayBuffer>): Promise<cheerio.CheerioAPI> {
        const decodedHtml: string = Buffer.from(response.data).toString('utf-8');

        return cheerio.load(decodedHtml);
    }

    /**
     * 날짜를 'M/D/YYYY' → 'YYYY.MM.DD' 형식으로 변환하는 함수
     * @param {string} originalDate - 원본 날짜 (예: '3/2/2025')
     * @returns {string} - 변환된 날짜 (예: '2025.03.02')
     */
    private parseDate(originalDate: string): string {
        const parts: string[] = originalDate.split('/');
        if (parts.length !== 3) return '';

        const month: string = parts[0].padStart(2, '0');
        const day: string = parts[1].padStart(2, '0');
        const year: string = parts[2];
        return `${year}.${month}.${day}`;
    }

    /**
     * 상대 경로 링크를 절대 경로로 변환하는 함수
     * @param {string} originalLink - 원본 링크
     * @param {string} baseUrl - 기본 도메인 URL
     * @returns {string} - 변환된 절대 경로 링크
     */
    private parseLink(originalLink: string, baseUrl: string): string {
        if (originalLink.startsWith('//')) {
            return `http://${originalLink.replace('//', '')}`;
        }
        return originalLink.startsWith('http') ? originalLink : `${baseUrl}${originalLink}`;
    }
}