/*
 * This is file of the project inha_notice
 * Licensed under the MIT License.
 * Copyright (c) 2025-2026 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2026-02-26
 */

import { RiskWindowRepository, RiskWindowLog } from 'src/database/risk-window.repository';

class TestRiskWindowRepository extends RiskWindowRepository {
    constructor() {
        const mockDb = {
            serialize: jest.fn((cb) => cb()),
            run: jest.fn(),
        } as any;

        const mockDatabaseService = {
            connection: mockDb,
            run: jest.fn(),
        } as any;

        super(mockDatabaseService);
    }
}

describe('RiskWindowRepository', () => {
    let repository: TestRiskWindowRepository;

    beforeEach(() => {
        repository = new TestRiskWindowRepository();
        jest.spyOn(RiskWindowRepository['logger'], 'log').mockImplementation();
        jest.spyOn(RiskWindowRepository['logger'], 'error').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('onModuleInit 메서드는', () => {
        it('테이블 초기화를 한다.', async () => {
            const runSpy = (repository.databaseService.run as jest.Mock).mockResolvedValue(undefined);

            await repository.onModuleInit();

            expect(runSpy).toHaveBeenCalledWith(
                expect.stringContaining('CREATE TABLE IF NOT EXISTS risk_window_log'),
            );
        });

        it('테이블 초기화 중 에러를 발생한다.', async () => {
            const error = new Error('Table Creation Error');
            (repository.databaseService.run as jest.Mock).mockRejectedValueOnce(error);

            await repository.onModuleInit();

            expect(RiskWindowRepository['logger'].error).toHaveBeenCalledWith(
                `Failed to create risk_window_log table: ${error.message}`,
            );
        });
    });

    describe('save 메서드는', () => {
        it('위험구간 로그를 삽입한다.', async () => {
            const log: RiskWindowLog = {
                noticeType: 'TEST',
                noticeId: 'KR-1',
                saveEndedAt: '2026-02-26T10:00:00.000Z',
                fcmEndedAt: '2026-02-26T10:00:03.200Z',
                riskWindowMs: 3200,
            };
            (repository.databaseService.run as jest.Mock).mockResolvedValue({ changes: 1, lastID: 1 });

            await repository.save(log);

            expect(repository.databaseService.run).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO risk_window_log'),
                [log.noticeType, log.noticeId, log.saveEndedAt, log.fcmEndedAt, log.riskWindowMs],
            );
        });

        it('위험구간 로그 삽입 중 에러를 발생한다.', async () => {
            const log: RiskWindowLog = {
                noticeType: 'TEST',
                noticeId: 'KR-1',
                saveEndedAt: '2026-02-26T10:00:00.000Z',
                fcmEndedAt: '2026-02-26T10:00:03.200Z',
                riskWindowMs: 3200,
            };
            const error = new Error('Insert Error');
            (repository.databaseService.run as jest.Mock).mockRejectedValue(error);

            await repository.save(log);

            expect(RiskWindowRepository['logger'].error).toHaveBeenCalledWith(
                `Failed to save risk window log: ${error.message}`,
            );
        });
    });
});