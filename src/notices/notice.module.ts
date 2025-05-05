/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-06
 */

import { Module } from '@nestjs/common';
import { MajorNoticeScraperService as MajorScraper } from 'src/notices/scrapers/absolute-style/major.scraper';
import { MajorNoticeSchedulerService as MajorScheduler } from 'src/notices/schedulers/absolute-style/major.scheduler';
import { FirebaseService } from 'src/firebase/firebase.service';
import { WholeNoticeScraperService as WholeScraper } from 'src/notices/scrapers/absolute-style/whole.scraper';
import { WholeNoticeSchedulerService as WholeScheduler } from 'src/notices/schedulers/absolute-style/whole.scheduler';
import { MajorStyleNoticeScraperService as MajorStyleScraper } from 'src/notices/scrapers/absolute-style/major-style.scraper';
import { MajorStyleNoticeSchedulerService as MajorStyleScheduler } from 'src/notices/schedulers/absolute-style/major-style.scheduler';
import { OceanographyStyleNoticeSchedulerService as OceanographyStyleScheduler } from 'src/notices/schedulers/absolute-style/oceanography-style.scheduler';
import { OceanographyStyleNoticeScraperService as OceanographyStyleScraper } from 'src/notices/scrapers/absolute-style/oceanography-style.scraper';
import { InhadesignStyleNoticeSchedulerService as InhadesignStyleScheduler } from 'src/notices/schedulers/absolute-style/inhadesign-style.scheduler';
import { InhadesignStyleNoticeScraperService as InhadesignStyleScraper } from 'src/notices/scrapers/absolute-style/inhadesign-style.scraper';
@Module({
    providers: [
        WholeScraper,
        WholeScheduler,
        MajorScraper,
        MajorScheduler,
        MajorStyleScraper,
        MajorStyleScheduler,
        OceanographyStyleScheduler,
        OceanographyStyleScraper,
        InhadesignStyleScheduler,
        InhadesignStyleScraper,
        FirebaseService,
    ],
    exports: [
        WholeScraper,
        WholeScheduler,
        MajorScraper,
        MajorScheduler,
        MajorStyleScraper,
        MajorStyleScheduler,
        OceanographyStyleScheduler,
        OceanographyStyleScraper,
        InhadesignStyleScheduler,
        InhadesignStyleScraper,
    ],
})
export class NoticeModule { }