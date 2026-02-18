/*
 * This is file of the project inha_notice
 * Licensed under the MIT License.
 * Copyright (c) 2025-2026 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-16
 */

import { Module } from '@nestjs/common';
import { UndergraduateScheduler } from 'src/calendar/schedulers/undergraduate.scheduler';
import { FirebaseModule } from 'src/firebase/firebase.module';

@Module({
    imports: [
        FirebaseModule,
    ],
    providers: [
        UndergraduateScheduler,
    ],
    exports: [
        UndergraduateScheduler,
    ],
})
export class CalendarModule { }