/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-16
 */

import { FirebaseService } from 'src/firebase/firebase.service';
import { IDENTIFIER_CONSTANT } from 'src/constants/identifiers/identifier.constant';

describe('FirebaseService', () => {
    let service: FirebaseService;
    let firebaseAdminMock: any;
    let messagingMock: any;

    describe('sendNotificationToDevice 메서드는', () => {
        let tokenMock: string;
        const noticeTitleMock: string = 'noticeTitle';

        beforeEach(() => {
            messagingMock = {
                send: jest.fn().mockImplementation()
            };
            firebaseAdminMock = {
                messaging: jest.fn().mockReturnValue(messagingMock),
            };
            service = new FirebaseService(firebaseAdminMock);

            tokenMock = 'tokenMock';
            jest.spyOn(FirebaseService['logger'], 'log').mockImplementation();
            jest.spyOn(FirebaseService['logger'], 'debug').mockImplementation();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('배포환경에서 FCM 알림이 전송된다.', async () => {
            process.env.NODE_ENV = IDENTIFIER_CONSTANT.kProduction;
            const dataMock: Record<string, string> = {};
            const expectMessage = {
                notification: {
                    title: '새로운 공지사항이 있어요!',
                    body: noticeTitleMock
                },
                data: dataMock,
                token: tokenMock,
                android: {
                    priority: 'high',
                },
            };

            await service.sendNotificationToDevice(tokenMock, noticeTitleMock, dataMock);

            expect(firebaseAdminMock.messaging).toHaveBeenCalled();
            expect(messagingMock.send).toHaveBeenCalledWith(expectMessage);
            expect(FirebaseService['logger'].log).toHaveBeenCalledWith(expect.stringContaining(`🔔 ${tokenMock}`));
        });

        it('개발환경에서 FCM 알림이 전송되지 않는다.', async () => {
            process.env.NODE_ENV = IDENTIFIER_CONSTANT.kDevelopment;
            const dataMock: Record<string, string> = {};

            await service.sendNotificationToDevice(tokenMock, noticeTitleMock, dataMock);

            expect(firebaseAdminMock.messaging).not.toHaveBeenCalled();
            expect(messagingMock.send).not.toHaveBeenCalled();
            expect(FirebaseService['logger'].debug).toHaveBeenCalledWith(expect.stringContaining(`🔕 ${tokenMock}`))
        });
    });

    describe('sendNotificationToTopic 메서드는', () => {
        const topicMock = 'TEST_TOPIC';
        const notificationTitleMock = '공지 제목';
        const notificationBodyMock = '공지 내용';
        const dateMock = '2025-05-18';
        const dataMock = { date: dateMock };

        beforeEach(() => {
            messagingMock = {
                send: jest.fn().mockImplementation(),
            };
            firebaseAdminMock = {
                messaging: jest.fn().mockReturnValue(messagingMock),
            };
            service = new FirebaseService(firebaseAdminMock);

            jest.spyOn(FirebaseService['logger'], 'log').mockImplementation();
            jest.spyOn(FirebaseService['logger'], 'debug').mockImplementation();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('배포환경에서 FCM 알림이 전송된다.', async () => {
            process.env.NODE_ENV = IDENTIFIER_CONSTANT.kProduction;

            const expectedMessage = {
                notification: {
                    title: notificationTitleMock,
                    body: notificationBodyMock,
                },
                data: dataMock,
                topic: topicMock,
                android: {
                    priority: 'high',
                },
            };

            await service.sendNotificationToTopic(topicMock, notificationTitleMock, notificationBodyMock, dataMock);

            expect(firebaseAdminMock.messaging).toHaveBeenCalled();
            expect(messagingMock.send).toHaveBeenCalledWith(expectedMessage);
            expect(FirebaseService['logger'].log).toHaveBeenCalledWith(
                expect.stringContaining(`🔔 ${topicMock}`)
            );
        });

        it('개발환경에서 FCM 알림이 전송되지 않는다.', async () => {
            process.env.NODE_ENV = IDENTIFIER_CONSTANT.kDevelopment;

            await service.sendNotificationToTopic(topicMock, notificationTitleMock, notificationBodyMock, dataMock);

            expect(firebaseAdminMock.messaging).not.toHaveBeenCalled();
            expect(messagingMock.send).not.toHaveBeenCalled();
            expect(FirebaseService['logger'].debug).toHaveBeenCalledWith(
                expect.stringContaining(`🔕 ${topicMock}`)
            );
        });
    });
});
/*
 PASS  src/firebase/firebase.service.spec.ts
  FirebaseService
    sendNotificationToDevice 메서드는
      ✓ 배포환경에서 FCM 알림이 전송된다. (2 ms)
      ✓ 개발환경에서 FCM 알림이 전송되지 않는다. (1 ms)
    sendNotificationToTopic 메서드는
      ✓ 배포환경에서 FCM 알림이 전송된다.
      ✓ 개발환경에서 FCM 알림이 전송되지 않는다.

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        1.074 s
*/