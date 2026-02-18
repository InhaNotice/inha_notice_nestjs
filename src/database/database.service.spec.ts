/*
 * This is file of the project inha_notice
 * Licensed under the MIT License.
 * Copyright (c) 2025-2026 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2026-02-18
 */

import { DatabaseService } from 'src/database/database.service';
import * as fs from 'fs';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';

class TestService extends DatabaseService {
    constructor() {
        super();
        this.db = {
            run: jest.fn(),
            close: jest.fn(),
            get: jest.fn(),
            all: jest.fn(),
            each: jest.fn(),
            exec: jest.fn(),
            prepare: jest.fn(),
            serialize: jest.fn(),
            parallelize: jest.fn(),
            on: jest.fn(),
            configure: jest.fn()
        } as unknown as sqlite3.Database;
    }
};

describe('DatabaseService', () => {
    let service: TestService;

    beforeEach(() => {
        service = new TestService;
        jest.spyOn(TestService['logger'], 'log').mockImplementation();
        jest.spyOn(TestService['logger'], 'error').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('connection 메서드는', () => {
        it('db가 초기화 되지 않으면 에러를 발생시킨다.', () => {
            service.db = undefined as any;
            expect(() => service.connection).toThrow('Database is not initialized yet.');
        });

        it('초기화된 db를 반환한다.', () => {
            expect(service.connection).toBeDefined();
            expect(service.connection).toBe(service.db);
        });
    });

    describe('onModuleInit 메서드는', () => {
        it('data 디렉토리가 존재하지 않을 경우, fs.mkdirSync가 호출한다.', async () => {
            const existsSyncMock = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
            const mkdirSyncMock = jest.spyOn(fs, 'mkdirSync').mockImplementation();
            const connectMock = jest.spyOn<any, any>(service, 'connect').mockResolvedValue(undefined);

            await service.onModuleInit();

            expect(existsSyncMock).toHaveBeenCalledWith(expect.stringContaining('data'));
            expect(mkdirSyncMock).toHaveBeenCalledWith(expect.stringContaining('data'), { recursive: true });
            expect(connectMock).toHaveBeenCalled();
        });

        it('data 디렉토리가 이미 존재하면, fs.mkdirSync를 호출하지 않는다.', async () => {
            const existsSyncMock = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            const mkdirSyncMock = jest.spyOn(fs, 'mkdirSync').mockImplementation();
            const connectMock = jest.spyOn<any, any>(service, 'connect').mockResolvedValue(undefined);

            await service.onModuleInit();

            expect(existsSyncMock).toHaveBeenCalled();
            expect(mkdirSyncMock).not.toHaveBeenCalled();
            expect(connectMock).toHaveBeenCalled();
        });

        it('data 디렉토리가 준비되어 DB를 연결한다.', async () => {
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            const connectMock = jest.spyOn<any, any>(service, 'connect').mockResolvedValue(undefined);
            const expectedPath = path.join(process.cwd(), 'data', 'notices.db');

            await service.onModuleInit();

            expect(connectMock).toHaveBeenCalledWith(expectedPath);
        });
    });

    describe('onModuleDestory 메서드는', () => {
        it('연결된 DB가 있다면, DB를 종료시킨다.', () => {
            const closeMock = (service.db.close as jest.Mock).mockImplementation((callback) => {
                if (callback) callback(null);
                return service.db;
            });

            service.onModuleDestroy();

            expect(closeMock).toHaveBeenCalled();
            expect(TestService['logger'].log).toHaveBeenCalledWith('DB Connection closed');
        });

        it('연결된 DB를 종료하는 과정에서 에러가 발생하여 로그가 출력된다.', () => {
            const error = new Error('Close Error');
            const closeMock = (service.db.close as jest.Mock).mockImplementation((callback) => {
                if (callback) callback(error);
                return service.db;
            });

            service.onModuleDestroy();

            expect(closeMock).toHaveBeenCalled();
            expect(TestService['logger'].error).toHaveBeenCalledWith('Error closing DB', error);
        });
    });

    describe('connect 메서드는', () => {
        it('SQLite3 연결 시 에러가 발생하여 에러 로그가 출력된다.', async () => {
            const errorMessage = 'Error Message';

            const sqliteMock = jest.spyOn(sqlite3, 'Database').mockImplementation((_: any, callback: any) => {
                callback(new Error(errorMessage));
                return service.db;
            });
            const dbPath = 'dbPath';

            await expect(service['connect'](dbPath)).rejects.toThrow(errorMessage);

            expect(sqliteMock).toHaveBeenCalled();
            expect(TestService['logger'].error).toHaveBeenCalledWith(expect.stringContaining(`❌ Connection failed: ${errorMessage}`));

            expect(service.db.run).not.toHaveBeenCalledWith('PRAGMA journal_mode = WAL;');
        });

        it('SQLite3를 정상 연결하여 정상 로그가 출력된다.', async () => {

            const sqliteMock = jest.spyOn(sqlite3, 'Database').mockImplementation((_: any, callback: any) => {
                callback(null);
                return service.db;
            });

            const dbPath = 'dbPath';
            await service['connect'](dbPath);

            expect(sqliteMock).toHaveBeenCalledWith(dbPath, expect.any(Function));
            expect(TestService['logger'].log).toHaveBeenCalledWith('✅ Connected to SQLite');
            expect(service.db.run).toHaveBeenCalledWith('PRAGMA journal_mode = WAL;');
            expect(service.db.run).toHaveBeenCalledWith('PRAGMA synchronous = NORMAL;');
        });
    });

    describe('run 메서드는', () => {
        it('쿼리문을 정상적으로 실행한다.', async () => {
            const sql = 'SELECT * FROM test';
            const params = [];
            const changes = 1;
            const lastID = 100;

            const runMock = (service.db.run as jest.Mock).mockImplementation(function (this: any, sql, params, callback) {
                callback.call({ changes, lastID }, null);
                return this;
            });

            const result = await service.run(sql, params);

            expect(runMock).toHaveBeenCalledWith(sql, params, expect.any(Function));
            expect(result).toEqual({ changes, lastID });
        });

        it('쿼리문 실행 중 에러가 발생한다.', async () => {
            const sql = 'SELECT * FROM test';
            const error = new Error('Query Error');

            const runMock = (service.db.run as jest.Mock).mockImplementation((sql, params, callback) => {
                callback(error);
                return service.db;
            });

            await expect(service.run(sql)).rejects.toThrow('Query Error');
            expect(runMock).toHaveBeenCalled();
        });
    });
});