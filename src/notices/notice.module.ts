/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-02-22
 */

import { Module } from '@nestjs/common';
import { MajorNoticeScraperService } from 'src/notices/scraper/major-notice-scraper.service';
import { MajorNoticeSchedulerService } from 'src/notices/scheduler/major-notice-scheduler.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { WholeNoticeScraperService } from 'src/notices/scraper/whole-notice-scraper.service';
import { WholeNoticeSchedulerService } from 'src/notices/scheduler/whole-notice-scheduler.service';
import { MajorStyleNoticeScraperService } from 'src/notices/scraper/major-style-notice-scraper.service';
import { MajorStyleNoticeSchedulerService } from 'src/notices/scheduler/major-style-notice-scheduler.service';

@Module({
    providers: [
        WholeNoticeScraperService,
        WholeNoticeSchedulerService,
        MajorNoticeScraperService,
        MajorNoticeSchedulerService,
        MajorStyleNoticeScraperService,
        MajorStyleNoticeSchedulerService,
        FirebaseService],
    exports: [
        WholeNoticeScraperService,
        WholeNoticeSchedulerService,
        MajorNoticeScraperService,
        MajorNoticeSchedulerService,
        MajorStyleNoticeScraperService,
        MajorStyleNoticeSchedulerService,
    ],
})
export class NoticeModule { }