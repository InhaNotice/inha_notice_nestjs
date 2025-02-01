import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { AnyNode } from 'domhandler';
import { GeneralTagSelectors } from 'src/notices/selectors/notice-tag-selectors';
import { Notice } from 'src/notices/interfaces/notice.interface';
import { IdentifierConstants } from 'src/constants/identifiers';
import { StatusCodeSettings } from 'src/constants/http-status';

@Injectable()
export class MajorNoticeScraperService {
    private readonly majors: string[];
    private readonly majorUrls: Record<string, string>;
    private readonly majorQueryUrls: Record<string, string>;

    constructor(private readonly configService: ConfigService) {
        this.majors = this.loadMajors();
        this.majorUrls = this.loadMajorUrls();
        this.majorQueryUrls = this.loadMajorQueryUrls();
    }

    private loadMajors(): string[] {
        return Object.keys(process.env)
            .filter(key => key.endsWith('_QUERY_URL'))
            .map(key => key.replace('_QUERY_URL', ''));
    }

    private loadMajorUrls(): Record<string, string> {
        return this.majors.reduce((acc, major) => {
            acc[major] = this.configService.get<string>(`${major}_URL`, '');
            return acc;
        }, {} as Record<string, string>);
    }

    private loadMajorQueryUrls(): Record<string, string> {
        return this.majors.reduce((acc, major) => {
            acc[major] = this.configService.get<string>(`${major}_QUERY_URL`, '');
            return acc;
        }, {} as Record<string, string>);
    }

    async fetchNoticesForAllMajors(): Promise<Record<string, Notice[]>> {
        const results: Record<string, Notice[]> = {};

        for (const major of this.majors) {
            try {
                const notices: { general: Notice[] } = await this.fetchNotices(major, 1);
                results[major] = notices.general;
            } catch (error) {
                console.error(`❌ ${major} 공지사항 크롤링 실패:`, error.message);
            }
        }

        return results;
    }

    async fetchNotices(major: string, page: number): Promise<{ general: Notice[] }> {
        const baseUrl: string = this.majorUrls[major];
        const queryUrl: string = this.majorQueryUrls[major];

        if (!baseUrl || !queryUrl) {
            throw new Error(`학과 정보 없음: ${major}`);
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
                throw new Error(`Failed to load notices: ${response.status}`);
            }
        } catch (error) {
            throw new Error(`Error fetching notices: ${error.message}`);
        }
    }

    private fetchGeneralNotices($: cheerio.CheerioAPI, baseUrl: string): Notice[] {
        const headlines: cheerio.Cheerio<AnyNode> = $(GeneralTagSelectors.NOTICE_BOARD);
        const results: Notice[] = [];

        headlines.each((_, element) => {
            const titleLinkTag: cheerio.Cheerio<AnyNode> = $(element).find(GeneralTagSelectors.NOTICE_TITLE_LINK);
            const titleStrongTag: cheerio.Cheerio<AnyNode> = $(element).find(GeneralTagSelectors.NOTICE_TITLE_STRONG);
            const dateTag: cheerio.Cheerio<AnyNode> = $(element).find(GeneralTagSelectors.NOTICE_DATE);
            const writerTag: cheerio.Cheerio<AnyNode> = $(element).find(GeneralTagSelectors.NOTICE_WRITER);
            const accessTag: cheerio.Cheerio<AnyNode> = $(element).find(GeneralTagSelectors.NOTICE_ACCESS);

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

    private makeUniqueNoticeId(postUrl: string): string {
        if (postUrl.length === 0) {
            return IdentifierConstants.UNKNOWN_ID;
        }

        const postUrlList: string[] = postUrl.split('/');
        if (postUrlList.length <= 4) {
            return IdentifierConstants.UNKNOWN_ID;
        }

        const provider: string = postUrlList[2];
        const postId: string = postUrlList[4];
        return `${provider}-${postId}`;
    }
    public getAllMajors(): string[] {
        return this.majors;
    }
}