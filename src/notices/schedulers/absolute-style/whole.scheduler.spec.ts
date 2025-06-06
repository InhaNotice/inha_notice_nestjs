/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-18
 */

import { NotificationPayload } from 'src/interfaces/notification-payload.interface';
import { WholeScheduler } from './whole.scheduler';

class TestSchedulerService extends WholeScheduler {
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

describe('WholeNoticeSchedulerService', () => {
    let service: TestSchedulerService;

    describe.each([
        ['handleWeekDays', 'executeCrawling'],
        ['handleEvening', 'executeCrawling'],
        ['handleWeekend', 'executeCrawling'],
    ])('%s 메서드는', (method, spyTarget) => {
        let executeCrawlingMock: jest.SpyInstance;

        beforeEach(() => {
            service = new TestSchedulerService();
            executeCrawlingMock = jest
                .spyOn<any, any>(service, spyTarget)
                .mockImplementation();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it(`정상적으로 ${spyTarget} 메서드를 호출한다.`, async () => {
            await (service as any)[method]();
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
                writer: '관리자',
                access: '공개',
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