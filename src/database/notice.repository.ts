/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2026-01-30
 */

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { NotificationPayload } from 'src/interfaces/notification-payload.interface';
import { Database } from 'sqlite3';

@Injectable()
export class NoticeRepository implements OnModuleInit {
    private static readonly logger: Logger = new Logger(NoticeRepository.name);
    db: Database;

    constructor(readonly databaseService: DatabaseService) { }

    async onModuleInit(): Promise<void> {
        this.db = this.databaseService.connection;

        this.db.serialize(() => {
            this.db.run(`
                CREATE TABLE IF NOT EXISTS notices (
                    id TEXT PRIMARY KEY,
                    type TEXT NOT NULL,
                    title TEXT,
                    link TEXT,
                    date TEXT
                )
            `, (err) => {
                if (err) NoticeRepository.logger.error(`Failed to create table: ${err.message}`);
            });

            this.db.run(`CREATE INDEX IF NOT EXISTS idx_type ON notices (type)`,
                (err) => {
                    if (err) NoticeRepository.logger.error(`Failed to create index: ${err.message}`);
                });
        });
    }

    async save(type: string, notice: NotificationPayload): Promise<boolean> {
        try {
            const result: {
                changes: number;
                lastID: number;
            } = await this.databaseService.run(
                `INSERT OR IGNORE INTO notices (id, type, title, link, date) VALUES (?, ?, ?, ?, ?)`,
                [notice.id, type, notice.title, notice.link, notice.date]
            );
            return result.changes > 0;
        } catch (error) {
            NoticeRepository.logger.error(`Save error: ${error.message}`);
            return false;
        }
    }

    async deleteNoticesExcludingDate(keepDate: string): Promise<number> {
        try {
            const result: {
                changes: number;
                lastID: number;
            } = await this.databaseService.run(
                `DELETE FROM notices WHERE date != ?`,
                [keepDate]
            );
            return result.changes;
        } catch (error) {
            NoticeRepository.logger.error(`Delete error: ${error.message}`);
            return 0;
        }
    }
}