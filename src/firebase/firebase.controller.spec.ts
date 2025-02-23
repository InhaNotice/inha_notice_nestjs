/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-02-23
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseController } from 'src/firebase/firebase.controller';
import { FirebaseService } from 'src/firebase/firebase.service';

describe('FirebaseController', () => {
    let controller: FirebaseController;
    let firebaseService: FirebaseService;

    // FirebaseService를 모킹
    const mockFirebaseService = {
        sendNotificationToDevice: jest.fn(),
        sendMajorNotification: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [FirebaseController],
            providers: [
                {
                    provide: FirebaseService,
                    useValue: mockFirebaseService,
                },
            ],
        }).compile();

        controller = module.get<FirebaseController>(FirebaseController);
        firebaseService = module.get<FirebaseService>(FirebaseService);
        jest.clearAllMocks();
    });

    describe('sendNotification (POST /notifications/send-to-device)', () => {
        it('특정 디바이스로 알림 전송 요청 시, FirebaseService.sendNotificationToDevice가 올바른 파라미터로 호출되어야 한다', async () => {
            const body = {
                token: 'dummyToken',
                noticeTitle: 'Test Device Notice',
                data: { id: 'major123', link: 'https://example.com' },
            };

            await controller.sendNotification(body);

            expect(firebaseService.sendNotificationToDevice).toHaveBeenCalledWith(
                body.token,
                body.noticeTitle,
                body.data,
            );
        });

        it('FirebaseService.sendNotificationToDevice 호출 중 에러가 발생하면 해당 에러가 전파되어야 한다', async () => {
            const body = {
                token: 'dummyToken',
                noticeTitle: 'Test Device Notice',
                data: { id: 'major123', link: 'https://example.com' },
            };
            const error = new Error('Send failed');
            (firebaseService.sendNotificationToDevice as jest.Mock).mockRejectedValue(error);

            await expect(controller.sendNotification(body)).rejects.toThrow(error);
        });
    });

    describe('sendNotificationToAll (POST /notifications/send-to-major)', () => {
        it('학과 전체 알림 전송 요청 시, FirebaseService.sendMajorNotification이 올바른 파라미터로 호출되어야 한다', async () => {
            const body = {
                topic: 'CS',
                noticeTitle: 'Test Major Notice',
                data: { id: 'major123', link: 'https://example.com' },
            };

            await controller.sendNotificationToAll(body);

            expect(firebaseService.sendMajorNotification).toHaveBeenCalledWith(
                body.noticeTitle,
                body.topic,
                body.data,
            );
        });

        it('FirebaseService.sendMajorNotification 호출 중 에러가 발생하면 해당 에러가 전파되어야 한다', async () => {
            const body = {
                topic: 'CS',
                noticeTitle: 'Test Major Notice',
                data: { id: 'major123', link: 'https://example.com' },
            };
            const error = new Error('Major send failed');
            (firebaseService.sendMajorNotification as jest.Mock).mockRejectedValue(error);

            await expect(controller.sendNotificationToAll(body)).rejects.toThrow(error);
        });
    });
});