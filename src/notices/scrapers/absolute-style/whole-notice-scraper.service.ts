/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-03-09
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import { AnyNode } from 'domhandler';
import { Notice } from 'src/notices/interfaces/notice.interface';
import { GeneralTagSelectors } from 'src/notices/selectors/whole-notice-tag-selectors';
import { AbsoluteStyleScraperService } from 'src/notices/scrapers/absolute-style/absolute-style-scraper.service';
import { IdentifierConstants } from 'src/constants/identifiers';
import { AxiosResponse } from 'axios';
import * as iconv from 'iconv-lite';

/**
 * 학사 공지사항 크롤링 서비스(전체공지, 장학, 모집/채용)
 * 
 * ### 주요 기능:
 * - 입력 받은 페이지 기반의 일반 공지사항을 크롤링하여 공지사항 객체 배열로 반환 
 * 
 * ### 목차:
 * 1. 생성자 초기화
 * 2. fetchGeneralNotices() 구현
 * 3. parseHTML() 구현
 * 4. makeUniqueNoticeId() 구현
 */
@Injectable()
export class WholeNoticeScraperService extends AbsoluteStyleScraperService {
    // ========================================
    // 1. 생성자 초기화
    // ========================================

    /**
     * WholeNoticeScraperService 생성자
     * @param {ConfigService} configService - 학사 공지사항 공지 URL 초기화
     */
    constructor(private readonly configService: ConfigService) {
        super();
        this.configName = 'wholes';
        const noticeConfig: Record<string, {
            baseUrl: string;
            queryUrl: string;
        }> = this.configService.get<Record<string, { baseUrl: string; queryUrl: string }>>(this.configName, {});

        this.noticeTypes = Object.keys(noticeConfig);
        this.noticeTypeUrls = this.loadUrls(noticeConfig, 'baseUrl');
        this.noticeTypeQueryUrls = this.loadUrls(noticeConfig, 'queryUrl');
    }

    // ========================================
    // 2. fetchGeneralNotices() 구현
    // ========================================

    fetchGeneralNotices($: cheerio.CheerioAPI, baseUrl: string): Notice[] {
        const generals: cheerio.Cheerio<AnyNode> = $(GeneralTagSelectors.NOTICE_BOARD);
        const results: Notice[] = [];

        generals.each((_, element) => {
            const titleTag: cheerio.Cheerio<AnyNode> = $(element).find(GeneralTagSelectors.NOTICE_TITLE);
            const dateTag: cheerio.Cheerio<AnyNode> = $(element).find(GeneralTagSelectors.NOTICE_DATE);
            const writerTag: cheerio.Cheerio<AnyNode> = $(element).find(GeneralTagSelectors.NOTICE_WRITER);
            const accessTag: cheerio.Cheerio<AnyNode> = $(element).find(GeneralTagSelectors.NOTICE_ACCESS);

            // (제목, 날짜, 작성자, 조회수)가 존재하지 않는 공지사항은 포함시키지 않음
            // 이 규칙은 웹페이지 구조 변경시 동작하지 않을 수 있음
            if (!titleTag.length || !dateTag.length || !writerTag.length || !accessTag.length) {
                return;
            }

            const postUrl: string = titleTag.attr('href') || '';

            const id: string = this.makeUniqueNoticeId(postUrl);

            // 제목 태그의 불필요한 span.newArtcl 태그는 삭제
            if (titleTag.find('span.newArtcl').length > 0) {
                titleTag.find('span.newArtcl').remove();
            }
            const title: string = titleTag.text().trim();

            const link: string = baseUrl + postUrl;
            // YYYY.MM.DD. -> YYYY.MM.DD로 전처리
            const date: string = dateTag.text().trim().replace(/\.$/, '');
            const writer: string = writerTag.text().trim();
            const access: string = accessTag.text().trim();
            results.push({ id, title, link, date, writer, access });
        });

        return results;
    }

    // ========================================
    // 3. parseHTML() 구현
    // ========================================

    /**
     * HTML을 parse하여 반환합니다.
     * @param {AxiosResponse<ArrayBuffer>} response - 서버로 응답 받은 원본 HTML
     * @returns {Promise<cheerio.CheerioAPI>}
     */
    async parseHTML(response: AxiosResponse<ArrayBuffer>): Promise<cheerio.CheerioAPI> {
        const decodedHtml = Buffer.from(response.data).toString('utf-8');

        return cheerio.load(decodedHtml);
    }

    // ========================================
    // 4. makeUniqueNoticeId() 구현
    // ========================================

    /**
     * 식별 가능한 공지 id를 반환
     * @param {string} postUrl - [bbs/[provider]/3113/[게시물 고유 번호]/artclView.do]
     * @returns {string} - 반환: [provider]-[게시물 고유 번호]
     */
    private makeUniqueNoticeId(postUrl: string): string {
        if (postUrl.length === 0) {
            return IdentifierConstants.UNKNOWN_ID;
        }

        // 공지의 고유 URL을 배열로 변환
        const postUrlList: string[] = postUrl.split('/');
        if (postUrlList.length <= 4) {
            return IdentifierConstants.UNKNOWN_ID;
        }

        // provider - [provider]
        const provider: string = postUrlList[2];
        // postId: [게시물 고유 번호]
        const postId: string = postUrlList[4];
        return `${provider}-${postId}`;
    }
}