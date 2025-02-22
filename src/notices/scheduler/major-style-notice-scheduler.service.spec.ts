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
import { MajorStyleNoticeSchedulerService } from 'src/notices/scheduler/major-style-notice-scheduler.service';
import { MajorStyleNoticeScraperService } from 'src/notices/scraper/major-style-notice-scraper.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import * as fs from 'fs';
import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as dayjs from 'dayjs';

describe('MajorStyleNoticeSchedulerService', () => {
  let service: MajorStyleNoticeSchedulerService;
  let mockMajorStyleNoticeScraperService: Partial<MajorStyleNoticeScraperService>;
  let mockFirebaseService: Partial<FirebaseService>;
  let loggerLogMock: jest.SpyInstance;
  let loggerDebugMock: jest.SpyInstance;
  let loggerWarnMock: jest.SpyInstance;
  let loggerErrorMock: jest.SpyInstance;
  let sendMajorStyleNotificationMock: jest.SpyInstance;

  const mockNoticeType = 'INTERNATIONAL';
  const mockOtherNoticeType = 'SWUNIV';
  const mockNoticeTypes = [mockNoticeType, mockOtherNoticeType];

  const mockFetchedNotices = {
    INTERNATIONAL: [
      {
        id: 'INT-1',
        title: 'Title 1',
        link: 'https://example.com/1',
        date: '2025.02.22',
        writer: 'Writer1',
        access: 'Access1',
      },
      {
        id: 'INT-2',
        title: 'Title 2',
        link: 'https://example.com/2',
        date: '2025.02.23',
        writer: 'Writer2',
        access: 'Access2',
      },
    ],
    SWUNIV: [
      {
        id: 'SW-1',
        title: 'Title 1',
        link: 'https://example.com/3',
        date: '2025.02.22',
        writer: 'Writer1',
        access: 'Access1',
      },
    ],
  };

  beforeEach(async () => {
    jest.resetModules();
    setupMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MajorStyleNoticeSchedulerService,
        { provide: MajorStyleNoticeScraperService, useValue: mockMajorStyleNoticeScraperService },
        { provide: FirebaseService, useValue: mockFirebaseService },
      ],
    }).compile();

    service = module.get<MajorStyleNoticeSchedulerService>(MajorStyleNoticeSchedulerService);

    // DB 및 캐시 객체 모킹 (각 noticeType에 대해)
    service['cachedNoticeIds'] = {};
    mockNoticeTypes.forEach((type) => {
      service['databases'][type] = {
        run: jest.fn((query: string, params: any[], callback: Function) => callback(null)),
        get: jest.fn(),
        all: jest.fn(),
      } as any;
      service['cachedNoticeIds'][type] = new Set();
    });

    // Logger 스파이 생성
    loggerLogMock = jest.spyOn(service['logger'], 'log').mockImplementation();
    loggerDebugMock = jest.spyOn(service['logger'], 'debug').mockImplementation();
    loggerWarnMock = jest.spyOn(service['logger'], 'warn').mockImplementation();
    loggerErrorMock = jest.spyOn(service['logger'], 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function setupMocks() {
    mockMajorStyleNoticeScraperService = {
      getAllNoticeTypes: jest.fn().mockReturnValue(mockNoticeTypes),
      fetchAllNotices: jest.fn(),
    };

    mockFirebaseService = {
      sendMajorStyleNotification: jest.fn(),
    };

    sendMajorStyleNotificationMock = jest
      .spyOn(mockFirebaseService, 'sendMajorStyleNotification')
      .mockResolvedValue(undefined);
  }

  // ===============================================================
  // 1. 초기화 관련 메서드 테스트
  // ===============================================================
  describe('Database 디렉터리 초기화 (initializeDatabaseDirectory)', () => {
    it('디렉터리가 존재하지 않으면 mkdirSync 호출되어야 함', () => {
      const existsSyncMock = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      const mkdirSyncMock = jest.spyOn(fs, 'mkdirSync').mockImplementation();

      service['initializeDatabaseDirectory']();
      // fs.existsSync() 호출
      expect(existsSyncMock).toHaveBeenCalledWith(service['databaseDir']);
      // fs.mkdirSync() 호출
      expect(mkdirSyncMock).toHaveBeenCalledWith(service['databaseDir'], { recursive: true });
    });

    it('디렉터리가 이미 존재하면 mkdirSync 호출되지 않아야 함', () => {
      const existsSyncMock = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const mkdirSyncMock = jest.spyOn(fs, 'mkdirSync').mockImplementation();

      service['initializeDatabaseDirectory']();

      // fs.existsSync() 호출
      expect(existsSyncMock).toHaveBeenCalledWith(service['databaseDir']);
      // fs.mkdirSync() 미호출
      expect(mkdirSyncMock).not.toHaveBeenCalled();
    });

    it('mkdirSync 실행 중 에러 발생 시 로깅되어야 함', () => {
      const mockError = 'mkdir error';
      const existsSyncMock = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      const mkdirSyncMock = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {
        throw new Error(mockError);
      });

      service['initializeDatabaseDirectory']();

      // fs.existsSync() 호출
      expect(existsSyncMock).toHaveBeenCalledWith(service['databaseDir']);
      // fs.mkdirSync() 호출
      expect(mkdirSyncMock).toHaveBeenCalled();
      // 로그 검증
      expect(loggerErrorMock).toHaveBeenCalledWith(
        expect.stringMatching(`❌ 데이터베이스 디렉터리 생성 실패: ${mockError}`),
      );
    });
  });

  describe('데이터베이스 초기화 (initializeDatabases)', () => {
    it('DB 연결 및 테이블 초기화가 수행되어야 함', () => {
      const sqliteMock = jest.spyOn(sqlite3, 'Database').mockImplementation((dbPath: any, callback: any) => {
        callback(null);
        return { run: jest.fn() } as any;
      });
      const initializeTableSpy = jest.spyOn<any, any>(service, 'initializeTable').mockImplementation();

      service['initializeDatabases']();
      // getAllNoticesTypes() 호출
      expect(mockMajorStyleNoticeScraperService.getAllNoticeTypes).toHaveBeenCalled();
      // sqliteMock 2회 호출
      expect(sqliteMock).toHaveBeenCalledTimes(mockNoticeTypes.length);
      mockNoticeTypes.forEach((type) => {
        const expectedPath = path.join(service['databaseDir'], `${type}.db`);
        // sqlite3.Database 호출
        expect(sqliteMock).toHaveBeenCalledWith(expectedPath, expect.any(Function));
        // initializeTable() 호출
        expect(initializeTableSpy).toHaveBeenCalledWith(type);
      });
    });

    it('DB 연결 실패 시 에러 로깅되어야 함', () => {
      const mockError = 'DB 연결 실패';
      const sqliteMock = jest.spyOn(sqlite3, 'Database').mockImplementation((dbPath: any, callback: any) => {
        callback(new Error(mockError));
        return {} as any;
      });
      const initializeTableSpy = jest.spyOn<any, any>(service, 'initializeTable').mockImplementation();

      service['initializeDatabases']();

      // getAllNotices() 호출
      expect(mockMajorStyleNoticeScraperService.getAllNoticeTypes).toHaveBeenCalled();
      // sqliteMock 2회 호출
      expect(sqliteMock).toHaveBeenCalledTimes(mockNoticeTypes.length);
      mockNoticeTypes.forEach((type) => {
        // 로그 검증 
        expect(loggerErrorMock).toHaveBeenCalledWith(
          expect.stringMatching(`${type} 데이터베이스 연결 실패: ${mockError}`),
        );
        // initializeTable() 미호출
        expect(initializeTableSpy).not.toHaveBeenCalledWith(type);
      });
    });
  });

  describe('테이블 초기화 (initializeTable)', () => {
    let loadCacheMock: jest.SpyInstance;
    beforeEach(() => {
      loadCacheMock = jest.spyOn(service as any, 'loadCache').mockImplementation();
    });

    it('테이블 생성 쿼리가 정상적으로 실행되어야 하며 loadCache 호출', () => {
      const runMock = jest
        .spyOn(service['databases'][mockNoticeType], 'run')
        .mockImplementation((query: any, callback: any) => {
          callback(null);
          return {} as any;
        });

      service['initializeTable'](mockNoticeType);

      // sqlite3.Database.run() 호출
      expect(runMock).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS notices'), expect.any(Function));
      // loadCache() 호출
      expect(loadCacheMock).toHaveBeenCalledWith(mockNoticeType);
    });

    it('테이블 생성 실패 시 에러 로깅되어야 함', () => {
      const mockError = '테이블 에러';
      const runMock = jest
        .spyOn(service['databases'][mockNoticeType], 'run')
        .mockImplementation((query: string, callback: Function) => {
          callback(new Error(mockError));
          return {} as any;
        });

      service['initializeTable'](mockNoticeType);

      // sqlite3.Database.run() 호출
      expect(runMock).toHaveBeenCalled();
      // loadCache() 미호출
      expect(loadCacheMock).not.toHaveBeenCalled();
      // 로그 검증
      expect(loggerErrorMock).toHaveBeenCalledWith(
        expect.stringMatching(`❌ ${mockNoticeType} 테이블 생성 실패: ${mockError}`),
      );
    });
  });

  describe('캐시 로드 (loadCache)', () => {
    let getMock: jest.SpyInstance;
    let allMock: jest.SpyInstance;

    beforeEach(() => {
      getMock = jest.spyOn(service['databases'][mockNoticeType], 'get');
      allMock = jest.spyOn(service['databases'][mockNoticeType], 'all');
    });

    it('테이블이 존재하지 않으면 캐시 로드하지 않고 경고 로깅', () => {
      getMock.mockImplementation((query: string, callback: Function) => callback(null, null));

      service['loadCache'](mockNoticeType);

      // sqlite3.Database.get() 호출
      expect(getMock).toHaveBeenCalledWith(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='notices'",
        expect.any(Function),
      );
      // 로그 검증
      expect(loggerWarnMock).toHaveBeenCalledWith(
        expect.stringContaining(`${mockNoticeType} notices 테이블이 존재하지 않아 캐시를 로드하지 않습니다.`),
      );
      // sqlite3.Database.all() 미호출
      expect(allMock).not.toHaveBeenCalled();
    });

    it('테이블 확인 중 에러 발생 시 에러 로깅되어야 함', () => {
      const mockError = '확인 에러';
      getMock.mockImplementation((query: string, callback: Function) => callback(new Error(mockError), null));

      service['loadCache'](mockNoticeType);

      // sqlite3.Database.get() 호출
      expect(getMock).toHaveBeenCalledWith(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='notices'",
        expect.any(Function),
      );
      // 로그 검증
      expect(loggerErrorMock).toHaveBeenCalledWith(
        expect.stringMatching(`${mockNoticeType} SQLite 테이블 확인 중 오류 발생: ${mockError}`),
      );
      // sqlite3.Database.all() 미호출
      expect(allMock).not.toHaveBeenCalled();
    });

    it('테이블이 존재하면 공지사항 ID 캐싱 및 로깅되어야 함', () => {
      getMock.mockImplementation((query: string, callback: Function) => callback(null, {}));
      const rows = [{ id: 'INT-1' }, { id: 'INT-2' }];
      allMock.mockImplementation((query: string, params: any[], callback: Function) => callback(null, rows));

      service['loadCache'](mockNoticeType);

      // sqlite3.Database.get() 호출
      expect(getMock).toHaveBeenCalled();
      // sqlite3.Database.all() 호출
      expect(allMock).toHaveBeenCalledWith("SELECT id FROM notices", [], expect.any(Function));
      // 캐시 검증
      expect(service['cachedNoticeIds'][mockNoticeType].has('INT-1')).toBe(true);
      expect(service['cachedNoticeIds'][mockNoticeType].has('INT-2')).toBe(true);
      // 로그 검증
      expect(loggerLogMock).toHaveBeenCalledWith(
        expect.stringContaining(`✅ ${mockNoticeType} 캐싱된 공지사항 ID 로드 완료 (2개)`),
      );
    });

    it('공지사항 ID 로드 중 에러 발생 시 에러 로깅되어야 함', () => {
      const mockError = '캐시 에러';
      getMock.mockImplementation((query: string, callback: Function) => callback(null, {}));
      allMock.mockImplementation((query: string, params: any[], callback: Function) =>
        callback(new Error(mockError), null),
      );

      service['loadCache'](mockNoticeType);

      // sqlite3.Database.get() 호출
      expect(getMock).toHaveBeenCalled();
      // 로그
      expect(loggerErrorMock).toHaveBeenCalledWith(
        expect.stringMatching(`${mockNoticeType} SQLite 캐시 로드 중 오류 발생: ${mockError}`),
      );
    });
  });

  // ===============================================================
  // 2. 스케줄러 (Cron) 관련 메서드 테스트
  // ===============================================================
  describe('스케줄러 실행', () => {
    let executeCrawlingSpy;
    let deleteOldNoticesSpy;

    beforeEach(() => {
      executeCrawlingSpy = jest.spyOn<any, any>(service, 'executeCrawling').mockResolvedValue(undefined);
      deleteOldNoticesSpy = jest.spyOn<any, any>(service, 'deleteOldNotices').mockResolvedValue(undefined);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('handleWeekDaysCron()이 올바른 로그 접두사로 executeCrawling 호출', async () => {
      const logPrefix = '학과 스타일(국제처, SW) 정기(9~17시)';
      const weekDaysCronSpy = jest.spyOn(service, 'handleWeekDaysCron').mockImplementation(async () => {
        await executeCrawlingSpy(logPrefix);
      });

      await service.handleWeekDaysCron();

      expect(weekDaysCronSpy).toHaveBeenCalled();
      expect(executeCrawlingSpy).toHaveBeenCalledWith(logPrefix);
    });

    it('handleDeleteCron()이 올바른 로그 접두사로 deleteOldNotices 호출', async () => {
      const logPrefix = '학과 스타일(국제처, SW)(17시)';
      const deleteCronSpy = jest
        .spyOn(service, 'handleDeleteCron')
        .mockImplementation(async () => {
          await deleteOldNoticesSpy(logPrefix);
        });

      await service.handleDeleteCron();

      expect(deleteCronSpy).toHaveBeenCalled();
      expect(deleteOldNoticesSpy).toHaveBeenCalledWith(logPrefix);
    });
  });

  // ===============================================================
  // 3. 주요 비즈니스 로직 (크롤링, 삭제) 테스트
  // ===============================================================
  describe('executeCrawling()', () => {
    let fetchAllNoticesMock: jest.SpyInstance;
    let filterNewNoticesMock: jest.SpyInstance;
    let saveNoticeMock: jest.SpyInstance;

    beforeEach(() => {
      fetchAllNoticesMock = jest
        .spyOn(mockMajorStyleNoticeScraperService, 'fetchAllNotices')
        .mockResolvedValue(mockFetchedNotices);
      filterNewNoticesMock = jest
        .spyOn(service as any, 'filterNewNotices')
        .mockResolvedValue([
          {
            id: 'INT-1',
            title: 'Title 1',
            link: 'https://example.com/1',
            date: '2025.02.22',
            writer: 'Writer1',
            access: 'Access1',
          },
        ]);
      saveNoticeMock = jest.spyOn(service as any, 'saveNotice').mockResolvedValue(undefined);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('배포 환경에서 새로운 공지가 있을 때 정상 처리되어야 함', async () => {
      const logPrefix = '테스트 로그';
      process.env.NODE_ENV = 'production';

      await service['executeCrawling'](logPrefix);

      // fetchAllNotices() 호출
      expect(fetchAllNoticesMock).toHaveBeenCalled();
      // filterNewNotices() 및 sendMajorStyleNotification() 호출
      expect(filterNewNoticesMock).toHaveBeenCalledWith('INTERNATIONAL', mockFetchedNotices['INTERNATIONAL']);
      expect(sendMajorStyleNotificationMock).toHaveBeenCalledWith('Title 1', 'INTERNATIONAL', {
        id: 'INT-1',
        link: 'https://example.com/1',
      });
      expect(filterNewNoticesMock).toHaveBeenCalledWith('SWUNIV', mockFetchedNotices['SWUNIV']);
      expect(sendMajorStyleNotificationMock).toHaveBeenCalledWith('Title 1', 'SWUNIV', {
        id: 'INT-1',
        link: 'https://example.com/1',
      });

      expect(saveNoticeMock).toHaveBeenCalledWith('INTERNATIONAL', mockFetchedNotices['INTERNATIONAL'][0]);
      expect(service['cachedNoticeIds']['INTERNATIONAL'].has('INT-1')).toBe(true);
      expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining(`📌 ${logPrefix} 정기 크롤링 실행 중...`));
      expect(loggerLogMock).toHaveBeenCalledWith(expect.stringMatching(`🚀 ${logPrefix}-INTERNATIONAL 새로운 공지 발견: Title 1`));
      expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining(`🏁 ${logPrefix} 정기 크롤링 끝!`));
    });

    it('배포 환경에서 새로운 공지가 없으면 알림 및 저장이 이루어지지 않아야 함', async () => {
      const logPrefix = '테스트 로그';
      process.env.NODE_ENV = 'production';
      filterNewNoticesMock.mockResolvedValue([]);

      await service['executeCrawling'](logPrefix);

      expect(fetchAllNoticesMock).toHaveBeenCalled();
      expect(filterNewNoticesMock).toHaveBeenCalledWith('INTERNATIONAL', mockFetchedNotices['INTERNATIONAL']);
      expect(sendMajorStyleNotificationMock).not.toHaveBeenCalled();
      expect(saveNoticeMock).not.toHaveBeenCalled();
      expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining(`📌 ${logPrefix} 정기 크롤링 실행 중...`));
      expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining(`🏁 ${logPrefix} 정기 크롤링 끝!`));
    });

    it('개발 환경에서는 푸시 알림 전송 없이 저장 및 캐시 업데이트만 수행되어야 함', async () => {
      const logPrefix = '테스트 로그';
      process.env.NODE_ENV = 'development';

      await service['executeCrawling'](logPrefix);

      expect(fetchAllNoticesMock).toHaveBeenCalled();
      expect(filterNewNoticesMock).toHaveBeenCalledWith('INTERNATIONAL', mockFetchedNotices['INTERNATIONAL']);
      expect(sendMajorStyleNotificationMock).not.toHaveBeenCalled();
      expect(saveNoticeMock).toHaveBeenCalled();
      expect(service['cachedNoticeIds']['INTERNATIONAL'].has('INT-1')).toBe(true);
      expect(loggerDebugMock).toHaveBeenCalledWith(
        expect.stringContaining(`🔕 ${logPrefix}-INTERNATIONAL 개발 환경이므로 푸시 알림을 전송하지 않습니다.`),
      );
      expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining(`🏁 ${logPrefix} 정기 크롤링 끝!`));
    });

    it('크롤링 중 오류 발생 시 에러 로깅되어야 함', async () => {
      const logPrefix = '테스트 실행';
      fetchAllNoticesMock.mockRejectedValue(new Error('크롤링 실패'));

      await service['executeCrawling'](logPrefix);

      expect(loggerErrorMock).toHaveBeenCalledWith(expect.stringContaining(`❌ ${logPrefix} 크롤링 중 오류 발생:, 크롤링 실패`));
    });
  });

  describe('deleteOldNotices()', () => {
    let deleteNoticesExceptTodaySpy: jest.SpyInstance;
    let todayDate: string;

    beforeEach(() => {
      todayDate = '2025.02.22';
      jest.spyOn(service as any, 'getTodayDate').mockReturnValue(todayDate);
      deleteNoticesExceptTodaySpy = jest.spyOn(service as any, 'deleteNoticesExceptToday').mockResolvedValue(undefined);
    });

    it('각 noticeType에 대해 deleteNoticesExceptToday 호출 및 성공 로그', async () => {
      await service['deleteOldNotices']('테스트 삭제');

      Object.keys(service['databases']).forEach((type) => {
        expect(deleteNoticesExceptTodaySpy).toHaveBeenCalledWith(type, todayDate);
        expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining(`✅ 테스트 삭제-${type} 오래된 공지사항 삭제 완료`));
      });
    });

    it('삭제 중 오류 발생 시 에러 로깅되어야 함', async () => {
      deleteNoticesExceptTodaySpy.mockRejectedValue(new Error('삭제 오류'));

      await service['deleteOldNotices']('테스트 삭제');

      expect(loggerErrorMock).toHaveBeenCalledWith(
        expect.stringMatching(`❌ 테스트 삭제 오래된 공지사항 삭제 중 오류 발생: 삭제 오류`),
      );
    });
  });

  // ===============================================================
  // 4. DB 조작 및 삭제 관련 메서드 테스트
  // ===============================================================
  describe('deleteNoticesExceptToday()', () => {
    it('삭제 쿼리가 정상적으로 실행되어야 하며 loadCache 호출', async () => {
      const runMock = jest
        .spyOn(service['databases'][mockNoticeType], 'run')
        .mockImplementation((query: string, params: any[], callback: Function) => {
          callback(null);
          return {} as any;
        });
      const loadCacheSpy = jest.spyOn(service as any, 'loadCache').mockImplementation();

      await service['deleteNoticesExceptToday'](mockNoticeType, '2025.02.22');

      expect(runMock).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM notices WHERE date != ?'),
        ['2025.02.22'],
        expect.any(Function),
      );
      expect(loggerLogMock).toHaveBeenCalledWith(
        expect.stringContaining(`🗑️ ${mockNoticeType} 오늘이 아닌 공지사항 삭제 완료`),
      );
      expect(loadCacheSpy).toHaveBeenCalledWith(mockNoticeType);
    });

    it('삭제 실패 시 에러 로깅되고 reject 되어야 함', async () => {
      const runMock = jest
        .spyOn(service['databases'][mockNoticeType], 'run')
        .mockImplementation((query: string, params: any[], callback: Function) => {
          callback(new Error('삭제 실패'));
          return {} as any;
        });

      await expect(service['deleteNoticesExceptToday'](mockNoticeType, '2025.02.22')).rejects.toThrow(
        '삭제 실패',
      );
      expect(loggerErrorMock).toHaveBeenCalledWith(
        expect.stringMatching(`🚨 ${mockNoticeType} 오래된 공지사항 삭제 실패: 삭제 실패`),
      );
    });
  });

  // ===============================================================
  // 5. 기타 유틸리티 및 DB 관련 메서드 테스트
  // ===============================================================
  describe('filterNewNotices()', () => {
    it('오늘 날짜의 공지사항만 필터링하고, 이미 캐시된 공지는 제외해야 함', async () => {
      const todayDate = '2025.02.22';
      jest.spyOn(service as any, 'getTodayDate').mockReturnValue(todayDate);

      // 캐시에는 INT-1만 저장되어 있다고 가정
      service['cachedNoticeIds'][mockNoticeType] = new Set(['INT-1']);

      const notices = [
        { id: 'INT-1', title: 'Title 1', link: 'https://example.com/1', date: todayDate, writer: 'Writer1', access: 'Access1' },
        { id: 'INT-3', title: 'Title 3', link: 'https://example.com/3', date: todayDate, writer: 'Writer2', access: 'Access2' },
        { id: 'INT-4', title: 'Title 4', link: 'https://example.com/4', date: '2025.02.21', writer: 'Writer3', access: 'Access3' },
      ];

      const newNotices = await service['filterNewNotices'](mockNoticeType, notices);

      expect(newNotices.length).toBe(1);
      expect(newNotices[0].id).toBe('INT-3');
    });
  });

  describe('saveNotice()', () => {
    it('공지사항 저장 성공 시 로그 후 resolve 되어야 함', async () => {
      const runMock = jest
        .spyOn(service['databases'][mockNoticeType], 'run')
        .mockImplementation((query: string, params: any[], callback: Function) => {
          callback(null);
          return {} as any;
        });

      await expect(
        service['saveNotice'](mockNoticeType, {
          id: 'INT-1',
          title: 'Title 1',
          link: 'https://example.com/1',
          date: '2025.02.22',
          writer: 'Writer 1',
          access: 'Access 1',
        }),
      ).resolves.toBeUndefined();

      expect(runMock).toHaveBeenCalledWith(
        "INSERT OR IGNORE INTO notices (id, title, link, date) VALUES (?, ?, ?, ?)",
        ['INT-1', 'Title 1', 'https://example.com/1', '2025.02.22'],
        expect.any(Function),
      );
      expect(loggerLogMock).toHaveBeenCalledWith(
        expect.stringContaining(`✅ ${mockNoticeType} 새로운 공지사항 ID 저장 완료: INT-1`),
      );
    });

    it('공지사항 저장 실패 시 에러 로깅 후 reject 되어야 함', async () => {
      const runMock = jest
        .spyOn(service['databases'][mockNoticeType], 'run')
        .mockImplementation((query: string, params: any[], callback: Function) => {
          callback(new Error('저장 실패'));
          return {} as any;
        });

      await expect(
        service['saveNotice'](mockNoticeType, {
          id: 'INT-1',
          title: 'Title 1',
          link: 'https://example.com/1',
          date: '2025.02.22',
          writer: 'Writer 1',
          access: 'Access 1',
        }),
      ).rejects.toThrow('저장 실패');

      expect(loggerErrorMock).toHaveBeenCalledWith(
        expect.stringMatching(`🚨 ${mockNoticeType} SQLite 저장 중 오류 발생: 저장 실패`),
      );
    });
  });

  describe('getTodayDate()', () => {
    it('오늘 날짜를 YYYY.MM.DD 형식으로 반환해야 함', () => {
      const today = dayjs().format('YYYY.MM.DD');
      const result = service['getTodayDate']();
      expect(result).toBe(today);
    });
  });

  // ===============================================================
  // 6. 추가 경로 및 부가 로깅 테스트
  // ===============================================================
  describe('추가 경로 및 에러 상황 처리', () => {
    it('fetchAllNotices에서 반환된 noticeType에 대해 크롤링 루프가 정상적으로 동작해야 함', async () => {
      // SWUNIV에 대해서도 새로운 공지가 발견되는 경우 테스트
      jest.spyOn(mockMajorStyleNoticeScraperService, 'fetchAllNotices').mockResolvedValue({
        SWUNIV: [
          { id: 'SW-1', title: 'SW Title 1', link: 'https://example.com/3', date: '2025.02.22', writer: 'Writer1', access: 'Access1' },
          { id: 'SW-2', title: 'SW Title 2', link: 'https://example.com/4', date: '2025.02.22', writer: 'Writer2', access: 'Access2' },
        ],
      });
      jest
        .spyOn(service as any, 'filterNewNotices')
        .mockResolvedValue([
          { id: 'SW-2', title: 'SW Title 2', link: 'https://example.com/4', date: '2025.02.22' },
        ]);
      const saveSpy = jest.spyOn(service as any, 'saveNotice').mockResolvedValue(undefined);

      process.env.NODE_ENV = 'production';

      await service['executeCrawling']('추가 테스트');

      expect(sendMajorStyleNotificationMock).toHaveBeenCalledWith('SW Title 2', 'SWUNIV', {
        id: 'SW-2',
        link: 'https://example.com/4',
      });
      expect(saveSpy).toHaveBeenCalled();
      expect(service['cachedNoticeIds']['SWUNIV'].has('SW-2')).toBe(true);
      expect(loggerLogMock).toHaveBeenCalledWith(expect.stringContaining(`🏁 추가 테스트 정기 크롤링 끝!`));
    });

    it('deleteOldNotices() 내부 for문에서 예외가 발생할 경우 catch 블록이 실행되어 에러 로깅되어야 함', async () => {
      // 모든 DB 삭제 호출 시 reject하도록 모킹
      jest.spyOn(service as any, 'deleteNoticesExceptToday').mockRejectedValue(new Error('전체 삭제 실패'));

      await service['deleteOldNotices']('추가 삭제 테스트');

      expect(loggerErrorMock).toHaveBeenCalledWith(
        expect.stringMatching(`❌ 추가 삭제 테스트 오래된 공지사항 삭제 중 오류 발생: 전체 삭제 실패`),
      );
    });
  });
});