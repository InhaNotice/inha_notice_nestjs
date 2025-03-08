/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-03-08
 */

import * as fs from 'fs';
import { Notice } from 'src/notices/interfaces/notice.interface';
import { AbsoluteStyleNoticeSchedulerService } from 'src/notices/scheduler/absolute-style-notice-scheduler.service';
import * as sqlite3 from 'sqlite3';
import { IdentifierConstants } from 'src/constants/identifiers';
import * as dayjs from 'dayjs';

class TestSchedulerService extends AbsoluteStyleNoticeSchedulerService {
    constructor() {
        super();
        this.logger = {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
        } as any;
        this.databaseDirectory = 'test_databases';
        this.databases = {
            'TEST1': {
                run: jest.fn(),
                get: jest.fn(),
                all: jest.fn(),
            } as any,
        };
        this.cachedNoticeIds = {};
        this.scraperService = {
            getAllNoticeTypes: jest.fn().mockReturnValue(['TEST1', 'TEST2']),
            fetchAllNotices: jest.fn().mockResolvedValue({
                'TEST1': [{
                    id: 'KR-1',
                    title: 'noticeTitle1',
                    link: 'https://test.com/1',
                    date: '2025.01.01',
                    writer: 'writer1',
                    access: '1',
                }],
                'TEST2': [{
                    id: 'KR-2',
                    title: 'noticeTitle2',
                    link: 'https://test.com/2',
                    date: '2025.01.02',
                    writer: 'writer2',
                    access: '2',
                }],
            }),
        } as any;
    };

    async sendFirebaseMessaging(notice: Notice, noticeType: string): Promise<void> {
        return;
    }
}


