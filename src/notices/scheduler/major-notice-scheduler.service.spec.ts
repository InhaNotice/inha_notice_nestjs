import { Test, TestingModule } from '@nestjs/testing';
import { MajorNoticeSchedulerService } from 'src/notices/scheduler/major-notice-scheduler.service';
import { MajorNoticeScraperService } from 'src/notices/scraper/major-notice-scraper.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import * as fs from 'fs';
import * as sqlite3 from 'sqlite3';

describe('MajorNoticeSchedulerService', () => {
    let service: MajorNoticeSchedulerService;
    let mockMajorNoticeScraperService: Partial<MajorNoticeScraperService>;
    let mockFirebaseService: Partial<FirebaseService>;
    let loggerLogMock: jest.SpyInstance;
    let loggerDebugMock: jest.SpyInstance;
    let loggerErrorMock: jest.SpyInstance;
    let sendMajorNotificationMock: jest.SpyInstance;

    const mockMajor = 'TEST';
    const mockMajors = ['TEST'];
    const mockfetchedNotices = {
        'TEST': [undefined]
    };

    beforeEach(async () => {
        setupMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MajorNoticeSchedulerService,
                { provide: MajorNoticeScraperService, useValue: mockMajorNoticeScraperService },
                { provide: FirebaseService, useValue: mockFirebaseService },
            ],
        }).compile();

        service = module.get<MajorNoticeSchedulerService>(MajorNoticeSchedulerService);

        // Database 및 캐싱 데이터 모킹
        mockMajors.forEach((major) => {
            service['databases'][major] = {
                get: jest.fn(),
                all: jest.fn(),
                run: jest.fn((_query: string, callback: Function) => callback(null)),
            } as any;
            service['cachedNoticeIds'][major] = new Set();
        });

        loggerLogMock = jest.spyOn(service['logger'], 'log').mockImplementation();
        loggerDebugMock = jest.spyOn(service['logger'], 'debug').mockImplementation();
        loggerErrorMock = jest.spyOn(service['logger'], 'error').mockImplementation();
    });

    afterEach(() => {
        // spyOn으로 모킹된 메서드 원래 함수로 복구
        jest.restoreAllMocks();
    });

    function setupMocks() {
        mockMajorNoticeScraperService = {
            getAllMajors: jest.fn().mockReturnValue(mockMajors),
            fetchAllNotices: jest.fn(),
        };

        mockFirebaseService = { sendMajorNotification: jest.fn() };

        sendMajorNotificationMock = jest.spyOn(mockFirebaseService, 'sendMajorNotification').mockResolvedValue(undefined);
    }

    describe('Database 초기화', () => {
        it('디렉토리가 존재하지 않을 때 mkdirSync가 호출되어야 한다', () => {
            const existsSyncMock = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
            const mkdirSyncMock = jest.spyOn(fs, 'mkdirSync').mockImplementation();

            service['initializeDatabaseDirectory']();

            // existsSync() 호출
            expect(existsSyncMock).toHaveBeenCalledWith(service['databaseDir']);
            // mkdirSync() 호출
            expect(mkdirSyncMock).toHaveBeenCalledWith(service['databaseDir'], { recursive: true });
        });

        it('디렉토리가 이미 존재하면 mkdirSync가 호출되지 않아야 한다', () => {
            const existsSyncMock = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            const mkdirSyncMock = jest.spyOn(fs, 'mkdirSync').mockImplementation();

            service['initializeDatabaseDirectory']();

            expect(existsSyncMock).toHaveBeenCalledWith(service['databaseDir']);
            expect(mkdirSyncMock).not.toHaveBeenCalled();
        });

        it('mkdirSync 실행 중 에러 발생 시 로깅이 실행되어야 한다', () => {
            const existsSyncMock = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
            const mkdirSyncMock = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {
                throw new Error('에러');
            });

            service['initializeDatabaseDirectory']();
            // existsSync() 호출
            expect(existsSyncMock).toHaveBeenCalledWith(service['databaseDir']);
            // mkdirSync() 호출 중 에러 발생
            expect(mkdirSyncMock).toHaveBeenCalled();

            // 로그
            expect(loggerErrorMock).toHaveBeenCalledWith(expect.stringMatching('❌ 데이터베이스 디렉터리 생성 실패: 에러'));
        });
    });

    describe('DB 연결 (initializeDatabases)', () => {
        it('DB 연결 및 테이블 초기화가 이루어져야 함', () => {
            const dbMock = {
                run: jest.fn(),
                get: jest.fn(),
                all: jest.fn(),
            } as any;
            const sqliteMock = jest.spyOn(sqlite3, 'Database').mockImplementation((_: any, callback: any) => {
                callback(null);
                return dbMock;
            });
            const initializeTableMock = jest.spyOn<any, any>(service, 'initializeTable').mockImplementation();

            service['initializeDatabases']();

            // getAllMajors() 호출
            expect(mockMajorNoticeScraperService.getAllMajors).toHaveBeenCalled();
            // sqlite3.Database 호출
            expect(sqliteMock).toHaveBeenCalled();
            mockMajors.forEach((major) => {
                // sqlite3.Database 초기화
                expect(service['databases'][major]).toBe(dbMock);
                // initializeTable() 호출
                expect(initializeTableMock).toHaveBeenCalledWith(major);
            });
        });

        it('DB 연결 실패 시 에러 로깅이 실행되어야 한다', () => {
            const sqliteMock = jest.spyOn(sqlite3, 'Database').mockImplementation((_: any, callback: any) => {
                callback(new Error('에러'));
                return {} as any;
            });

            service['initializeDatabases']();

            // getAllMajors() 호출
            expect(mockMajorNoticeScraperService.getAllMajors).toHaveBeenCalled();
            // sqlite3.Database 호출
            expect(sqliteMock).toHaveBeenCalled();
            // 로그
            expect(loggerErrorMock).toHaveBeenCalledWith(expect.stringMatching(`❌ ${mockMajor} 데이터베이스 연결 실패: 에러`));
        });
    });

    describe('테이블 초기화 (initializeTable)', () => {
        let loadCacheMock;

        beforeEach(() => {
            loadCacheMock = jest.spyOn(service as any, 'loadCache').mockResolvedValue(undefined);
        });

        it('테이블 생성 쿼리가 실행되어야 한다', () => {
            // run() 메서드 모킹
            const runMock = jest.spyOn(service['databases'][mockMajor], 'run').mockImplementation((_: any, callback: any) => {
                callback(null);
                return {} as any;
            });

            service['initializeTable'](mockMajor);

            // 테이블 생성 쿼리가 실행되었는지 확인
            expect(runMock).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS notices'), expect.any(Function));
            // loadCache() 호출
            expect(loadCacheMock).toHaveBeenCalledWith(mockMajor);
        });

        it('테이블 생성 실패 시 에러 로깅이 실행되어야 한다', () => {
            // run() 메서드 모킹
            const runMock = jest.spyOn(service['databases'][mockMajor], 'run').mockImplementation((_: any, callback: any) => {
                callback(new Error('에러'));
                return {} as any;
            });

            service['initializeTable'](mockMajor);
            // 테이블 생성 쿼리가 실행되었는지 확인
            expect(runMock).toHaveBeenCalled();
            // loadCache() 미호출
            expect(loadCacheMock).not.toHaveBeenCalled();
            // 로그
            expect(loggerErrorMock).toHaveBeenCalledWith(expect.stringMatching(`❌ ${mockMajor} 테이블 생성 실패: 에러`));
        });
    });

    describe('캐시 로드 (loadCache)', () => {
        let getMock: jest.SpyInstance;
        let allMock: jest.SpyInstance;

        beforeEach(() => {
            getMock = jest.spyOn(service['databases']['TEST'], 'get');
            allMock = jest.spyOn(service['databases']['TEST'], 'all');
        });

        it('테이블이 존재하지 않으면 캐시를 로드하지 않아야 한다', () => {
            getMock.mockImplementation((_query, callback) => callback(null, null)); // 테이블이 존재하지 않음
            const loggerWarnMock = jest.spyOn(service['logger'], 'warn').mockImplementation();

            service['loadCache']('TEST');

            expect(getMock).toHaveBeenCalledWith(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='notices'",
                expect.any(Function)
            );
            expect(loggerWarnMock).toHaveBeenCalledWith(expect.stringContaining('notices 테이블이 존재하지 않아 캐시를 로드하지 않습니다.'));
            expect(allMock).not.toHaveBeenCalled(); // all()이 실행되지 않아야 함
        });

        it('테이블 확인 중 오류가 발생하면 로깅이 실행되어야 한다', () => {
            getMock.mockImplementation((_query, callback) => callback(new Error('테이블 확인 실패'), null));
            const loggerErrorMock = jest.spyOn(service['logger'], 'error').mockImplementation();

            service['loadCache']('TEST');

            expect(loggerErrorMock).toHaveBeenCalledWith(expect.stringContaining('SQLite 테이블 확인 중 오류 발생'));
            expect(allMock).not.toHaveBeenCalled(); // 테이블 조회에 실패했으므로 공지사항 조회 실행 안됨
        });

        it('테이블이 존재하면 공지사항 ID를 캐싱해야 한다', () => {
            getMock.mockImplementation((_query, callback) => callback(null, {})); // 테이블이 존재함
            allMock.mockImplementation((_query, _params, callback) => callback(null, [
                { id: 'TEST-1' },
            ]));

            const loggerLogMock = jest.spyOn(service['logger'], 'log').mockImplementation();

            service['loadCache']('TEST');

            expect(allMock).toHaveBeenCalledWith(
                "SELECT id FROM notices",
                [],
                expect.any(Function)
            );
            expect(service['cachedNoticeIds']['TEST'].has('TEST-1')).toBe(true);
            expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining('✅ TEST 캐싱된 공지사항 ID 로드 완료 (1개)'));
        });

        it('공지사항 ID 로드 중 오류가 발생하면 로깅이 실행되어야 한다', () => {
            getMock.mockImplementation((_query, callback) => callback(null, {})); // 테이블 존재함
            allMock.mockImplementation((_query, _params, callback) => callback(new Error('공지사항 조회 실패'), null));

            const loggerErrorMock = jest.spyOn(service['logger'], 'error').mockImplementation();

            service['loadCache']('TEST');

            expect(loggerErrorMock).toHaveBeenCalledWith(expect.stringContaining('SQLite 캐시 로드 중 오류 발생'));
        });
    });

    describe('스케줄러 실행', () => {
        let executeCrawlingSpy;
        let deleteOldNoticesSpy;
        beforeEach(() => {
            executeCrawlingSpy = jest.spyOn(service, 'executeCrawling').mockResolvedValue(undefined);
            deleteOldNoticesSpy = jest.spyOn(service, 'deleteOldNotices').mockResolvedValue(undefined);
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('executeCrawling()을 9시~16시 10분 간격으로 실행해야 한다', async () => {
            const logPrefix = '테스트 로그';
            const handleWeekDaysCronSpy = jest.spyOn(service, 'handleWeekDaysCron').mockImplementation(async () => {
                await executeCrawlingSpy(logPrefix);
            });

            await service.handleWeekDaysCron();

            expect(handleWeekDaysCronSpy).toHaveBeenCalled();
            expect(executeCrawlingSpy).toHaveBeenCalledWith(logPrefix);

        });

        it('deleteOldNotices()를 17시 정각에 실행해야 한다', async () => {
            const logPrefix = '테스트 로그';
            const handleDeleteCron = jest.spyOn(service, 'handleDeleteCron').mockImplementation(async () => {
                await deleteOldNoticesSpy(logPrefix);
            });

            await service.handleDeleteCron();

            expect(handleDeleteCron).toHaveBeenCalled();
            expect(deleteOldNoticesSpy).toHaveBeenCalledWith(logPrefix);
        });
    });

    describe('executeCrawling()', () => {
        let filterNewNoticesMock: jest.SpyInstance;
        let saveNoticeMock: jest.SpyInstance;
        let fetchAllNoticesMock: jest.SpyInstance;

        beforeEach(() => {
            filterNewNoticesMock = jest.spyOn(service as any, 'filterNewNotices').mockResolvedValue([
                { id: 'TEST-1', title: '공지사항', link: 'https://test.example.com/1', date: '2025.02.21', writer: '이름', access: '1' },
            ]);
            saveNoticeMock = jest.spyOn(service as any, 'saveNotice').mockResolvedValue(undefined);
            fetchAllNoticesMock = jest.spyOn(mockMajorNoticeScraperService, 'fetchAllNotices').mockResolvedValue({ 'TEST': [] });
        });

        afterEach(() => {
            jest.resetAllMocks();
        });

        it('배포 환경에서 새로운 공지가 있을 때 크롤링이 정상적으로 수행되어야 한다', async () => {
            const logPrefix = '테스트 로그';
            process.env.NODE_ENV = 'production';

            await service.executeCrawling(logPrefix);

            // fetchAllNotices() 호출
            expect(fetchAllNoticesMock).toHaveBeenCalled();
            // filterNewNotices() 호출
            expect(filterNewNoticesMock).toHaveBeenCalledWith(mockMajor, mockfetchedNotices[mockMajor]);
            // sendMajorNotification() 호출
            expect(sendMajorNotificationMock).toHaveBeenCalledWith(
                '공지사항',
                'TEST',
                { id: 'TEST-1', link: 'https://test.example.com/1' }
            );
            // saveNotice() 호출
            expect(saveNoticeMock).toHaveBeenCalled();
            // 캐시에 새로운 공지 추가
            expect(service['cachedNoticeIds'][mockMajor].has('TEST-1')).toBe(true);

            // 로그
            expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining(`📌 ${logPrefix} 크롤링 실행 중...`));
            expect(loggerLogMock).toHaveBeenCalledWith(expect.stringMatching(`🚀 ${mockMajor} 새로운 공지 발견: 공지사항`));
            expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining(`🏁 ${logPrefix} 크롤링 끝!`));
        });

        it('배포 환경에서 새로운 공지가 없으면 알림과 저장이 수행되지 않아야 한다', async () => {
            const logPrefix = '테스트 로그';
            process.env.NODE_ENV = 'production';

            // 새로운 공지가 존재하지 않음
            filterNewNoticesMock.mockResolvedValue([]);

            await service.executeCrawling(logPrefix);

            // fetchAllNotices() 호출
            expect(fetchAllNoticesMock).toHaveBeenCalled();
            // filterNewNotices() 호출
            expect(filterNewNoticesMock).toHaveBeenCalledWith(mockMajor, mockfetchedNotices[mockMajor]);

            // sendMajorNotification() 미호출
            expect(sendMajorNotificationMock).not.toHaveBeenCalled();
            // saveNotice() 미호출
            expect(saveNoticeMock).not.toHaveBeenCalled();

            // 로그 검증
            expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining(`📌 ${logPrefix} 크롤링 실행 중...`));
            expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining(`🏁 ${logPrefix} 크롤링 끝!`));
        });

        it('개발 환경에서는 새로운 공지를 발견해도 푸시 알림이 전송되지 않아야 한다', async () => {
            const logPrefix = '테스트 로그';
            process.env.NODE_ENV = 'development';

            await service.executeCrawling(logPrefix);

            // fetchAllNotices() 호출
            expect(fetchAllNoticesMock).toHaveBeenCalled();
            // filterNewNotices() 호출
            expect(filterNewNoticesMock).toHaveBeenCalledWith(mockMajor, mockfetchedNotices[mockMajor]);
            // sendMajorNotification() 미호출
            expect(sendMajorNotificationMock).not.toHaveBeenCalled();
            // saveNotice() 호출
            expect(saveNoticeMock).toHaveBeenCalled();
            // 캐시에 새로운 공지 추가
            expect(service['cachedNoticeIds'][mockMajor].has('TEST-1')).toBe(true);

            // 로그
            expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining(`📌 ${logPrefix} 크롤링 실행 중...`));
            expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining(`🚀 ${mockMajor} 새로운 공지 발견: 공지사항`));
            expect(loggerDebugMock).toHaveBeenCalledWith(expect.stringContaining(`🔕 ${logPrefix}-${mockMajor} 개발 환경이므로 푸시 알림을 전송하지 않습니다.`));
            expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining(`🏁 ${logPrefix} 크롤링 끝!`));
        });

        it('크롤링 중 오류가 발생하면 로깅이 실행되어야 한다', async () => {
            const errorMessage = '크롤링 실패';
            jest.spyOn(mockMajorNoticeScraperService, 'fetchAllNotices').mockRejectedValue(new Error(errorMessage));

            await service.executeCrawling('테스트 실행');

            expect(loggerErrorMock).toHaveBeenCalledWith(expect.stringContaining(`❌ 테스트 실행 크롤링 중 오류 발생:, ${errorMessage}`));
        });
    });
});