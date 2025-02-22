/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-02-22
 */

import { Test, TestingModule } from '@nestjs/testing';
import { WholeNoticeSchedulerService } from 'src/notices/scheduler/whole-notice-scheduler.service';
import { WholeNoticeScraperService } from 'src/notices/scraper/whole-notice-scraper.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import * as fs from 'fs';
import * as sqlite3 from 'sqlite3';
import * as dayjs from 'dayjs';

describe('WholeNoticeSchedulerService', () => {
    let service: WholeNoticeSchedulerService;
    let mockWholeNoticeScraperService: Partial<WholeNoticeScraperService>;
    let mockFirebaseService: Partial<FirebaseService>;
    let loggerLogMock: jest.SpyInstance;
    let loggerErrorMock: jest.SpyInstance;
    let loggerWarnMock: jest.SpyInstance;
    let loggerDebugMock: jest.SpyInstance;
    let sendWholeNotificationMock: jest.SpyInstance;

    const mockTodayDate = '2025.02.22';
    const mockNotices = [
        { id: 'W-1', title: 'Title 1', link: 'https://example.com/1', date: mockTodayDate, writer: 'Writer1', access: 'Access1' },
        { id: 'W-2', title: 'Title 2', link: 'https://example.com/2', date: '2025.02.21', writer: 'Writer2', access: 'Access2' },
    ];

    // fakeDB 객체 생성 (sqlite3.Database 모킹)
    let fakeDB: any;

    beforeEach(async () => {
        setupMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WholeNoticeSchedulerService,
                { provide: WholeNoticeScraperService, useValue: mockWholeNoticeScraperService },
                { provide: FirebaseService, useValue: mockFirebaseService },
            ],
        }).compile();

        service = module.get<WholeNoticeSchedulerService>(WholeNoticeSchedulerService);

        // fakeDB 설정: run, get, all 메서드 모킹
        fakeDB = {
            run: jest.fn(),
            get: jest.fn(),
            all: jest.fn(),
        };
        service['db'] = fakeDB;
        service['cachedNoticeIds'] = new Set();

        // logger 스파이 생성
        loggerLogMock = jest.spyOn(service['logger'], 'log').mockImplementation();
        loggerErrorMock = jest.spyOn(service['logger'], 'error').mockImplementation();
        loggerWarnMock = jest.spyOn(service['logger'], 'warn').mockImplementation();
        loggerDebugMock = jest.spyOn(service['logger'], 'debug').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    function setupMocks() {
        mockWholeNoticeScraperService = {
            fetchNotices: jest.fn().mockResolvedValue(mockNotices),
        };

        mockFirebaseService = {
            sendWholeNotification: jest.fn(),
        };

        sendWholeNotificationMock = jest
            .spyOn(mockFirebaseService, 'sendWholeNotification')
            .mockResolvedValue(undefined);
    }

    // ====================================================
    // 1. 초기화 관련 메서드 테스트
    // ====================================================
    describe('initializeDatabaseDir', () => {
        it('디렉터리가 존재하지 않으면 fs.mkdirSync 호출되어야 함', () => {
            const existsSyncMock = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
            const mkdirSyncMock = jest.spyOn(fs, 'mkdirSync').mockImplementation();

            service['initializeDatabaseDir']();

            expect(existsSyncMock).toHaveBeenCalledWith(service['databaseDir']);
            expect(mkdirSyncMock).toHaveBeenCalledWith(service['databaseDir'], { recursive: true });
        });

        it('디렉터리가 이미 존재하면 fs.mkdirSync가 호출되지 않아야 함', () => {
            const existsSyncMock = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            const mkdirSyncMock = jest.spyOn(fs, 'mkdirSync').mockImplementation();

            service['initializeDatabaseDir']();

            expect(existsSyncMock).toHaveBeenCalledWith(service['databaseDir']);
            expect(mkdirSyncMock).not.toHaveBeenCalled();
        });

        it('fs.mkdirSync 호출 시 에러 발생하면 에러 로그가 기록되어야 함', () => {
            const existsSyncMock = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
            const mkdirSyncMock = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => { throw new Error('mkdir error'); });

            service['initializeDatabaseDir']();

            expect(existsSyncMock).toHaveBeenCalledWith(service['databaseDir']);
            expect(mkdirSyncMock).toHaveBeenCalled();
            expect(loggerErrorMock).toHaveBeenCalledWith(expect.stringContaining('❌ 데이터베이스 디렉터리 생성 실패: mkdir error'));
        });
    });

    describe('initializeDatabase', () => {
        it('데이터베이스 연결 성공 시 initializeDatabaseTable 호출', () => {
            const sqliteMock = jest.spyOn(sqlite3, 'Database').mockImplementation((dbPath: any, callback: any) => {
                callback(null);
                return fakeDB;
            });
            const initTableSpy = jest.spyOn(service as any, 'initializeDatabaseTable').mockImplementation(() => { });

            service['initializeDatabase']();

            expect(sqliteMock).toHaveBeenCalledWith(service['dbPath'], expect.any(Function));
            expect(initTableSpy).toHaveBeenCalled();
        });

        it('데이터베이스 연결 실패 시 에러 로그 기록', () => {
            const sqliteMock = jest.spyOn(sqlite3, 'Database').mockImplementation((dbPath: any, callback: any) => {
                callback(new Error('DB connection error'));
                return fakeDB;
            });

            service['initializeDatabase']();

            expect(sqliteMock).toHaveBeenCalledWith(service['dbPath'], expect.any(Function));
            expect(loggerErrorMock).toHaveBeenCalledWith('❌ SQLite 데이터베이스 연결 실패:', 'DB connection error');
        });
    });

    describe('initializeDatabaseTable', () => {
        let loadCacheMock: jest.SpyInstance;

        beforeEach(() => {
            loadCacheMock = jest.spyOn(service as any, 'loadCache').mockImplementation(() => { });
        });

        it('테이블 생성 성공 시 loadCache 호출', () => {
            fakeDB.run.mockImplementation((query: string, callback: any) => {
                callback(null);
            });

            service['initializeDatabaseTable']();

            expect(fakeDB.run).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS notices'), expect.any(Function));
            expect(loadCacheMock).toHaveBeenCalled();
        });

        it('테이블 생성 실패 시 에러 로그 기록 및 loadCache 미호출', () => {
            fakeDB.run.mockImplementation((query: string, callback: any) => {
                callback(new Error('Table creation error'));
            });

            service['initializeDatabaseTable']();

            expect(fakeDB.run).toHaveBeenCalled();
            expect(loadCacheMock).not.toHaveBeenCalled();
            expect(loggerErrorMock).toHaveBeenCalledWith(expect.stringContaining('🚨 학사(WHOLE) 테이블 생성 실패:'), expect.stringContaining('Table creation error'));
        });
    });

    describe('loadCache', () => {
        let getMock: jest.SpyInstance;
        let allMock: jest.SpyInstance;

        beforeEach(() => {
            getMock = fakeDB.get as jest.Mock;
            allMock = fakeDB.all as jest.Mock;
        });

        it('db.get 에러 발생 시 에러 로그 기록', () => {
            getMock.mockImplementation((query: string, callback: any) => {
                callback(new Error('get error'), null);
            });

            service['loadCache']();

            expect(getMock).toHaveBeenCalledWith("SELECT name FROM sqlite_master WHERE type='table' AND name='notices'", expect.any(Function));
            expect(loggerErrorMock).toHaveBeenCalledWith(expect.stringContaining('❌ 학사 SQLite 테이블 확인 중 오류 발생: get error'));
            expect(allMock).not.toHaveBeenCalled();
        });

        it('테이블 미존재 시 경고 로그 기록', () => {
            getMock.mockImplementation((query: string, callback: any) => {
                callback(null, null);
            });

            service['loadCache']();

            expect(getMock).toHaveBeenCalledWith("SELECT name FROM sqlite_master WHERE type='table' AND name='notices'", expect.any(Function));
            expect(loggerWarnMock).toHaveBeenCalledWith(expect.stringContaining('⛔️ 학사 notices 테이블이 존재하지 않아 캐시를 로드하지 않습니다.'));
            expect(allMock).not.toHaveBeenCalled();
        });

        it('db.all 에러 발생 시 에러 로그 기록', () => {
            getMock.mockImplementation((query: string, callback: any) => {
                callback(null, {});
            });
            allMock.mockImplementation((query: string, params: any[], callback: any) => {
                callback(new Error('all error'), null);
            });

            service['loadCache']();

            expect(getMock).toHaveBeenCalled();
            expect(allMock).toHaveBeenCalledWith("SELECT id FROM notices", [], expect.any(Function));
            expect(loggerErrorMock).toHaveBeenCalledWith(expect.stringContaining('❌ 학사 SQLite 캐시 로드 중 오류 발생: all error'));
        });

        it('캐시 로드 성공 시 공지 ID가 cachedNoticeIds에 저장되어야 함', () => {
            getMock.mockImplementation((query: string, callback: any) => {
                callback(null, {});
            });
            const rows = [{ id: 'W-1' }, { id: 'W-2' }];
            allMock.mockImplementation((query: string, params: any[], callback: any) => {
                callback(null, rows);
            });

            service['loadCache']();

            expect(getMock).toHaveBeenCalled();
            expect(allMock).toHaveBeenCalledWith("SELECT id FROM notices", [], expect.any(Function));
            expect(service['cachedNoticeIds'].has('W-1')).toBe(true);
            expect(service['cachedNoticeIds'].has('W-2')).toBe(true);
            expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining(`✅ 학사 캐싱된 공지사항 ID 로드 완료 (2개)`));
        });
    });

    // ====================================================
    // 2. 스케줄링 메서드 (Cron) 테스트
    // ====================================================
    describe('스케줄링 메서드', () => {
        let executeCrawlingSpy;
        let deleteOldNoticesSpy;

        beforeEach(() => {
            executeCrawlingSpy = jest.spyOn(service as any, 'executeCrawling').mockResolvedValue(undefined);
            deleteOldNoticesSpy = jest.spyOn(service as any, 'deleteOldNotices').mockResolvedValue(undefined);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('handleWeekDaysCron은 "학사 정기(9~17시)" 로그 접두사로 executeCrawling 호출', async () => {
            const cronSpy = jest.spyOn(service, 'handleWeekDaysCron').mockImplementation(async () => {
                await executeCrawlingSpy('학사 정기(9~17시)');
            });

            await service.handleWeekDaysCron();

            expect(cronSpy).toHaveBeenCalled();
            expect(executeCrawlingSpy).toHaveBeenCalledWith('학사 정기(9~17시)');
        });

        it('handleEveningCron은 "학사 저녁(17~22시)" 로그 접두사로 executeCrawling 호출', async () => {
            const cronSpy = jest.spyOn(service, 'handleEveningCron').mockImplementation(async () => {
                await executeCrawlingSpy('학사 저녁(17~22시)');
            });

            await service.handleEveningCron();

            expect(cronSpy).toHaveBeenCalled();
            expect(executeCrawlingSpy).toHaveBeenCalledWith('학사 저녁(17~22시)');
        });

        it('handleWeekendCron은 "학사 주말(9~22시)" 로그 접두사로 executeCrawling 호출', async () => {
            const cronSpy = jest.spyOn(service, 'handleWeekendCron').mockImplementation(async () => {
                await executeCrawlingSpy('학사 주말(9~22시)');
            });

            await service.handleWeekendCron();

            expect(cronSpy).toHaveBeenCalled();
            expect(executeCrawlingSpy).toHaveBeenCalledWith('학사 주말(9~22시)');
        });

        it('handleDeleteCron은 "학사 (23시)" 로그 접두사로 deleteOldNotices 호출', async () => {
            const cronSpy = jest.spyOn(service, 'handleDeleteCron').mockImplementation(async () => {
                await deleteOldNoticesSpy('학사 (23시)');
            });

            await service.handleDeleteCron();

            expect(cronSpy).toHaveBeenCalled();
            expect(deleteOldNoticesSpy).toHaveBeenCalledWith('학사 (23시)');
        });
    });

    // ====================================================
    // 3. 주요 비즈니스 로직 (크롤링, 오래된 공지 삭제) 테스트
    // ====================================================
    describe('executeCrawling', () => {
        let filterNewNoticesSpy: jest.SpyInstance;
        let saveNoticeSpy: jest.SpyInstance;

        beforeEach(() => {
            filterNewNoticesSpy = jest.spyOn(service as any, 'filterNewNotices').mockResolvedValue([mockNotices[0]]);
            saveNoticeSpy = jest.spyOn(service as any, 'saveNotice').mockResolvedValue(undefined);
        });

        afterEach(() => {
            jest.resetAllMocks();
        });

        it('배포 환경에서 새로운 공지 발견 시 FCM 알림 전송, 저장, 캐시 업데이트', async () => {
            const mockLogPrefix = '학사 정기(9~17시)';
            process.env.NODE_ENV = 'production';

            await service['executeCrawling'](mockLogPrefix);

            expect(mockWholeNoticeScraperService.fetchNotices).toHaveBeenCalledWith(1);
            expect(filterNewNoticesSpy).toHaveBeenCalledWith(mockNotices);
            expect(sendWholeNotificationMock).toHaveBeenCalledWith('Title 1', {
                id: 'W-1',
                link: 'https://example.com/1',
            });
            expect(saveNoticeSpy).toHaveBeenCalled();
            expect(service['cachedNoticeIds'].has('W-1')).toBe(true);
            expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining(`📌 ${mockLogPrefix} 크롤링 실행 중...`));
            expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining(`🚀 ${mockLogPrefix} 새로운 공지 발견: Title 1`));
            expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining(`🏁 ${mockLogPrefix} 크롤링 끝!`));
        });

        it('개발 환경에서 새로운 공지 발견 시 FCM 알림 미전송, 저장, 캐시 업데이트, 디버그 로그 기록', async () => {
            process.env.NODE_ENV = 'development';

            await service['executeCrawling']('학사 정기(9~17시)');

            expect(mockWholeNoticeScraperService.fetchNotices).toHaveBeenCalledWith(1);
            expect(filterNewNoticesSpy).toHaveBeenCalledWith(mockNotices);
            expect(sendWholeNotificationMock).not.toHaveBeenCalled();
            expect(saveNoticeSpy).toHaveBeenCalled();
            expect(service['cachedNoticeIds'].has('W-1')).toBe(true);
            expect(loggerDebugMock).toHaveBeenCalledWith(expect.stringContaining(`🔕 학사 정기(9~17시) 개발 환경이므로 푸시 알림을 전송하지 않습니다.`));
            expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining(`🏁 학사 정기(9~17시) 크롤링 끝!`));
        });

        it('신규 공지가 없으면 아무 작업도 수행하지 않아야 함', async () => {
            filterNewNoticesSpy.mockResolvedValue([]);

            await service['executeCrawling']('학사 정기(9~17시)');

            expect(mockWholeNoticeScraperService.fetchNotices).toHaveBeenCalledWith(1);
            expect(filterNewNoticesSpy).toHaveBeenCalledWith(mockNotices);
            expect(sendWholeNotificationMock).not.toHaveBeenCalled();
            expect(saveNoticeSpy).not.toHaveBeenCalled();
            expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining(`🏁 학사 정기(9~17시) 크롤링 끝!`));
        });

        it('크롤링 중 오류 발생 시 에러 로그 기록', async () => {
            const error = new Error('크롤링 오류');
            (mockWholeNoticeScraperService.fetchNotices as jest.Mock).mockRejectedValue(error);

            await service['executeCrawling']('학사 정기(9~17시)');

            expect(loggerErrorMock).toHaveBeenCalledWith(expect.stringContaining(`❌ 학사 정기(9~17시) 크롤링 중 오류 발생: ${error.message}`));
        });
    });

    describe('deleteOldNotices', () => {
        let deleteNoticesExceptTodaySpy: jest.SpyInstance;
        const todayDate = mockTodayDate;

        beforeEach(() => {
            jest.spyOn(service as any, 'getTodayDate').mockReturnValue(todayDate);
            deleteNoticesExceptTodaySpy = jest.spyOn(service as any, 'deleteNoticesExceptToday').mockResolvedValue(undefined);
        });

        it('deleteOldNotices는 deleteNoticesExceptToday 호출 후 성공 로그 기록', async () => {
            await service['deleteOldNotices']('학사 (23시)');

            expect(deleteNoticesExceptTodaySpy).toHaveBeenCalledWith(todayDate);
            expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining(`✅ 학사 (23시) 오래된 공지사항 삭제 완료`));
        });

        it('deleteOldNotices에서 오류 발생 시 에러 로그 기록', async () => {
            deleteNoticesExceptTodaySpy.mockRejectedValue(new Error('삭제 오류'));

            await service['deleteOldNotices']('학사 (23시)');

            expect(loggerErrorMock).toHaveBeenCalledWith(expect.stringContaining(`❌ 학사 (23시) 오래된 공지사항 삭제 중 오류 발생: 삭제 오류`));
        });
    });

    // ====================================================
    // 4. DB 조작 및 삭제 관련 메서드 테스트
    // ====================================================
    describe('deleteNoticesExceptToday', () => {
        it('삭제 쿼리 성공 시 loadCache 호출 및 성공 로그 기록', async () => {
            fakeDB.run.mockImplementation((query: string, params: any[], callback: any) => {
                callback(null);
                return {} as any;
            });
            const loadCacheSpy = jest.spyOn(service as any, 'loadCache').mockImplementation(() => { });

            await expect(service['deleteNoticesExceptToday'](mockTodayDate)).resolves.toBeUndefined();

            expect(fakeDB.run).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM notices WHERE date != ?'),
                [mockTodayDate],
                expect.any(Function)
            );
            expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining('🗑️ 학사 오늘이 아닌 공지사항 삭제 완료'));
            expect(loadCacheSpy).toHaveBeenCalled();
        });

        it('삭제 쿼리 실패 시 에러 로그 기록 및 Promise reject', async () => {
            fakeDB.run.mockImplementation((query: string, params: any[], callback: any) => {
                callback(new Error('삭제 실패'));
            });

            await expect(service['deleteNoticesExceptToday'](mockTodayDate)).rejects.toThrow('삭제 실패');
            expect(loggerErrorMock).toHaveBeenCalledWith(expect.stringContaining('🚨 학사 오래된 공지사항 삭제 실패: 삭제 실패'));
        });
    });

    describe('filterNewNotices', () => {
        it('오늘 날짜의 공지 중 캐시에 없는 공지만 반환해야 함', async () => {
            jest.spyOn(service as any, 'getTodayDate').mockReturnValue(mockTodayDate);
            service['cachedNoticeIds'] = new Set(['W-1']);

            const notices = [
                { id: 'W-1', title: 'Title 1', link: 'https://example.com/1', date: mockTodayDate, writer: 'Writer1', access: 'Access1' },
                { id: 'W-3', title: 'Title 3', link: 'https://example.com/3', date: mockTodayDate, writer: 'Writer2', access: 'Access2' },
                { id: 'W-4', title: 'Title 4', link: 'https://example.com/4', date: '2025.02.21', writer: 'Writer3', access: 'Access3' },
            ];

            const result = await service['filterNewNotices'](notices);

            expect(result.length).toBe(1);
            expect(result[0].id).toBe('W-3');
        });
    });

    describe('saveNotice', () => {
        it('공지 저장 성공 시 로그 기록 후 resolve 되어야 함', async () => {
            fakeDB.run.mockImplementation((query: string, params: any[], callback: any) => {
                callback(null);
            });

            await expect(
                service['saveNotice']({
                    id: 'W-1',
                    title: 'Title 1',
                    link: 'https://example.com/1',
                    date: mockTodayDate,
                    writer: 'Writer1',
                    access: 'Access1',
                })
            ).resolves.toBeUndefined();

            expect(fakeDB.run).toHaveBeenCalledWith(
                "INSERT OR IGNORE INTO notices (id, title, link, date) VALUES (?, ?, ?, ?)",
                ['W-1', 'Title 1', 'https://example.com/1', mockTodayDate],
                expect.any(Function)
            );
            expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining(`✅ 학사 새로운 공지사항 ID 저장 완료: W-1`));
        });

        it('공지 저장 실패 시 에러 로그 기록 후 reject 되어야 함', async () => {
            fakeDB.run.mockImplementation((query: string, params: any[], callback: any) => {
                callback(new Error('저장 실패'));
            });

            await expect(
                service['saveNotice']({
                    id: 'W-1',
                    title: 'Title 1',
                    link: 'https://example.com/1',
                    date: mockTodayDate,
                    writer: 'Writer1',
                    access: 'Access1',
                })
            ).rejects.toThrow('저장 실패');

            expect(loggerErrorMock).toHaveBeenCalledWith(expect.stringContaining('❌ 학사 SQLite 저장 중 오류 발생: 저장 실패'));
        });
    });

    describe('getTodayDate', () => {
        it('오늘 날짜를 YYYY.MM.DD 형식으로 반환해야 함', () => {
            const today = dayjs().format('YYYY.MM.DD');
            const result = service['getTodayDate']();
            expect(result).toBe(today);
        });
    });

    // ====================================================
    // 5. 추가 경로 및 부가 테스트 (커버리지 확장을 위함)
    // ====================================================
    describe('추가 경로 및 에러 상황', () => {
        it('fetchNotices가 여러 공지를 반환하면 각각 처리되어야 함', async () => {
            const multipleNotices = [
                { id: 'W-10', title: 'Title 10', link: 'https://example.com/10', date: mockTodayDate },
                { id: 'W-11', title: 'Title 11', link: 'https://example.com/11', date: mockTodayDate },
            ];
            (mockWholeNoticeScraperService.fetchNotices as jest.Mock).mockResolvedValue(multipleNotices);
            jest.spyOn(service as any, 'filterNewNotices').mockResolvedValue(multipleNotices);
            const saveSpy = jest.spyOn(service as any, 'saveNotice').mockResolvedValue(undefined);

            process.env.NODE_ENV = 'production';

            await service['executeCrawling']('추가 테스트');

            for (const notice of multipleNotices) {
                expect(sendWholeNotificationMock).toHaveBeenCalledWith(notice.title, {
                    id: notice.id,
                    link: notice.link,
                });
            }
            expect(saveSpy).toHaveBeenCalledTimes(multipleNotices.length);
            multipleNotices.forEach(notice => {
                expect(service['cachedNoticeIds'].has(notice.id)).toBe(true);
            });
            expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining('🏁 추가 테스트 크롤링 끝!'));
        });

        it('deleteOldNotices 내부에서 예외가 발생하면 에러 로그 기록되어야 함', async () => {
            jest.spyOn(service as any, 'deleteNoticesExceptToday').mockRejectedValue(new Error('전체 삭제 실패'));

            await service['deleteOldNotices']('추가 삭제 테스트');

            expect(loggerErrorMock).toHaveBeenCalledWith(expect.stringContaining('❌ 추가 삭제 테스트 오래된 공지사항 삭제 중 오류 발생: 전체 삭제 실패'));
        });
    });
});