describe('AbsoluteStyleNoticeSchedulerService', () => {
    let service: TestSchedulerService;

    describe('initializeDatabaseDirectory 메서드는', () => {
        beforeEach(async () => {
            service = new TestSchedulerService();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('디렉터리가 존재하지 않을 경우 fs.mkdirSync가 호출되어 디렉터리를 생성하는지 확인한다', () => {
            const existsSyncMock = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
            const mkdirSyncSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation();

            service['initializeDatabaseDirectory']();

            expect(existsSyncMock).toHaveBeenCalledWith(service['databaseDirectory']);
            expect(mkdirSyncSpy).toHaveBeenCalledWith(service['databaseDirectory'], { recursive: true });
        });

        it('디렉터리가 이미 존재하면 fs.mkdirSync를 호출하지 않는지 확인한다', () => {
            const existsSyncMock = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            const mkdirSyncSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation();

            service['initializeDatabaseDirectory']();

            expect(existsSyncMock).toHaveBeenCalledWith(service['databaseDirectory']);
            expect(mkdirSyncSpy).not.toHaveBeenCalledWith(service['databaseDirectory'], { recursive: true });
        });

        it('디렉터리가 존재하지 않으면, fs.mkdirSync를 호출할 때 에러를 발생한다.', () => {
            const existsSyncMock = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

            const errorMessage = 'fs.mkdirSync 호출 중 에러 발생';
            const mkdirSyncSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {
                throw new Error(errorMessage);
            });

            service['initializeDatabaseDirectory']();

            expect(existsSyncMock).toHaveBeenCalledWith(service['databaseDirectory']);
            expect(mkdirSyncSpy).toHaveBeenCalled();
            expect(service['logger'].error).toHaveBeenCalledWith(expect.stringContaining(`${errorMessage}`));
        });
    });

    describe('initializeDatabases 메서드는', () => {
        let initializeTableMock: jest.SpyInstance;

        beforeEach(async () => {
            service = new TestSchedulerService();
            initializeTableMock = jest.spyOn<any, any>(service, 'initializeTable').mockImplementation();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('DB 연결 및 테이블 초기화가 이루어진다.', () => {
            const sqliteMock = jest.spyOn(sqlite3, 'Database').mockImplementation((_: any, callback: any) => {
                callback(null);
                return {} as any;
            });
            const initializeTableMock = jest.spyOn<any, any>(service, 'initializeTable').mockImplementation();

            service['initializeDatabases']();

            expect(service['scraperService'].getAllNoticeTypes).toHaveBeenCalled();
            expect(sqliteMock).toHaveBeenCalled();
            // toBe는 참조값 비교이므로, toEqual를 사용해야함
            expect(service['databases']['TEST1']).toEqual({});
            expect(initializeTableMock).toHaveBeenCalledWith('TEST1');
            expect(service['databases']['TEST2']).toEqual({});
            expect(initializeTableMock).toHaveBeenCalledWith('TEST2');
        });

        it('DB 연결 시 에러가 발생한다.', () => {
            const errorMessage = 'DB 연결 실패';
            const sqliteMock = jest.spyOn(sqlite3, 'Database').mockImplementation((_: any, callback: any) => {
                callback(new Error(errorMessage));
                return {} as any;
            });

            service['initializeDatabases']();

            expect(service['scraperService'].getAllNoticeTypes).toHaveBeenCalled();
            expect(sqliteMock).toHaveBeenCalled();
            expect(initializeTableMock).not.toHaveBeenCalledWith('TEST1');
            expect(initializeTableMock).not.toHaveBeenCalledWith('TEST2');
            expect(service['logger'].error).toHaveBeenCalledWith(expect.stringContaining(`${errorMessage}`));
        });
    });

    describe('initializeTable 메서드는', () => {
        let loadCacheMock: jest.SpyInstance;

        beforeEach(async () => {
            service = new TestSchedulerService();
            loadCacheMock = jest.spyOn<any, any>(service, 'loadCache').mockImplementation();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('테이블 생성 쿼리 실행 및 캐시를 로드한다.', () => {
            const runMock = jest.spyOn(service['databases']['TEST1'], 'run').mockImplementation((_: any, callback: any) => {
                callback(null);
                return {} as any;
            });

            service['initializeTable']('TEST1');

            expect(runMock).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS notices'), expect.any(Function));
            expect(loadCacheMock).toHaveBeenCalledWith('TEST1');
        });

        it('테이블 생성 실패 시 에러 로깅이 실행된다.', () => {
            const errorMessage = '테이블 생성 실패';
            const runMock = jest.spyOn(service['databases']['TEST1'], 'run').mockImplementation((_: any, callback: any) => {
                callback(new Error(errorMessage));
                return {} as any;
            });

            service['initializeTable']('TEST1');

            expect(runMock).toHaveBeenCalled();
            expect(loadCacheMock).not.toHaveBeenCalled();
            expect(service['logger'].error).toHaveBeenCalledWith(expect.stringContaining(`${errorMessage}`));
        });
    });


    describe('loadCache 메서드는', () => {
        beforeEach(async () => {
            service = new TestSchedulerService();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('테이블 확인 중 에러를 발생시킨다.', () => {
            const errorMessage = 'SQLite 테이블 확인 중 에러 발생';
            const getMock = jest.spyOn(service['databases']['TEST1'], 'get').mockImplementation((_: any, callback: any) => {
                callback(new Error(errorMessage), null);
                return {} as any;
            });

            service['loadCache']('TEST1');

            expect(getMock).toHaveBeenCalledWith(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='notices'",
                expect.any(Function)
            );
            expect(service['logger'].error).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
        });

        it('notices 테이블이 존재하지 않아 캐시를 로드하지 않는다.', () => {
            const getMock = jest.spyOn(service['databases']['TEST1'], 'get').mockImplementation((_: any, callback: any) => {
                callback(null, null);
                return {} as any;
            });

            service['loadCache']('TEST1');

            expect(getMock).toHaveBeenCalledWith(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='notices'",
                expect.any(Function)
            )
            expect(service['logger'].warn).toHaveBeenCalledWith(expect.stringContaining('notices 테이블이 존재하지 않아 캐시를 로드하지 않습니다.'));
        });

        it('notices 테이블이 존재하고, 캐시 로드 중 에러를 발생시킨다.', () => {
            const getMock = jest.spyOn(service['databases']['TEST1'], 'get').mockImplementation((_: any, callback: any) => {
                callback(null, {});
                return {} as any;
            });
            const errorMessage = '캐시 로드 중 에러 발생';
            const allMock = jest.spyOn(service['databases']['TEST1'], 'all').mockImplementation((_: any, _params: any, callback: any) => {
                callback(new Error(errorMessage), null);
                return {} as any;
            });

            service['loadCache']('TEST1');

            expect(getMock).toHaveBeenCalledWith(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='notices'",
                expect.any(Function)
            );
            expect(allMock).toHaveBeenCalledWith(
                "SELECT id FROM notices",
                [],
                expect.any(Function)
            );
            expect(service['logger'].error).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
        });

        it('notices 테이블이 존재하고, 캐시 로드하여 공지사항 ID를 캐싱한다.', () => {
            const getMock = jest.spyOn(service['databases']['TEST1'], 'get').mockImplementation((_: any, callback: any) => {
                callback(null, {});
                return {} as any;
            });
            const allMock = jest.spyOn(service['databases']['TEST1'], 'all').mockImplementation((_: any, _params: any, callback: any) => {
                callback(null, [
                    {
                        id: 'KR-1'
                    }
                ]);
                return {} as any;
            });

            service['loadCache']('TEST1');

            expect(getMock).toHaveBeenCalledWith(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='notices'",
                expect.any(Function)
            );
            expect(allMock).toHaveBeenCalledWith(
                "SELECT id FROM notices",
                [],
                expect.any(Function)
            );
            expect(service['cachedNoticeIds']['TEST1'].has('KR-1')).toBe(true);
            expect(service['cachedNoticeIds']['TEST1']).toEqual(new Set().add('KR-1'))
        });
    });

    describe('executeCrawling 메서드는', () => {
        let filterNewNoticesMock: jest.SpyInstance;
        let sendFirebaseMessagingMock: jest.SpyInstance;
        let saveNoticeMock: jest.SpyInstance;

        beforeEach(async () => {
            service = new TestSchedulerService();

            sendFirebaseMessagingMock = jest.spyOn<any, any>(service, 'sendFirebaseMessaging').mockImplementation();
            saveNoticeMock = jest.spyOn<any, any>(service, 'saveNotice').mockImplementation();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('배포환경에서 새로운 공지가 있을 때, 정상적으로 알림을 보내고 공지를 저장한다.', async () => {
            const logPrefixMock = '정기 크롤링';
            process.env.NODE_ENV = IdentifierConstants.kProduction;
            filterNewNoticesMock = jest.spyOn<any, any>(service, 'filterNewNotices').mockReturnValue([
                {
                    'id': 'KR-1',
                    'title': 'noticeTitle1',
                    'link': 'https://test.com/1',
                    'date': '2025.01.01',
                    'writer': 'writer1',
                    'access': '1',
                }
            ]);

            await service['executeCrawling'](logPrefixMock);

            expect(service['scraperService'].fetchAllNotices).toHaveBeenCalled();
            expect(filterNewNoticesMock).toHaveBeenCalled();
            expect(service['logger'].log).toHaveBeenCalledWith(expect.stringContaining('새로운 공지 발견'));
            expect(sendFirebaseMessagingMock).toHaveBeenCalled();
            expect(saveNoticeMock).toHaveBeenCalled();
        });

        it('배포환경에서 새로운 공지가 없으면, 알림을 보내지 않고 공지를 저장하지 않는다.', async () => {
            const logPrefixMock = '정기 크롤링';
            process.env.NODE_ENV = IdentifierConstants.kProduction;
            filterNewNoticesMock = jest.spyOn<any, any>(service, 'filterNewNotices').mockReturnValue([]);

            await service['executeCrawling'](logPrefixMock);

            expect(service['scraperService'].fetchAllNotices).toHaveBeenCalled();
            expect(filterNewNoticesMock).toHaveBeenCalled();
            expect(service['logger'].log).not.toHaveBeenCalledWith(expect.stringContaining('새로운 공지 발견'));
            expect(sendFirebaseMessagingMock).not.toHaveBeenCalled();
            expect(saveNoticeMock).not.toHaveBeenCalled();
        });

        it('개발환경에서 새로운 공지를 발견해도, 알림을 보내지 않지만 공지는 저장된다.', async () => {
            const logPrefixMock = '정기 크롤링';
            process.env.NODE_ENV = 'development';
            filterNewNoticesMock = jest.spyOn<any, any>(service, 'filterNewNotices').mockReturnValue([
                {
                    'id': 'KR-1',
                    'title': 'noticeTitle1',
                    'link': 'https://test.com/1',
                    'date': '2025.01.01',
                    'writer': 'writer1',
                    'access': '1',
                }
            ]);

            await service['executeCrawling'](logPrefixMock);

            expect(service['scraperService'].fetchAllNotices).toHaveBeenCalled();
            expect(filterNewNoticesMock).toHaveBeenCalled();
            expect(service['logger'].log).toHaveBeenCalledWith(expect.stringContaining('새로운 공지 발견'));
            expect(service['logger'].debug).toHaveBeenCalledWith(expect.stringContaining('개발 환경이므로'));
            expect(sendFirebaseMessagingMock).not.toHaveBeenCalled();
            expect(saveNoticeMock).toHaveBeenCalled();
        });

        it('개발환경에서 크롤링 에러 발생시, 이에 맞는 로깅이 실행되어야한다.', async () => {
            const logPrefixMock = '정기 크롤링';
            const errorMessage = '크롤링 에러 발생';
            process.env.NODE_ENV = IdentifierConstants.kProduction;
            jest.spyOn<any, any>(service['scraperService'], 'fetchAllNotices').mockRejectedValue(
                new Error(errorMessage)
            );

            await service['executeCrawling'](logPrefixMock);

            expect(service['scraperService'].fetchAllNotices).toHaveBeenCalled();
            expect(service['logger'].error).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
        });

        it('개발환경에서 크롤링 에러 발생시, 이에 맞는 로깅이 실행되어야한다.', async () => {
            const logPrefixMock = '정기 크롤링';
            const errorMessage = '크롤링 에러 발생';
            process.env.NODE_ENV = 'production';
            jest.spyOn<any, any>(service['scraperService'], 'fetchAllNotices').mockRejectedValue(
                new Error(errorMessage)
            );

            await service['executeCrawling'](logPrefixMock);

            expect(service['scraperService'].fetchAllNotices).toHaveBeenCalled();
            expect(service['logger'].error).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
        });
    });

    describe('deleteOldNotices 메서드는', () => {
        let getTodayDateMock: jest.SpyInstance;
        let deleteNoticesExceptTodayMock: jest.SpyInstance;

        beforeEach(async () => {
            service = new TestSchedulerService();

            getTodayDateMock = jest.spyOn<any, any>(service, 'getTodayDate').mockReturnValue('2025.01.01');
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('오늘날짜가 아닌 공지 삭제가 정상적으로 이루어진다.', async () => {
            const logPrefixMock = '정기 삭제';
            deleteNoticesExceptTodayMock = jest.spyOn<any, any>(service, 'deleteNoticesExceptToday').mockImplementation();

            await service['deleteOldNotices'](logPrefixMock);

            expect(getTodayDateMock).toHaveBeenCalled();
            expect(deleteNoticesExceptTodayMock).toHaveBeenCalledWith('TEST1', '2025.01.01');
            expect(service['logger'].log).toHaveBeenCalledWith(expect.stringContaining('삭제 완료'));
        })

        it('오늘날짜가 아닌 공지 삭제 중 에러가 발생한다.', async () => {
            const logPrefixMock = '정기 삭제';
            const errorMessage = '삭제 실패';
            deleteNoticesExceptTodayMock = jest.spyOn<any, any>(service, 'deleteNoticesExceptToday').mockRejectedValue(
                new Error(errorMessage)
            );

            await service['deleteOldNotices'](logPrefixMock);

            expect(getTodayDateMock).toHaveBeenCalled();
            expect(deleteNoticesExceptTodayMock).toHaveBeenCalled();
            expect(service['logger'].error).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
        });
    });

    describe('deleteNoticesExceptToday 메서드는', () => {
        let loadCacheMock: jest.SpyInstance;

        beforeEach(async () => {
            service = new TestSchedulerService();
            loadCacheMock = jest.spyOn<any, any>(service, 'loadCache').mockImplementation();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('오래된 공지 삭제에 실패한다.', async () => {
            const errorMessage = '공지 삭제 실패';
            const runMock = jest.spyOn(service['databases']['TEST1'], 'run').mockImplementation((_: any, _params: any, callback: any) => {
                callback(new Error(errorMessage), null);
                return {} as any;
            });

            await expect(service['deleteNoticesExceptToday']('TEST1', '2025.01.01')).rejects.toThrow(errorMessage);

            expect(runMock).toHaveBeenCalledWith(`DELETE FROM notices WHERE date != ?`, ['2025.01.01'], expect.any(Function));
            expect(service['logger'].error).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
        });

        it('오래된 공지 삭제 후 캐싱 업데이트', async () => {
            const runMock = jest.spyOn(service['databases']['TEST1'], 'run').mockImplementation((_: any, _params: any, callback: any) => {
                callback(null, null);
                return {} as any;
            });

            await service['deleteNoticesExceptToday']('TEST1', '2025.01.01');

            expect(runMock).toHaveBeenCalledWith(`DELETE FROM notices WHERE date != ?`, ['2025.01.01'], expect.any(Function));
            expect(service['logger'].log).toHaveBeenCalledWith(expect.stringContaining('공지사항 삭제 완료'));
            expect(loadCacheMock).toHaveBeenCalled();
        });
    });

    describe('filterNewNotices 메서드는', () => {
        let getTodayDateMock: jest.SpyInstance;

        beforeEach(async () => {
            service = new TestSchedulerService();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('추가된 적 없는 공지를 구별해서 리턴한다.', () => {
            const noticesMock: Notice[] = [{
                id: 'KR-1',
                title: 'title',
                link: 'https://example.com',
                date: '2025.01.01',
                writer: 'writer',
                access: 'access',
            },
            {
                id: 'KR-2',
                title: 'title',
                link: 'https://example.com',
                date: '2025.01.01',
                writer: 'writer',
                access: 'access',
            },
            {
                id: 'KR-3',
                title: 'title',
                link: 'https://example.com',
                date: '2025.01.01',
                writer: 'writer',
                access: 'access',
            }];
            getTodayDateMock = jest.spyOn<any, any>(service, 'getTodayDate').mockReturnValue('2025.01.01');

            service['cachedNoticeIds']['TEST1'] = new Set();

            expect(service['filterNewNotices']('TEST1', noticesMock)).toEqual(noticesMock);
            expect(getTodayDateMock).toHaveBeenCalled();
        });

        it('이미 추가된 공지를 구별해서 리턴한다.', () => {
            const noticesMock: Notice[] = [{
                id: 'KR-1',
                title: 'title',
                link: 'https://example.com',
                date: '2025.01.01',
                writer: 'writer',
                access: 'access',
            },
            {
                id: 'KR-2',
                title: 'title',
                link: 'https://example.com',
                date: '2025.01.01',
                writer: 'writer',
                access: 'access',
            },
            {
                id: 'KR-3',
                title: 'title',
                link: 'https://example.com',
                date: '2025.01.01',
                writer: 'writer',
                access: 'access',
            }];
            getTodayDateMock = jest.spyOn<any, any>(service, 'getTodayDate').mockReturnValue('2025.01.01');

            service['cachedNoticeIds']['TEST1'] = new Set();
            service['cachedNoticeIds']['TEST1'].add('KR-1');
            service['cachedNoticeIds']['TEST1'].add('KR-2');

            expect(service['filterNewNotices']('TEST1', noticesMock)).toEqual([
                {
                    id: 'KR-3',
                    title: 'title',
                    link: 'https://example.com',
                    date: '2025.01.01',
                    writer: 'writer',
                    access: 'access',
                }
            ]);
            expect(getTodayDateMock).toHaveBeenCalled();
        });

        it('추가된 적 없는 공지에 대해서, 오늘 날짜를 구별해서 리턴한다.', () => {
            const noticesMock: Notice[] = [{
                id: 'KR-1',
                title: 'title',
                link: 'https://example.com',
                date: '2025.01.01',
                writer: 'writer',
                access: 'access',
            },
            {
                id: 'KR-2',
                title: 'title',
                link: 'https://example.com',
                date: '2025.01.01',
                writer: 'writer',
                access: 'access',
            },
            {
                id: 'KR-3',
                title: 'title',
                link: 'https://example.com',
                date: '2025.01.01',
                writer: 'writer',
                access: 'access',
            }];
            getTodayDateMock = jest.spyOn<any, any>(service, 'getTodayDate').mockReturnValue('2025.01.02');

            service['cachedNoticeIds']['TEST1'] = new Set();

            expect(service['filterNewNotices']('TEST1', noticesMock)).toEqual([]);
            expect(getTodayDateMock).toHaveBeenCalled();
        });
    });

    describe('saveNotice 메서드는', () => {
        beforeEach(async () => {
            service = new TestSchedulerService();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('SQLite 저장 중 오류가 발생한다.', async () => {
            const errorMessage = 'SQLite 저장 실패';
            const runMock = jest.spyOn(service['databases']['TEST1'], 'run').mockImplementation((_: any, _params: any, callback: any) => {
                callback(new Error(errorMessage), null);
                return {} as any;
            });
            const noticeMock: Notice = {
                id: 'KR-1',
                title: 'title',
                link: 'https://example.com',
                date: '2025.01.01',
                writer: 'writer',
                access: 'access',
            };

            await expect(service['saveNotice']('TEST1', noticeMock)).rejects.toThrow(errorMessage);

            expect(runMock).toHaveBeenCalledWith(
                "INSERT OR IGNORE INTO notices (id, title, link, date) VALUES (?, ?, ?, ?)",
                [noticeMock.id, noticeMock.title, noticeMock.link, noticeMock.date],
                expect.any(Function));
            expect(service['logger'].error).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
        });

        it('새로운 공지 저장 완료', async () => {
            const runMock = jest.spyOn(service['databases']['TEST1'], 'run').mockImplementation((_: any, _params: any, callback: any) => {
                callback(null, null);
                return {} as any;
            });
            const noticeMock: Notice = {
                id: 'KR-1',
                title: 'title',
                link: 'https://example.com',
                date: '2025.01.01',
                writer: 'writer',
                access: 'access',
            };

            await service['saveNotice']('TEST1', noticeMock);

            expect(runMock).toHaveBeenCalledWith(
                "INSERT OR IGNORE INTO notices (id, title, link, date) VALUES (?, ?, ?, ?)",
                [noticeMock.id, noticeMock.title, noticeMock.link, noticeMock.date],
                expect.any(Function));
            expect(service['logger'].log).toHaveBeenCalledWith(expect.stringContaining('새로운 공지사항 ID 저장 완료'));
        });
    });

    describe('getTodayDate 메서드는', () => {
        let dayjsMock: jest.SpyInstance;

        beforeEach(async () => {
            service = new TestSchedulerService();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('오늘 날짜를 YYYY.MM.DD 형식으로 반환한다.', () => {
            dayjsMock = jest.spyOn(dayjs.prototype, 'format').mockReturnValue('2025.01.01');

            expect(service['getTodayDate']()).toEqual('2025.01.01');
            expect(dayjsMock).toHaveBeenCalledWith('YYYY.MM.DD');
        });
    });
});