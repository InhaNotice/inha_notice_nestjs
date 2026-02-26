/*
 * This is file of the project inha_notice
 * Licensed under the MIT License.
 * Copyright (c) 2025-2026 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2026-02-26
 */

import { Module } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { NoticeRepository } from 'src/database/notice.repository';
import { RiskWindowRepository } from 'src/database/risk-window.repository';

@Module({
    providers: [DatabaseService, NoticeRepository, RiskWindowRepository],
    exports: [NoticeRepository, RiskWindowRepository],
})
export class DatabaseModule { }