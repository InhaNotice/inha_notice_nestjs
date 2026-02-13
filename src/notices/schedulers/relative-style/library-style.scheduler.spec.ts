/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2026-01-30
 */

import { NotificationPayload } from 'src/interfaces/notification-payload.interface';
import { LibraryStyleScheduler } from 'src/notices/schedulers/relative-style/library-style.scheduler';

class TestSchedulerService extends LibraryStyleScheduler {
    constructor() {
        const mockFirebaseService = {
            sendNotificationToTopic: jest.fn(),
        } as any;

        const mockScraperService = {
            getAllNoticeTypes: jest.fn().mockReturnValue(['TEST']),
            scrape: jest.fn().mockResolvedValue([]),
        } as any;

        super(mockFirebaseService, mockScraperService);
    }

    protected initializeDatabaseDirectory(): void { }
    protected initializeDatabases(): void { }
}

describe('MajorNoticeScheduler', () => {
    let service: TestSchedulerService;

    describe('handleWeekDays 메서드는', () => {
        let executeCrawlingMock: jest.SpyInstance;

        beforeEach(() => {
            service = new TestSchedulerService();
            executeCrawlingMock = jest
                .spyOn<any, any>(service, 'executeCrawling')
                .mockImplementation();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('정상적으로 executeCrawling 메서드를 호출한다.', async () => {
            await service['handleWeekDays']();
            expect(executeCrawlingMock).toHaveBeenCalled();
        });
    });

    describe('handleDelete 메서드는', () => {
        let deleteOldNoticesMock: jest.SpyInstance;

        beforeEach(() => {
            service = new TestSchedulerService();
            deleteOldNoticesMock = jest
                .spyOn<any, any>(service, 'deleteOldNotices')
                .mockImplementation();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('정상적으로 deleteOldNotices 메서드를 호출한다.', async () => {
            await service['handleDelete']();
            expect(deleteOldNoticesMock).toHaveBeenCalled();
        });
    });

    describe('sendFirebaseMessaging 메서드는', () => {
        let sendNotificationToTopicMock: jest.SpyInstance;
        let buildFirebaseMessagePayloadMock: jest.SpyInstance;

        beforeEach(() => {
            service = new TestSchedulerService();
            sendNotificationToTopicMock = jest
                .spyOn<any, any>(service['firebaseService'], 'sendNotificationToTopic')
                .mockResolvedValue(undefined);
            buildFirebaseMessagePayloadMock = jest
                .spyOn<any, any>(service, 'buildFirebaseMessagePayload')
                .mockReturnValue({
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
                },
            );
        });
    });
});