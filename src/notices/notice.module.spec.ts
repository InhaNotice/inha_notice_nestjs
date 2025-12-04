/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-12-04
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { NoticeModule } from './notice.module';
import { LibraryStyleScheduler } from './schedulers/relative-style/library-style.scheduler';
import { LibraryStyleScraper } from './scrapers/relative-style/library-style.scraper';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { WholeScheduler } from './schedulers/absolute-style/whole.scheduler';
import { WholeScraper } from './scrapers/absolute-style/whole.scraper';
import { MajorScraper } from './scrapers/absolute-style/major.scraper';
import { MajorNoticeScheduler as MajorScheduler } from './schedulers/absolute-style/major.scheduler';
import { MajorStyleScraper } from './scrapers/absolute-style/major-style.scraper';
import { MajorStyleScheduler } from './schedulers/absolute-style/major-style.scheduler';
import { InhaDesignStyleScheduler } from './schedulers/absolute-style/inha-design-style.scheduler';
import { InhaDesignStyleScraper } from './scrapers/absolute-style/inha-design-style.scraper';

describe('NoticeModule은', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ isGlobal: true }),
                FirebaseModule,
                NoticeModule,
            ],
        }).compile();
    });

    it('정상적으로 다음 서비스들을 providers로 등록되어 있어야 한다.', () => {
        const wholeScheduler = module.get<WholeScheduler>(WholeScheduler);
        const wholeScraper = module.get<WholeScraper>(WholeScraper);
        const majorScraper = module.get<MajorScraper>(MajorScraper);
        const majorScheduler = module.get<MajorScheduler>(MajorScheduler);
        const majorStyleScraper = module.get<MajorStyleScraper>(MajorStyleScraper);
        const majorStyleScheduler = module.get<MajorStyleScheduler>(MajorStyleScheduler);
        const inhadesignStyleScheduler = module.get<InhaDesignStyleScheduler>(InhaDesignStyleScheduler);
        const inhadesignStyleScraper = module.get<InhaDesignStyleScraper>(InhaDesignStyleScraper);
        const libraryStyleScheduler = module.get<LibraryStyleScheduler>(LibraryStyleScheduler);
        const libraryStyleScraper = module.get<LibraryStyleScraper>(LibraryStyleScraper);

        expect(wholeScheduler).toBeDefined();
        expect(wholeScraper).toBeDefined();
        expect(majorScraper).toBeDefined();
        expect(majorScheduler).toBeDefined();
        expect(majorStyleScraper).toBeDefined();
        expect(majorStyleScheduler).toBeDefined();
        expect(inhadesignStyleScheduler).toBeDefined();
        expect(inhadesignStyleScraper).toBeDefined();
        expect(libraryStyleScheduler).toBeDefined();
        expect(libraryStyleScraper).toBeDefined();
    });
});