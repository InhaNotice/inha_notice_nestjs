/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-02-22
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { AnyNode } from 'domhandler';
import { Notice } from 'src/notices/interfaces/notice.interface';
import { IdentifierConstants } from 'src/constants/identifiers';
import { StatusCodeSettings } from 'src/constants/http-status';
import { GeneralTagSelectors } from 'src/notices/selectors/whole-notice-tag-selectors';

/**
 * 학사 공지 크롤링 서비스
 * 
 * 주요 기능
 * - 입력 받은 페이지 기반의 일반 공지사항을 크롤링하여 공지사항 객체 배열로 반환 
 */
@Injectable()
export class WholeNoticeScraperService {
    private readonly baseUrl: string;
    private readonly queryUrl: string;

    /**
     * WholeNoticeScraperService 생성자
     * @param {ConfigService} configService - 학사 공지 URL을 가져옴
     */
    constructor(private readonly configService: ConfigService) {
        this.baseUrl = this.configService.get<string>('whole.baseUrl') || '';
        this.queryUrl = this.configService.get<string>('whole.queryUrl') || '';
    }

    /**
     * 특정 페이지의 공지사항을 크롤링하는 함수
     * @param {number} page - 공지사항 페이지 번호
     * @returns {Promise<Notice[]>} - 전처리된 공지사항 객체 배열
     * @throws {Error} - 크롤링 실패 시 에러 발생
     */
    async fetchNotices(page: number): Promise<Notice[]> {
        try {
            const connectUrl: string = `${this.queryUrl}${page}`;
            const response: AxiosResponse<string> = await axios.get(connectUrl);

            if (response.status === StatusCodeSettings.STATUS_OKAY) {
                const $: cheerio.CheerioAPI = cheerio.load(response.data);
                return this.fetchGeneralNotices($, this.baseUrl);
            } else {
                throw new Error(`❌ 인하대 서버 응답 오류: ${response.status}`);
            }
        } catch (error) {
            throw new Error(`❌ 학사 공지사항 크롤링 실패: ${error.message}`);
        }
    }

    /**
     * 응답 받은 HTML을 전처리하는 함수
     * @param {cheerio.CheerioAPI} $ - Cheerio API 인스턴스 
     * @param {string} baseUrl - 공지사항 표준 링크 (이후 게시물 링크 생성)
     * @returns {Notice[]} - 전처리된 공지사항 객체 배열
     */
    private fetchGeneralNotices($: cheerio.CheerioAPI, baseUrl: string): Notice[] {
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

    /**
     * 데이터베이스 저장을 위한 식별 가능한 공지 Id 생성 함수
     * @param {string} postUrl - 공지의 고유 URL: (bbs/kr/8/[게시물 고유 번호]/artclView.do)
     * @returns {string} - 식별 가능한 공지 Id: (kr-[게시물 고유 번호])
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

        // provider: kr
        const provider: string = postUrlList[2];
        // postId: [게시물 고유 번호]
        const postId: string = postUrlList[4];
        return `${provider}-${postId}`;
    }
}