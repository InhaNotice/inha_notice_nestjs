/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-03-08
 */

import { FirebaseService } from 'src/firebase/firebase.service';
import { IdentifierConstants } from 'src/constants/identifiers';

describe('FirebaseService', () => {
    let service: FirebaseService;
    let firebaseAdminMock: any;
    let messagingMock: any;

    const noticeTitle: string = 'noticeTitle';
    const notificationTitleMock: string = 'notificationTitle';
    const notificationBodyMock: string = 'notificationBody';

    describe('sendNotificationToDevice 메서드는', () => {
        let tokenMock: string;

        beforeEach(() => {
            messagingMock = {
                send: jest.fn().mockImplementation()
            };
            firebaseAdminMock = {
                messaging: jest.fn().mockReturnValue(messagingMock),
            };
            service = new FirebaseService(firebaseAdminMock);

            tokenMock = 'tokenMock';
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('배포환경에서 FCM 알림이 전송된다.', async () => {
            process.env.NODE_ENV = IdentifierConstants.kProduction;
            const dataMock: Record<string, string> = {};
            const expectMessage = {
            }

            await service.sendNotificationToDevice(tokenMock, noticeTitle, dataMock);

            expect(firebaseAdminMock.messaging).toHaveBeenCalled();
            expect(messagingMock.send).toHaveBeenCalledWith(expectMessage);
        });
    });
});