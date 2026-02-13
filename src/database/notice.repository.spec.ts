/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025-2026 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2026-02-13
 */

import { NoticeRepository } from 'src/database/notice.repository';
import { NotificationPayload } from 'src/interfaces/notification-payload.interface';

class TestNoticeRepository extends NoticeRepository {
    constructor() {
        const mockDb = {
            serialize: jest.fn((cb) => cb()),
            run: jest.fn(),
        } as any;

        const mockDatabaseService = {
            connection: mockDb,
            run: jest.fn()
        } as any;


        super(mockDatabaseService);

        this.db = mockDb;
    }
}

describe('NoticeRepository', () => {
    let repository: TestNoticeRepository;
    beforeEach(() => {
        repository = new TestNoticeRepository();
        jest.spyOn(NoticeRepository['logger'], 'log').mockImplementation();
        jest.spyOn(NoticeRepository['logger'], 'error').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('onModuleInit 메서드는', () => {
        it('테이블 초기화를 한다.', async () => {
            const runSpy = (repository.databaseService.run as jest.Mock).mockResolvedValue(undefined);

            await repository.onModuleInit();

            expect(runSpy).toHaveBeenCalledWith(
                expect.stringContaining('CREATE TABLE IF NOT EXISTS notices'),
            );
        });

        it('테이블 초기화 중 에러를 발생한다.', async () => {
            const error = new Error('Table Creation Error');
            (repository.databaseService.run as jest.Mock).mockRejectedValueOnce(error);

            await repository.onModuleInit();

            expect(NoticeRepository['logger'].error).toHaveBeenCalledWith(
                `Failed to create table: ${error.message}`
            );
        });

        it('인덱스를 초기화한다.', async () => {
            const runSpy = (repository.databaseService.run as jest.Mock).mockResolvedValue(undefined);

            await repository.onModuleInit();

            expect(runSpy).toHaveBeenCalledWith(
                expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_type'),
            );
        });

        it('인덱스 초기화 중 에러를 발생한다.', async () => {
            const error = new Error('Index Creation Error');
            (repository.databaseService.run as jest.Mock)
                .mockResolvedValueOnce(undefined)    // CREATE TABLE 성공
                .mockRejectedValueOnce(error);       // CREATE INDEX 실패

            await repository.onModuleInit();

            expect(NoticeRepository['logger'].error).toHaveBeenCalledWith(
                `Failed to create index: ${error.message}`
            );
        });
    });

    describe('save 메서드는', () => {
        it('삽입 쿼리문을 실행한다.', async () => {
            const type = 'test_type';
            const notice: NotificationPayload = {
                id: '1',
                title: 'Test Title',
                link: 'http://test.com',
                date: '2026-01-30',
            };
            (repository.databaseService.run as jest.Mock).mockResolvedValue({ changes: 1, lastID: 1 });

            const result = await repository.save(type, notice);

            expect(repository.databaseService.run).toHaveBeenCalledWith(
                expect.stringContaining('INSERT OR IGNORE INTO notices'),
                [notice.id, type, notice.title, notice.link, notice.date]
            );
            expect(result).toBe(true);
        });

        it('삽입 쿼리문 실행 중 에러를 발생한다.', async () => {
            const type = 'test_type';
            const notice: NotificationPayload = {
                id: '1',
                title: 'Test Title',
                link: 'http://test.com',
                date: '2026-01-30',
            };
            const error = new Error('Insert Error');
            (repository.databaseService.run as jest.Mock).mockRejectedValue(error);

            const result = await repository.save(type, notice);

            expect(NoticeRepository['logger'].error).toHaveBeenCalledWith(`Save error: ${error.message}`);
            expect(result).toBe(false);
        });
    });

    describe('deleteNoticeExcludingDate 메서드는', () => {
        it('삭제 쿼리문을 실행한다.', async () => {
            const keepDate = '2026-01-30';
            const expectedChanges = 5;
            (repository.databaseService.run as jest.Mock).mockResolvedValue({ changes: expectedChanges, lastID: 0 });

            const result = await repository.deleteNoticesExcludingDate(keepDate);

            expect(repository.databaseService.run).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM notices WHERE date != ?'),
                [keepDate]
            );
            expect(result).toBe(expectedChanges);
        });

        it('삭제 쿼리문 실행 중 에러를 발생한다.', async () => {
            const keepDate = '2026-01-30';
            const error = new Error('Delete Error');

            (repository.databaseService.run as jest.Mock).mockRejectedValue(error);

            const result = await repository.deleteNoticesExcludingDate(keepDate);

            expect(NoticeRepository['logger'].error).toHaveBeenCalledWith(`Delete error: ${error.message}`);
            expect(result).toBe(0);
        });
    });

});