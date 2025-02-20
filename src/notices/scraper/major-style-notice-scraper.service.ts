import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { AnyNode } from 'domhandler';
import { GeneralTagSelectors } from 'src/notices/selectors/major-notice-tag-selectors';
import { Notice } from 'src/notices/interfaces/notice.interface';
import { IdentifierConstants } from 'src/constants/identifiers';
import { StatusCodeSettings } from 'src/constants/http-status';

/**
 * 학과 공지사항 스타일의 (국제처, SW중심대학사업단) 공지 크롤링 서비스
 * 
 * 주요 기능
 * - 입력 받은 공지타입과 페이지 기반의 일반 공지사항을 크롤링하여 공지사항 객체 배열로 반환
 */
@Injectable()
export class MajorStyleNoticeScraperService {
    private readonly noticeTypes: string[];
    private readonly noticeTypeUrls: Record<string, string>;
    private readonly noticeTypeQueryUrls: Record<string, string>;
    private readonly logger: Logger = new Logger(MajorStyleNoticeScraperService.name);

    /**
     * MajorStyleNoticeScraperService 생성자
     * @param {ConfigService} configService - 학과 공지사항 스타일의 (국제처, SW중심대학사업단) 공지 URL 초기화
     */
    constructor(private readonly configService: ConfigService) {
        this.noticeTypes = ['INTERNATIONAL', 'SWUNIV'];
        const majorStyles: Record<string, {
            baseUrl: string;
            queryUrl: string;
        }> = this.configService.get<Record<string, { baseUrl: string; queryUrl: string }>>('majorStyles', {});

        this.noticeTypeUrls = this.loadUrls(majorStyles, 'baseUrl');
        this.noticeTypeQueryUrls = this.loadUrls(majorStyles, 'queryUrl');
    }

    /**
     * 학과 스타일(국제처, SW중심대학사업단)의 공지사항 크롤링 URL(기본 URL 또는 조회 URL)을 초기화하는 함수
     *
     * @param {Record<string, { baseUrl: string; queryUrl: string }>} majorStyles - 학과 스타일별 baseUrl 및 queryUrl이 담긴 설정 객체
     * @param {'baseUrl' | 'queryUrl'} key - 가져오고자 하는 URL의 종류 ('baseUrl' 또는 'queryUrl')
     * @returns {Record<string, string>} noticeTypes를 키로 하고, 해당 URL(baseUrl 또는 queryUrl)을 값으로 갖는 객체
     */
    private loadUrls(
        majorStyles: Record<string, { baseUrl: string; queryUrl: string }>,
        key: 'baseUrl' | 'queryUrl'
    ): Record<string, string> {
        const results: Record<string, string> = {};

        for (let i = 0; i < this.noticeTypes.length; i++) {
            const noticeType = this.noticeTypes[i];
            results[noticeType] = majorStyles[noticeType]?.[key] || '';
        }

        return results;
    }

    /**
     * 학과 스타일(국제처, SW중심대학사업단)의 모든 공지사항을 크롤링 후 전처리한 공지 반환
     * @returns 
     */
    async fetchAllNotices(): Promise<Record<string, Notice[]>> {
        const results: Record<string, Notice[]> = {};

        for (const noticeType of this.noticeTypes) {
            try {
                const notices: { general: Notice[] } = await this.fetchNotices(noticeType, 1);
                results[noticeType] = notices.general;
            } catch (error) {
                this.logger.error(`❌ ${noticeType} 공지사항 크롤링 실패:`, error.message);
            }
        }

        return results;
    }

    /**
     * 공지타입과 페이지 기반의 일반 공지사항을 크롤링하는 함수
     * @param {string} noticeType - 공지타입: (국제처, SW중심대학사업단)
     * @param {number} page - 페이지 번호
     * @returns {Promise<{general: Notice[]}>} - 공지사항 객체 배열로 반환
     */
    async fetchNotices(noticeType: string, page: number): Promise<{ general: Notice[] }> {
        const baseUrl: string = this.noticeTypeUrls[noticeType];
        const queryUrl: string = this.noticeTypeQueryUrls[noticeType];

        if (!baseUrl || !queryUrl) {
            this.logger.error(`${noticeType} 타입에 대응하는 env 정보 없음: ${noticeType}`);
            return { general: [] };
        }

        try {
            const connectUrl: string = `${queryUrl}${page}`;
            const response: AxiosResponse<string> = await axios.get(connectUrl);

            if (response.status === StatusCodeSettings.STATUS_OKAY) {
                const $: cheerio.CheerioAPI = cheerio.load(response.data);
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
     * 응답 받은 HTML을 전처리하는 함수
     * @param {cheerio.CheerioAPI} $ - Cheerio API 인스턴스 
     * @param {string} baseUrl - 공지사항 표준 링크 (이후 게시물 링크 생성)
     * @returns {Notice[]} - 전처리된 공지사항 객체 배열
     */
    private fetchGeneralNotices($: cheerio.CheerioAPI, baseUrl: string): Notice[] {
        const headlines: cheerio.Cheerio<AnyNode> = $(GeneralTagSelectors.NOTICE_BOARD);
        const results: Notice[] = [];

        headlines.each((_, element) => {
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
            const writer: string = writerTag.text().trim();
            const access: string = accessTag.text().trim();
            results.push({ id, title, link, date, writer, access });
        });

        return results;
    }

    /**
     * 데이터베이스 저장을 위한 식별 가능한 공지 Id 생성 함수
     * @param {string} postUrl - 공지의 고유 URL: (bbs/internationalcenter/2507/[게시물 고유 번호]/artclView.do)
     * @returns {string} - 식별 가능한 공지 Id: (internationalcenter-[게시물 고유 번호])
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

        // provider: internationalcenter
        const provider: string = postUrlList[2];
        // postId: [게시물 고유 번호]
        const postId: string = postUrlList[4];
        return `${provider}-${postId}`;
    }

    /**
     * noticeTypes의 접근자
     * @returns {string[]} - 학과 공지사항 스타일의 (국제처, SW중심대학사업단) 키 리턴
     */
    getAllNoticeTypes(): string[] {
        return this.noticeTypes;
    }
}