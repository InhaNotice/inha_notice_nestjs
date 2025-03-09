/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-03-09
 */
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AbsoluteStyleScraperService } from "src/notices/scrapers/absolute-style/absolute-style-scraper.service";
import * as cheerio from 'cheerio';
import { AnyNode } from 'domhandler';
import { Notice } from 'src/notices/interfaces/notice.interface';
import { GeneralTagSelectors } from "src/notices/selectors/oceanography-style-notice-tag-selectors";
import { IdentifierConstants } from "src/constants/identifiers";
import * as url from 'url';
import { AxiosResponse } from 'axios';
import * as iconv from 'iconv-lite';

/**
 * 해양과학과 공지사항 스타일의 공지 크롤링 서비스
 * 
 * ### 주요 기능:
 * - 입력 받은 공지타입과 페이지 기반의 일반 공지사항을 크롤링하여 공지사항 객체 배열로 반환
 * 
 * ### 목차:
 * 1. 생성자 초기화
 * 2. fetchGeneralNotices() 구현
 * 3. parseHTML() 구현
 * 4. makeUniqueNoticeId() 구현
 */
@Injectable()
export class OceanographyStyleNoticeScraperService extends AbsoluteStyleScraperService {
    constructor(private readonly configService: ConfigService) {
        super();
        this.configName = 'oceanographyStyles';
        const noticeConfig: Record<string, {
            baseUrl: string;
            queryUrl: string;
        }> = this.configService.get<Record<string, { baseUrl: string; queryUrl: string }>>(this.configName, {});

        this.logger = new Logger(OceanographyStyleNoticeScraperService.name);
        this.noticeTypes = Object.keys(noticeConfig);
        this.noticeTypeUrls = this.loadUrls(noticeConfig, 'baseUrl');
        this.noticeTypeQueryUrls = this.loadUrls(noticeConfig, 'queryUrl');
    }

    /**
     * 주어진 HTML에서 일반 공지사항 목록을 추출하는 함수
     * @param {cheerio.CheerioAPI} $ - Cheerio API 인스턴스
     * @param {string} baseUrl - 공지사항의 표준 링크 (게시물 링크 생성 시 사용)
     * @returns {Notice[]} - 전처리된 공지사항 객체 배열
     */
    fetchGeneralNotices($: cheerio.CheerioAPI, baseUrl: string): Notice[] {
        const results: Notice[] = [];

        // 1. 테이블 선택
        const tableElements: cheerio.Cheerio<AnyNode> = $(GeneralTagSelectors.NOTICE_BOARD);
        if (tableElements.length === 0) return results;

        const noticeTableList: cheerio.Cheerio<AnyNode> = tableElements.eq(0).find(GeneralTagSelectors.NOTICE_BOARD_TABLE);
        if (noticeTableList.length < 2) return results;

        const noticeTable: cheerio.Cheerio<AnyNode> = noticeTableList.eq(1);
        const rowElements: cheerio.Cheerio<AnyNode> = noticeTable.find('tr');

        // 2. <td>가 정확히 6개인 <tr>만 필터링
        const generals = rowElements.filter((_, tr) => {
            return $(tr).find('td').length === 6;
        });

        // 3. generals의 첫 번째는 목차이므로 스킵
        generals.slice(1).each((_, general) => {
            const tdList = $(general).find('td');
            if (tdList.length < 6) return;

            const noticeIndexTag: cheerio.Cheerio<AnyNode> = tdList.eq(1);
            const titleTag: cheerio.Cheerio<AnyNode> = tdList.eq(2);
            const dateTag: cheerio.Cheerio<AnyNode> = tdList.eq(4);
            const writerTag: cheerio.Cheerio<AnyNode> = tdList.eq(3);
            const accessTag: cheerio.Cheerio<AnyNode> = tdList.eq(5);

            const noticeTag: string = noticeIndexTag.text().trim();
            // [공지]가 아닌 일반 공지만 추출
            if (noticeTag === GeneralTagSelectors.HEADLINE) return;

            const linkTag: cheerio.Cheerio<AnyNode> = $(general).find('a');
            const postUrl: string = linkTag.attr('href') ?? '';

            const id: string = this.makeUniqueNoticeId(postUrl);
            const title: string = titleTag.text().trim();
            const link: string = baseUrl + postUrl;
            const date: string = dateTag.text().trim();
            const writer: string = writerTag.text().trim();
            const access: string = accessTag.text().trim();
            console.log({ id, title, link, date, writer, access });
            results.push({ id, title, link, date, writer, access });
        });

        return results;
    }

    // ========================================
    // 3. parseHTML() 구현
    // ========================================

    /**
     * HTML을 parse하여 반환합니다.
     * @param {AxiosResponse<string>} response - 서버로 응답 받은 원본 HTML
     * @returns {Promise<cheerio.CheerioAPI>}
     */
    async parseHTML(response: AxiosResponse<string>): Promise<cheerio.CheerioAPI> {
        // 1. 응답 데이터를 euc-kr에서 UTF-8로 디코딩
        const decodedHtml = iconv.decode(Buffer.from(response.data), 'euc-kr');

        // 2. Cheerio를 사용하여 HTML 파싱
        return cheerio.load(decodedHtml);
    }


    // ========================================
    // 4. makeUniqueNoticeId() 구현
    // ========================================

    /**
     * 공지사항 URL을 기반으로 고유한 ID를 생성하는 함수
     * @param {string} postUrl - 공지사항 상세 페이지의 URL
     * @returns {string} - 고유한 공지 ID
     */
    private makeUniqueNoticeId(postUrl: string): string {
        // 1. postUrl이 비어 있는 경우 기본값 반환
        if (!postUrl || postUrl.trim().length === 0) {
            return IdentifierConstants.UNKNOWN_ID;
        }

        // 2. postUrl을 '/' 기준으로 분할
        const segments: string[] = postUrl.split('/');

        // 3. segments 리스트의 길이가 3보다 작으면 기본값 반환 (정해진 규격을 따르는지 확인)
        if (segments.length < 3) {
            return IdentifierConstants.UNKNOWN_ID;
        }

        try {
            // 4. idx를 추출할 URL은 segments[2] (Dart 코드 기준)
            const idxUrl = segments[2];

            // 5. idxUrl에서 'idx' 쿼리 파라미터 추출
            const parsedUrl = new url.URL(idxUrl);
            const postId: string | null = parsedUrl.searchParams.get('idx');

            // 6. postId가 존재하지 않으면 기본값 반환
            if (!postId) {
                return IdentifierConstants.UNKNOWN_ID;
            }

            // 7. 공급자(provider) 정보와 postId를 조합하여 고유 ID 생성
            const provider: string = GeneralTagSelectors.PROVIDER;
            return `${provider}-${postId}`;
        } catch (error) {
            // URL 파싱 중 예외가 발생한 경우 기본값 반환
            return IdentifierConstants.UNKNOWN_ID;
        }
    }
}