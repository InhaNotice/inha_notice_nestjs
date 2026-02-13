/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2026-01-30
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import { AnyNode } from 'domhandler';
import { GeneralTagSelectors } from 'src/notices/selectors/major.selector';
import { NotificationPayload } from 'src/interfaces/notification-payload.interface';
import { AbsoluteStyleScraper } from 'src/notices/scrapers/absolute-style/absolute-style.scraper';
import { IDENTIFIER_CONSTANT } from 'src/constants/identifiers/identifier.constant';
import { AxiosResponse } from 'axios';

/**
 * 학과 공지 크롤링 서비스
 * 
 * ### 주요 기능:
 * - 입력 받은 학과와 페이지 기반의 일반 공지사항을 크롤링하여 공지사항 객체를 반환
 */
@Injectable()
export class MajorScraper extends AbsoluteStyleScraper {
    /**
     * MajorNoticeScraperService 생성자
     * @param {ConfigService} configService - 모든 학과 URL 초기화
     */
    constructor(private readonly configService: ConfigService) {
        super();
        this.configName = 'majors';
        const noticeConfig: Record<string, {
            baseUrl: string,
            queryUrl: string
        }> =
            this.configService.get<Record<string, { baseUrl: string; queryUrl: string }>>(this.configName, {});

        this.logger = new Logger(MajorScraper.name);
        this.noticeTypes = Object.keys(noticeConfig);
        this.noticeTypeUrls = this.loadUrls(noticeConfig, 'baseUrl');
        this.noticeTypeQueryUrls = this.loadUrls(noticeConfig, 'queryUrl');
    }

    /**
     * 응답 받은 HTML을 전처리하는 함수
     * @param {cheerio.CheerioAPI} $ - Cheerio API 인스턴스 
     * @param {string} baseUrl - 공지사항 표준 링크 (이후 게시물 링크 생성)
     * @returns {NotificationPayload[]} - 전처리된 공지사항 객체 배열
     */
    fetchGeneralNotices($: cheerio.CheerioAPI, baseUrl: string): NotificationPayload[] {
        const generals: cheerio.Cheerio<AnyNode> = $(GeneralTagSelectors.NOTICE_BOARD);
        const results: NotificationPayload[] = [];

        generals.each((_, element) => {
            const titleLinkTag: cheerio.Cheerio<AnyNode> = $(element).find(GeneralTagSelectors.NOTICE_TITLE_LINK);
            const titleStrongTag: cheerio.Cheerio<AnyNode> = $(element).find(GeneralTagSelectors.NOTICE_TITLE_STRONG);
            const dateTag: cheerio.Cheerio<AnyNode> = $(element).find(GeneralTagSelectors.NOTICE_DATE);
            const writerTag: cheerio.Cheerio<AnyNode> = $(element).find(GeneralTagSelectors.NOTICE_WRITER);
            const accessTag: cheerio.Cheerio<AnyNode> = $(element).find(GeneralTagSelectors.NOTICE_ACCESS);

            // (게시물 링크, 제목, 날짜, 작성자, 조회수)가 존재하지 않는 공지사항은 포함시키지 않음
            // 이 규칙은 웹페이지 구조 변경시 동작하지 않을 수 있음
            if (!titleLinkTag.length || !titleStrongTag.length || !dateTag.length || !writerTag.length || !accessTag.length) {
                return;
            }

            const postUrl: string = titleLinkTag.attr('href') || '';

            const id: string = this.makeUniqueNoticeId(postUrl);
            const title: string = titleStrongTag.text().trim();
            const link: string = baseUrl + postUrl;
            const date: string = dateTag.text().trim();
            results.push({ id, title, link, date });
        });

        return results;
    }

    /**
     * HTML을 parse하여 반환합니다.
     * @param {AxiosResponse<ArrayBuffer>} response - 서버로 응답 받은 원본 HTML
     * @returns {Promise<cheerio.CheerioAPI>}
     */
    async parseHTML(response: AxiosResponse<ArrayBuffer>): Promise<cheerio.CheerioAPI> {
        const decodedHtml = Buffer.from(response.data).toString('utf-8');

        return cheerio.load(decodedHtml);
    }

    /**
     * 식별 가능한 공지 id를 반환
     * @param {string} postUrl - [bbs/[provider]/3113/[게시물 고유 번호]/artclView.do]
     * @returns {string} - 반환: [provider]-[게시물 고유 번호]
     */
    private makeUniqueNoticeId(postUrl: string): string {
        if (postUrl.length === 0) {
            return IDENTIFIER_CONSTANT.UNKNOWN_ID;
        }

        // 공지의 고유 URL을 배열로 변환
        const postUrlList: string[] = postUrl.split('/');
        if (postUrlList.length <= 4) {
            return IDENTIFIER_CONSTANT.UNKNOWN_ID;
        }

        // provider - [provider]
        const provider: string = postUrlList[2];
        // postId: [게시물 고유 번호]
        const postId: string = postUrlList[4];
        return `${provider}-${postId}`;
    }
}