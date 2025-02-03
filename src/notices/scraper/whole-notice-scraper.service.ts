import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { AnyNode } from 'domhandler';
import { Notice } from 'src/notices/interfaces/notice.interface';
import { IdentifierConstants } from 'src/constants/identifiers';
import { StatusCodeSettings } from 'src/constants/http-status';
import { GeneralTagSelectors } from 'src/notices/selectors/whole-notice-tag-selectors';

@Injectable()
export class WholeNoticeScraperService {
    private readonly baseUrl: string;
    private readonly queryUrl: string;

    constructor(private readonly configService: ConfigService) {
        this.baseUrl = this.configService.get<string>('whole.baseUrl') || '';
        this.queryUrl = this.configService.get<string>('whole.queryUrl') || '';
    }

    async fetchNotices(page: number): Promise<Notice[]> {
        try {
            const connectUrl: string = `${this.queryUrl}${page}`;
            const response: AxiosResponse<string> = await axios.get(connectUrl);

            if (response.status === StatusCodeSettings.STATUS_OKAY) {
                const $: cheerio.CheerioAPI = cheerio.load(response.data);
                return this.fetchGeneralNotices($, this.baseUrl);
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
            const titleTag: cheerio.Cheerio<AnyNode> = $(element).find(GeneralTagSelectors.NOTICE_TITLE);
            const dateTag: cheerio.Cheerio<AnyNode> = $(element).find(GeneralTagSelectors.NOTICE_DATE);
            const writerTag: cheerio.Cheerio<AnyNode> = $(element).find(GeneralTagSelectors.NOTICE_WRITER);
            const accessTag: cheerio.Cheerio<AnyNode> = $(element).find(GeneralTagSelectors.NOTICE_ACCESS);

            if (!titleTag.length || !dateTag.length || !writerTag.length || !accessTag.length) {
                return;
            }

            const postUrl: string = titleTag.attr('href') || '';

            const id: string = this.makeUniqueNoticeId(postUrl);

            if (titleTag.find('span.newArtcl').length > 0) {
                titleTag.find('span.newArtcl').remove();
            }
            const title: string = titleTag.text().trim();

            const link: string = baseUrl + postUrl;
            const date: string = dateTag.text().trim().replace(/\.$/, '');
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
}