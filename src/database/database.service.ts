/*
 * This is file of the project inha_notice
 * Licensed under the MIT License.
 * Copyright (c) 2025-2026 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2026-02-26
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { GlobalDBMonitor } from 'src/common/utils/db-monitor';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private static readonly logger: Logger = new Logger(DatabaseService.name);
    private readonly localDatabase: string = 'inha_notice_nestjs.db';

    db: sqlite3.Database;

    get connection(): sqlite3.Database {
        if (!this.db) {
            throw new Error('Database is not initialized yet.');
        }
        return this.db;
    }

    async onModuleInit(): Promise<void> {
        GlobalDBMonitor.registerScheduler(1);

        // 1. data 폴더 준비
        const dbRoot: string = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dbRoot)) {
            fs.mkdirSync(dbRoot, { recursive: true });
        }
        const dbPath: string = path.join(dbRoot, this.localDatabase);

        // 2. DB 연결
        await this.connect(dbPath);
    }

    onModuleDestroy(): void {
        if (this.db) {
            this.db.close((err) => {
                if (err) DatabaseService.logger.error('Error closing DB', err);
                else DatabaseService.logger.log('DB Connection closed');
            });
        }
    }

    private connect(dbPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    DatabaseService.logger.error(`❌ Connection failed: ${err.message}`);
                    reject(err);
                } else {
                    DatabaseService.logger.log('✅ Connected to SQLite');
                    // WAL 모드는 전역 설정이므로 여기서 수행
                    this.db.run('PRAGMA journal_mode = WAL;');
                    this.db.run('PRAGMA synchronous = NORMAL;');

                    GlobalDBMonitor.reportSuccess();

                    resolve();
                }
            });
        });
    }

    /**
     * 헬퍼 메서드: 쿼리 실행 (각 Repository에서 사용)
     */
    async run(sql: string, params: any[] = []): Promise<{ changes: number, lastID: number }> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ changes: this.changes, lastID: this.lastID });
            });
        });
    }
}