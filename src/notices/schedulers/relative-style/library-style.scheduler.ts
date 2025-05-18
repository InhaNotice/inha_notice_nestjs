/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-18
 */

import { Injectable, Logger, Scope } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FirebaseService } from 'src/firebase/firebase.service';
import { NotificationPayload } from 'src/interfaces/notification-payload.interface';
import * as path from 'path';
import { FirebaseNotificationContext } from 'src/firebase/firebase-notification.context';
import { FirebaseMessagePayload } from 'src/interfaces/firebase-notificable.interface';
import { BaseScheduler } from '../base.scheduler';
import { LibraryStyleScraper } from 'src/notices/scrapers/relative-style/library-style.scraper';
import { LibraryStyleState } from 'src/firebase/states/library-style.state';
import { LIBRARY_STYLE_CRON } from 'src/constants/crons/library-style.cron.constant';

@Injectable({ scope: Scope.DEFAULT })
export class LibraryStyleScheduler extends BaseScheduler {
    constructor(
        private readonly firebaseService: FirebaseService,
        private readonly libraryStyleScraper: LibraryStyleScraper
    ) {
        super();
        this.logger = new Logger(LibraryStyleScraper.name);
        this.directoryName = 'library_styles';
        this.scraperService = this.libraryStyleScraper;
        this.databaseDirectory = path.join(process.cwd(), 'database', this.directoryName);
        this.databases = {};
        this.cachedNoticeIds = {};
        this.context = new FirebaseNotificationContext(new LibraryStyleState());
        // 디렉터리 생성
        this.initializeDatabaseDirectory();
        this.initializeDatabases();
    }

    @Cron(LIBRARY_STYLE_CRON.CRON_WEEKDAYS, { timeZone: 'Asia/Seoul' })
    async handleWeekDays() {
        await this.executeCrawling(LIBRARY_STYLE_CRON.TASK_WEEKDAYS);
    }

    @Cron(LIBRARY_STYLE_CRON.CRON_DELETE_OLD, { timeZone: 'Asia/Seoul' })
    async handleDelete() {
        await this.deleteOldNotices(LIBRARY_STYLE_CRON.TASK_DELETE_OLD);
    }

    async sendFirebaseMessaging(notice: NotificationPayload, topic: string): Promise<void> {
        const { title, body, data }: FirebaseMessagePayload = this.buildFirebaseMessagePayload(this.context, notice, topic);
        return await this.firebaseService.sendNotificationToTopic(topic, title, body, data);
    }
}