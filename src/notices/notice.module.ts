/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-03-09
 */

import { Module } from '@nestjs/common';
import { MajorNoticeScraperService } from 'src/notices/scrapers/absolute-style/major-notice-scraper.service';
import { MajorNoticeSchedulerService } from 'src/notices/schedulers/absolute-style/major-notice-scheduler.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { WholeNoticeScraperService } from 'src/notices/scrapers/absolute-style/whole-notice-scraper.service';
import { WholeNoticeSchedulerService } from 'src/notices/schedulers/absolute-style/whole-notice-scheduler.service';
import { MajorStyleNoticeScraperService } from 'src/notices/scrapers/absolute-style/major-style-notice-scraper.service';
import { MajorStyleNoticeSchedulerService } from 'src/notices/schedulers/absolute-style/major-style-notice-scheduler.service';
import { OceanographyStyleNoticeSchedulerService } from 'src/notices/schedulers/absolute-style/oceanography-style-notice-scheduler.service';
import { OceanographyStyleNoticeScraperService } from 'src/notices/scrapers/absolute-style/oceanography-style-notice-scraper.service';
import { InhadesignStyleNoticeSchedulerService } from 'src/notices/schedulers/absolute-style/inhadesign-style-notice-scheduler.service';
import { InhadesignStyleNoticeScraperService } from 'src/notices/scrapers/absolute-style/inhadesign-style-notice-scraper.service';
@Module({
    providers: [
        WholeNoticeScraperService,
        WholeNoticeSchedulerService,
        MajorNoticeScraperService,
        MajorNoticeSchedulerService,
        MajorStyleNoticeScraperService,
        MajorStyleNoticeSchedulerService,
        OceanographyStyleNoticeSchedulerService,
        OceanographyStyleNoticeScraperService,
        InhadesignStyleNoticeSchedulerService,
        InhadesignStyleNoticeScraperService,
        FirebaseService,
    ],
    exports: [
        WholeNoticeScraperService,
        WholeNoticeSchedulerService,
        MajorNoticeScraperService,
        MajorNoticeSchedulerService,
        MajorStyleNoticeScraperService,
        MajorStyleNoticeSchedulerService,
        OceanographyStyleNoticeSchedulerService,
        OceanographyStyleNoticeScraperService,
        InhadesignStyleNoticeSchedulerService,
        InhadesignStyleNoticeScraperService,
    ],
})
export class NoticeModule { }