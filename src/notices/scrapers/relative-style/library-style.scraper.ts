/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2026-01-30
 */

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AxiosResponse } from 'axios';
import { NotificationPayload } from "src/interfaces/notification-payload.interface";
import { RelativeStyleScraper } from "src/notices/scrapers/relative-style/relative-style.scraper";

@Injectable()
export class LibraryStyleScraper extends RelativeStyleScraper {
    constructor(private readonly configService: ConfigService) {
        super();
        this.configName = 'libraryStyle';
        const noticeConfig: Record<string, {
            baseUrl: string;
            queryUrl: string
        }> = this.configService.get<Record<string, { baseUrl: string, queryUrl: string }>>(this.configName, {});

        this.logger = new Logger(LibraryStyleScraper.name);
        this.noticeTypes = Object.keys(noticeConfig);
        this.noticeTypeUrls = this.loadUrls(noticeConfig, 'baseUrl');
        this.noticeTypeQueryUrls = this.loadUrls(noticeConfig, 'queryUrl');
    }

    fetchGeneralNotices(response: AxiosResponse<any>, queryUrl: string, noticeType: string): NotificationPayload[] {
        const results: NotificationPayload[] = [];
        const list = response.data?.data?.list as any[] ?? [];
        for (const notice of list) {
            const postId: string = String(notice.id);
            const id: string = `${noticeType}-${postId}`;
            const title: string = String(notice.title);
            const link: string = `${queryUrl}/${postId}`;
            const rawDate: string = String(notice.lastUpdated);
            const parsedDate: Date = new Date(rawDate);
            const date: string =
                `${parsedDate.getFullYear()}.` +
                `${String(parsedDate.getMonth() + 1).padStart(2, '0')}.` +
                `${String(parsedDate.getDate()).padStart(2, '0')}`;

            results.push({ id, title, link, date });
        }
        return results;
    }
}