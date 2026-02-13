/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2026-01-30
 */

import { Module } from '@nestjs/common';
import { MajorScraper as MajorScraper } from 'src/notices/scrapers/absolute-style/major.scraper';
import { MajorNoticeScheduler as MajorScheduler } from 'src/notices/schedulers/absolute-style/major.scheduler';
import { WholeScraper as WholeScraper } from 'src/notices/scrapers/absolute-style/whole.scraper';
import { WholeScheduler as WholeScheduler } from 'src/notices/schedulers/absolute-style/whole.scheduler';
import { MajorStyleScraper as MajorStyleScraper } from 'src/notices/scrapers/absolute-style/major-style.scraper';
import { MajorStyleScheduler as MajorStyleScheduler } from 'src/notices/schedulers/absolute-style/major-style.scheduler';
import { InhaDesignStyleScheduler as InhadesignStyleScheduler } from 'src/notices/schedulers/absolute-style/inha-design-style.scheduler';
import { InhaDesignStyleScraper as InhaDesignStyleScraper } from 'src/notices/scrapers/absolute-style/inha-design-style.scraper';
import { LibraryStyleScheduler } from 'src/notices/schedulers/relative-style/library-style.scheduler';
import { LibraryStyleScraper } from 'src/notices/scrapers/relative-style/library-style.scraper';
import { DatabaseModule } from 'src/database/database.module';

@Module({
    imports: [
        DatabaseModule
    ],
    providers: [
        WholeScraper,
        WholeScheduler,
        MajorScraper,
        MajorScheduler,
        MajorStyleScraper,
        MajorStyleScheduler,
        InhadesignStyleScheduler,
        InhaDesignStyleScraper,
        LibraryStyleScheduler,
        LibraryStyleScraper,
    ],
    exports: [
        WholeScraper,
        WholeScheduler,
        MajorScraper,
        MajorScheduler,
        MajorStyleScraper,
        MajorStyleScheduler,
        InhadesignStyleScheduler,
        InhaDesignStyleScraper,
        LibraryStyleScheduler,
        LibraryStyleScraper,
    ],
})
export class NoticeModule { }