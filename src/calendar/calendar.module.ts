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
import { UndergraduateService } from 'src/calendar/schedulers/undergraduate.service';

@Module({
    providers: [
        UndergraduateService,
    ],
    exports: [
        UndergraduateService,
    ],
})
export class CalendarModule { }