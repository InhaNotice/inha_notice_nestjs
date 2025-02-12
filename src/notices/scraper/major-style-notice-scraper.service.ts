import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { AnyNode } from 'domhandler';
import { GeneralTagSelectors } from 'src/notices/selectors/major-notice-tag-selectors';
import { Notice } from 'src/notices/interfaces/notice.interface';
import { IdentifierConstants } from 'src/constants/identifiers';
import { StatusCodeSettings } from 'src/constants/http-status';

@Injectable()
export class MajorStyleNoticeScraperService {
    private readonly noticeTypes: string[];
    private readonly noticeTypeUrls: Record<string, string>;
    private readonly noticeTypeQueryUrls: Record<string, string>;
    private readonly logger: Logger = new Logger(MajorStyleNoticeScraperService.name);

    constructor(private readonly configService: ConfigService) {
        this.noticeTypes = ["INTERNATIONAL", "SWUNIV"];
        this.noticeTypeUrls = this.loadNoticeTypeUrls();
        this.noticeTypeQueryUrls = this.loadNoticeTypeQueryUrls();
    }

    private loadNoticeTypeUrls(): Record<string, string> {
        return this.noticeTypes.reduce((acc, noticeType) => {
            acc[noticeType] = this.configService.get<string>(`major_styles.${noticeType}.url`, '');
            return acc;
        }, {} as Record<string, string>);
    }

    private loadNoticeTypeQueryUrls(): Record<string, string> {
        return this.noticeTypes.reduce((acc, noticeType) => {
            acc[noticeType] = this.configService.get<string>(`major_styles.${noticeType}.queryUrl`, '');
            return acc;
        }, {} as Record<string, string>);
    }
    async fetchNoticesForAllNoticeTypes(): Promise<Record<string, Notice[]>> {
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

    async fetchNotices(noticeType: string, page: number): Promise<{ general: Notice[] }> {
        const baseUrl: string = this.noticeTypeUrls[noticeType];
        const queryUrl: string = this.noticeTypeQueryUrls[noticeType];

        if (!baseUrl || !queryUrl) {
            this.logger.error(`noticeType에 대응하는 env 정보 없음: ${noticeType}`);
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

    getAllNoticeTypes(): string[] {
        return this.noticeTypes;
    }
}