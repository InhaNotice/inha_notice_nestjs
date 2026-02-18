/*
 * This is file of the project inha_notice
 * Licensed under the MIT License.
 * Copyright (c) 2025-2026 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2026-02-18
 */

import { NotificationPayload } from 'src/interfaces/notification-payload.interface';
import { UndergraduateScheduler } from 'src/calendar/schedulers/undergraduate.scheduler';
import * as fs from 'fs';

class TestSchedulerService extends UndergraduateScheduler {
    constructor() {
        const mockFirebaseService = {
            sendNotificationToTopic: jest.fn(),
        } as any;

        const mockConfigService = {
            get: jest.fn(),
        } as any;

        super(mockFirebaseService, mockConfigService);
        this.logger = {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
        } as any;
    }

    protected initializeDatabaseDirectory(): void { }
    protected initializeDatabases(): void { }
}

describe('UndergraduateScheduler', () => {
    let service: TestSchedulerService;

    describe('handleDayBeforeReminder 메서드는', () => {
        let handleRemiderMock: jest.SpyInstance;

        beforeEach(async () => {
            service = new TestSchedulerService();
            handleRemiderMock = jest.spyOn<any, any>(service, 'handleReminder').mockImplementation();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('정상적으로 handleReminder 메서드를 호출한다.', async () => {
            await service['handleDayBeforeReminder']();
            expect(handleRemiderMock).toHaveBeenCalled();
        });
    });

    describe('handleTodayReminder 메서드는', () => {
        let handleRemiderMock: jest.SpyInstance;

        beforeEach(async () => {
            service = new TestSchedulerService();
            handleRemiderMock = jest.spyOn<any, any>(service, 'handleReminder').mockImplementation();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('정상적으로 handleReminder 메서드를 호출한다.', async () => {
            await service['handleTodayReminder']();
            expect(handleRemiderMock).toHaveBeenCalled();
        });
    });

    describe('handleReminder 메서드는', () => {
        let sendFirebaseMessagingMock: jest.SpyInstance;

        beforeEach(() => {
            service = new TestSchedulerService();

            sendFirebaseMessagingMock = jest
                .spyOn<any, any>(service, 'sendFirebaseMessaging')
                .mockResolvedValue(undefined);

            jest.spyOn(fs.promises, 'readFile')
                .mockResolvedValue(
                    JSON.stringify({
                        'May': [
                            {
                                title: '학사 안내',
                                startDate: '2025-05-18',
                                note: '',
                                color: '',
                            },
                        ],
                    })
                );

            jest.spyOn<any, any>(service['configService'], 'get')
                .mockReturnValue({
                    INHA_CALENDAR: 'https://inha.ac.kr/calendar',
                });
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('일치하는 일정이 있는 경우 sendFirebaseMessaging을 호출한다.', async () => {
            const logPrefixMock = 'logPrefixMock';
            const targetDate = '2025-05-18';
            const topic = 'undergraduate-schedule-d1-notification';

            await service['handleReminder'](logPrefixMock, targetDate, topic);

            expect(sendFirebaseMessagingMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: '학사 안내',
                    date: '2025-05-18',
                    link: 'https://inha.ac.kr/calendar',
                }),
                topic
            );
        });

        it('일치하는 일정이 없는 경우 sendFirebaseMessaging을 호출하지 않는다.', async () => {
            const logPrefixMock = 'logPrefixMock';
            const targetDate = '2025-05-19';
            const topic = 'undergraduate-schedule-d1-notification';

            await service['handleReminder'](logPrefixMock, targetDate, topic);

            expect(sendFirebaseMessagingMock).not.toHaveBeenCalled();
        });
    });

    describe('getShortTimestampId 메서드는', () => {
        let fixedTime: string;

        beforeEach(() => {
            service = new TestSchedulerService();
            fixedTime = '1716000000000';
            jest.spyOn<any, any>(Date.prototype, 'getTime').mockReturnValue(fixedTime);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('정상적으로 NotificationPayload의 id를 반환한다.', () => {
            const id: string = service['getShortTimestampId']();

            expect(id).toBe('17160');
        });
    });

    describe('sendFirebaseMessaging 메서드는', () => {
        let sendNotificationToTopicMock: jest.SpyInstance;
        let buildFirebaseMessagePayloadMock: jest.SpyInstance;

        beforeEach(() => {
            service = new TestSchedulerService();
            sendNotificationToTopicMock = jest.spyOn<any, any>(service['firebaseService'], 'sendNotificationToTopic').mockResolvedValue(undefined);
            buildFirebaseMessagePayloadMock = jest.spyOn<any, any>(service, 'buildFirebaseMessagePayload').mockReturnValue(
                {
                    title: 'Test Title',
                    body: 'Test Body',
                    data: {
                        id: 'TEST_ID',
                        link: 'https://example.com',
                        date: '2025-01-01',
                    },
                });
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('FirebaseService의 sendNotificationToTopic을 호출한다.', async () => {
            const noticeMock: NotificationPayload = {
                id: 'TEST_ID',
                title: '공지 제목',
                link: 'https://example.com',
                date: '2025-01-01',
            };

            await service.sendFirebaseMessaging(noticeMock, 'TEST_TOPIC');

            expect(buildFirebaseMessagePayloadMock).toHaveReturnedWith({
                title: 'Test Title',
                body: 'Test Body',
                data: {
                    id: 'TEST_ID',
                    link: 'https://example.com',
                    date: '2025-01-01',
                },
            });
            expect(sendNotificationToTopicMock).toHaveBeenCalledWith(
                'TEST_TOPIC',
                'Test Title',
                'Test Body',
                {
                    id: 'TEST_ID',
                    link: 'https://example.com',
                    date: '2025-01-01',
                }
            );
        });
    });
});

/*
 PASS  src/calendar/schedulers/undergraduate.scheduler.spec.ts
  UndergraduateScheduler
    handleDayBeforeReminder 메서드는
      ✓ 정상적으로 handleReminder 메서드를 호출한다. (2 ms)
    handleTodayReminder 메서드는
      ✓ 정상적으로 handleReminder 메서드를 호출한다.
    handleReminder 메서드는
      ✓ 일치하는 일정이 있는 경우 sendFirebaseMessaging을 호출한다. (1 ms)
      ✓ 일치하는 일정이 없는 경우 sendFirebaseMessaging을 호출하지 않는다.
    getShortTimestampId 메서드는
      ✓ 정상적으로 NotificationPayload의 id를 반환한다.
    sendFirebaseMessaging 메서드는
      ✓ FirebaseService의 sendNotificationToTopic을 호출한다. (1 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        1.086 s, estimated 2 s
*/