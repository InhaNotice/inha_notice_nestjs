/*
 * This is file of the project inha_notice
 * Licensed under the MIT License.
 * Copyright (c) 2025-2026 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2026-02-26
 */

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

export interface RiskWindowLog {
    noticeType: string;
    noticeId: string;
    saveEndedAt: string;
    fcmEndedAt: string;
    riskWindowMs: number;
}

@Injectable()
export class RiskWindowRepository implements OnModuleInit {
    private static readonly logger: Logger = new Logger(RiskWindowRepository.name);

    constructor(readonly databaseService: DatabaseService) { }

    async onModuleInit(): Promise<void> {
        try {
            await this.databaseService.run(`
                CREATE TABLE IF NOT EXISTS risk_window_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    notice_type TEXT NOT NULL,
                    notice_id TEXT NOT NULL,
                    save_ended_at TEXT NOT NULL,
                    fcm_ended_at TEXT NOT NULL,
                    risk_window_ms INTEGER NOT NULL,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                )
            `);
        } catch (error) {
            RiskWindowRepository.logger.error(`Failed to create risk_window_log table: ${error.message}`);
        }
    }

    async save(log: RiskWindowLog): Promise<void> {
        try {
            await this.databaseService.run(
                `INSERT INTO risk_window_log (notice_type, notice_id, save_ended_at, fcm_ended_at, risk_window_ms)
                 VALUES (?, ?, ?, ?, ?)`,
                [log.noticeType, log.noticeId, log.saveEndedAt, log.fcmEndedAt, log.riskWindowMs],
            );
        } catch (error) {
            RiskWindowRepository.logger.error(`Failed to save risk window log: ${error.message}`);
        }
    }
}