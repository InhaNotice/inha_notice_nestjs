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
    private readonly baseUrl: string;
    private readonly queryUrl: string;

    constructor(private readonly configService: ConfigService) {
        this.baseUrl = this.configService.get<string>('major.url') || '';
        this.queryUrl = this.configService.get<string>('major.query_url') || '';
    }

    async fetchNotices(page: number): Promise<{ general: Notice[] }> {
        try {
            const connectUrl: string = `${this.queryUrl}${page}`;
            const response: AxiosResponse<string> = await axios.get(connectUrl);

            if (response.status === StatusCodeSettings.STATUS_OKAY) {
                const $: cheerio.CheerioAPI = cheerio.load(response.data);

                return {
                    general: this.fetchGeneralNotices($),
                };
            } else {
                throw new Error(`Failed to load notices: ${response.status}`);
            }
        } catch (error) {
            throw new Error(`Error fetching notices: ${error.message}`);
        }
    }

    private fetchGeneralNotices($: cheerio.CheerioAPI): Notice[] {
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
            const link: string = this.baseUrl + postUrl;
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
        const uniqueNoticeId: string = `${provider}-${postId}`;
        return uniqueNoticeId;
    }
}