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
import { majorMappings } from 'src/firebase/mappings/major-mappings';
import { majorStyleMappings } from 'src/firebase/mappings/major-style-mappings';

describe('FirebaseService', () => {
    let service: FirebaseService;
    let firebaseAdminMock: any;
    let messagingMock: any;
    let loggerLogSpy: jest.SpyInstance;
    let loggerDebugSpy: jest.SpyInstance;
    let loggerErrorSpy: jest.SpyInstance;

    // 임시 메시지 응답 값
    const fakeResponse = 'fakeResponse123';

    beforeEach(() => {
        // 기본적으로 production 환경으로 설정
        process.env.NODE_ENV = 'production';

        // messaging() 메서드와 send()를 모킹
        messagingMock = {
            send: jest.fn().mockResolvedValue(fakeResponse),
        };

        firebaseAdminMock = {
            messaging: jest.fn().mockReturnValue(messagingMock),
        };

        // FirebaseService 생성 (생성자에 주입)
        service = new FirebaseService(firebaseAdminMock);

        // static logger에 대한 스파이 설정
        loggerLogSpy = jest.spyOn(FirebaseService['logger'], 'log').mockImplementation(() => { });
        loggerDebugSpy = jest.spyOn(FirebaseService['logger'], 'debug').mockImplementation(() => { });
        loggerErrorSpy = jest.spyOn(FirebaseService['logger'], 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // ============================================================================
    // sendNotificationToDevice 테스트
    // ============================================================================
    describe('sendNotificationToDevice', () => {
        const token = 'dummyToken';
        const noticeTitle = 'Test Device Notice';

        it('프로덕션 환경에서 정상 호출 시, firebaseAdmin.messaging().send가 호출되고 성공 로그가 남아야 함', async () => {
            process.env.NODE_ENV = IdentifierConstants.kProduction;
            const sampleData = { id: 'device123', link: 'https://example.com/1' };
            await service.sendNotificationToDevice(token, noticeTitle, sampleData);

            const expectedMessage = {
                token,
                notification: {
                    title: "[인하공지] 새로운 공지사항이 있습니다!",
                    body: noticeTitle,
                },
                data: sampleData,
                "android": {
                    "priority": "high",
                },
            };

            expect(firebaseAdminMock.messaging).toHaveBeenCalled();
            expect(messagingMock.send).toHaveBeenCalledWith(expectedMessage);

            // 데이터의 id가 있으면 그 값을 사용, 없으면 UNKNOWN_ID 사용
            const expectedNoticeId = sampleData.id;
            expect(loggerLogSpy).toHaveBeenCalledWith(
                expect.stringContaining(`✅ 푸시알림 보내기 성공: ${expectedNoticeId}-${fakeResponse}`)
            );
        });

        it('프로덕션 환경에서 정상 호출 시, data.id가 없는 경우 UNKNOWN_ID가 사용되어야 함', async () => {
            process.env.NODE_ENV = IdentifierConstants.kProduction;
            const sampleData = { link: 'https://example.com/1' };
            await service.sendNotificationToDevice(token, noticeTitle, sampleData);

            const expectedMessage = {
                token,
                notification: {
                    title: "[인하공지] 새로운 공지사항이 있습니다!",
                    body: noticeTitle,
                },
                data: sampleData,
                "android": {
                    "priority": "high",
                },
            };

            expect(firebaseAdminMock.messaging).toHaveBeenCalled();
            expect(messagingMock.send).toHaveBeenCalledWith(expectedMessage);

            expect(loggerLogSpy).toHaveBeenCalledWith(
                expect.stringContaining(`✅ 푸시알림 보내기 성공: ${IdentifierConstants.UNKNOWN_ID}-${fakeResponse}`)
            );
        });

        it('개발 환경에서는 firebaseAdmin.messaging().send를 호출하지 않고 개발 로그가 남아야 함', async () => {
            process.env.NODE_ENV = 'development';
            const sampleData = { id: 'device123', link: 'https://example.com/1' };

            await service.sendNotificationToDevice(token, noticeTitle, sampleData);

            // firebaseAdmin.messaging() 및 send()가 호출되지 않아야 함
            expect(firebaseAdminMock.messaging).not.toHaveBeenCalled();
            expect(messagingMock.send).not.toHaveBeenCalled();
            expect(loggerDebugSpy).toHaveBeenCalledWith(
                expect.stringContaining(`🔕 개발 환경이므로 알림을 보내지 않습니다.`)
            );
        });

        it('firebaseAdmin.messaging().send 호출 시 에러가 발생하면 에러 로그가 남아야 함', async () => {
            process.env.NODE_ENV = 'production';
            const sampleData = { id: 'device123', link: 'https://example.com/1' };
            const mockError = 'Send failed';
            const error = new Error(mockError);
            messagingMock.send.mockRejectedValue(error);

            const expectedMessage = {
                token,
                notification: {
                    title: "[인하공지] 새로운 공지사항이 있습니다!",
                    body: noticeTitle,
                },
                data: sampleData,
                "android": {
                    "priority": "high",
                },
            };

            await service.sendNotificationToDevice(token, noticeTitle, sampleData);

            expect(firebaseAdminMock.messaging).toHaveBeenCalled();
            expect(messagingMock.send).toHaveBeenCalledWith(expectedMessage);
            expect(loggerErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining(`🚨 푸시알림 보내기 실패: ${error.message}`)
            );
        });
    });

    // ============================================================================
    // sendWholeNotification 테스트
    // ============================================================================
    describe('sendWholeNotification', () => {
        const noticeTitle = 'Test Whole Notice';
        const topicMock = 'all-notices';

        it('프로덕션 환경에서 정상 호출 시, 올바른 메시지로 firebaseAdmin.messaging().send가 호출되어야 함', async () => {
            process.env.NODE_ENV = IdentifierConstants.kProduction;
            const sampleData = { id: 'whole123', link: 'https://example.com/1' };

            await service.sendWholeNotification(noticeTitle, topicMock, sampleData);

            const expectedMessage = {
                notification: {
                    title: "학사",
                    body: noticeTitle,
                },
                data: sampleData,
                topic: topicMock,
                "android": {
                    "priority": "high",
                },
            };

            expect(firebaseAdminMock.messaging).toHaveBeenCalled();
            expect(messagingMock.send).toHaveBeenCalledWith(expectedMessage);
            const expectedNoticeId = sampleData.id;
            expect(loggerLogSpy).toHaveBeenCalledWith(
                expect.stringContaining(`✅ 푸시알림 보내기 성공: ${expectedNoticeId}-${fakeResponse}`)
            );
        });

        it('프로덕션 환경에서 정상 호출 시, data.id가 없는 경우 UNKNOWN_ID 로그가 남아야 함', async () => {
            process.env.NODE_ENV = IdentifierConstants.kProduction;
            const sampleData = { link: 'https://example.com/1' };

            await service.sendWholeNotification(noticeTitle, topicMock, sampleData);

            const expectedMessage = {
                notification: {
                    title: "학사",
                    body: noticeTitle,
                },
                data: sampleData,
                topic: topicMock,
                "android": {
                    "priority": "high",
                },
            };

            expect(firebaseAdminMock.messaging).toHaveBeenCalled();
            expect(messagingMock.send).toHaveBeenCalledWith(expectedMessage);
            expect(loggerLogSpy).toHaveBeenCalledWith(
                expect.stringContaining(`✅ 푸시알림 보내기 성공: ${IdentifierConstants.UNKNOWN_ID}-${fakeResponse}`)
            );
        });

        it('개발 환경에서는 firebaseAdmin.messaging().send 호출 없이 개발 로그만 남아야 함', async () => {
            process.env.NODE_ENV = 'development';
            const sampleData = { id: 'whole123', link: 'https://example.com/1' };

            await service.sendWholeNotification(noticeTitle, topicMock, sampleData);

            // production 환경이 아니므로 messaging() 및 send() 호출되지 않아야 함
            expect(firebaseAdminMock.messaging).not.toHaveBeenCalled();
            expect(messagingMock.send).not.toHaveBeenCalled();
            expect(loggerDebugSpy).toHaveBeenCalledWith(
                expect.stringContaining(`🔕 개발 환경이므로 알림을 보내지 않습니다.`)
            );
        });

        it('firebaseAdmin.messaging().send 호출 시 에러 발생하면 에러 로그가 남아야 함', async () => {
            process.env.NODE_ENV = 'production';
            const sampleData = { id: 'whole123', link: 'https://example.com/1' };
            const mockError = 'Whole send failed';
            const error = new Error(mockError);
            messagingMock.send.mockRejectedValue(error);

            const expectedMessage = {
                notification: {
                    title: "학사",
                    body: noticeTitle,
                },
                data: sampleData,
                topic: 'all-notices',
                "android": {
                    "priority": "high",
                },
            };

            await service.sendWholeNotification(noticeTitle, topicMock, sampleData);

            expect(firebaseAdminMock.messaging).toHaveBeenCalled();
            expect(messagingMock.send).toHaveBeenCalledWith(expectedMessage);
            expect(loggerErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining(`🚨 푸시알림 보내기 실패: ${error.message}`)
            );
        });
    });

    // ============================================================================
    // sendMajorNotification 테스트
    // ============================================================================
    describe('sendMajorNotification', () => {
        const noticeTitle = 'Test Major Notice';
        const topic = 'CS';
        const expectedNotificationTitle = majorMappings[topic] ?? "학과";

        it('프로덕션 환경에서 정상 호출 시, 올바른 메시지로 firebaseAdmin.messaging().send가 호출되어야 함', async () => {
            process.env.NODE_ENV = IdentifierConstants.kProduction;
            const sampleData = { id: 'major123', link: 'https://example.com/1' };

            await service.sendMajorNotification(noticeTitle, topic, sampleData);

            const expectedMessage = {
                notification: {
                    title: expectedNotificationTitle,
                    body: noticeTitle,
                },
                data: sampleData,
                topic: topic,
                "android": {
                    "priority": "high",
                },
            };

            expect(messagingMock.send).toHaveBeenCalledWith(expectedMessage);
            const expectedNoticeId = sampleData.id;
            expect(loggerLogSpy).toHaveBeenCalledWith(
                expect.stringContaining(`✅ 푸시알림 보내기 성공: ${expectedNoticeId}-${fakeResponse}`)
            );
        });

        it('개발 환경에서는 firebaseAdmin.messaging().send 호출 없이 개발 로그가 남아야 함', async () => {
            process.env.NODE_ENV = 'development';
            const sampleData = { id: 'major123', link: 'https://example.com/1' };

            await service.sendMajorNotification(noticeTitle, topic, sampleData);

            expect(messagingMock.send).not.toHaveBeenCalled();
            expect(loggerDebugSpy).toHaveBeenCalledWith(
                expect.stringContaining(`🔕 개발 환경이므로 알림을 보내지 않습니다.`)
            );
        });

        it('firebaseAdmin.messaging().send 호출 중 에러 발생 시, 에러 로그가 기록되어야 함', async () => {
            process.env.NODE_ENV = 'production';
            const sampleData = { id: 'major123', link: 'https://example.com/1' };
            const mockError = 'Major send failed';
            const error = new Error(mockError);
            messagingMock.send.mockRejectedValue(error);

            await service.sendMajorNotification(noticeTitle, topic, sampleData);

            expect(loggerErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining(`🚨 푸시알림 보내기 실패: ${error.message}`)
            );
        });
    });

    // ============================================================================
    // sendMajorStyleNotification 테스트
    // ============================================================================
    describe('sendMajorStyleNotification', () => {
        const noticeTitle = 'Test Major Style Notice';
        const topic = 'SW';
        const expectedNotificationTitle = majorStyleMappings[topic] ?? "새로운 공지사항이 있습니다!";

        it('프로덕션 환경에서 정상 호출 시, 올바른 메시지로 firebaseAdmin.messaging().send가 호출되어야 함', async () => {
            process.env.NODE_ENV = IdentifierConstants.kProduction;
            const sampleData = { id: 'majorStyle123', link: 'https://example.com/1' };

            await service.sendMajorStyleNotification(noticeTitle, topic, sampleData);

            const expectedMessage = {
                notification: {
                    title: expectedNotificationTitle,
                    body: noticeTitle,
                },
                data: sampleData,
                topic: topic,
                "android": {
                    "priority": "high",
                },
            };

            expect(firebaseAdminMock.messaging).toHaveBeenCalled();
            expect(messagingMock.send).toHaveBeenCalledWith(expectedMessage);
            const expectedNoticeId = sampleData.id;
            expect(loggerLogSpy).toHaveBeenCalledWith(
                expect.stringContaining(`✅ 푸시알림 보내기 성공: ${expectedNoticeId}-${fakeResponse}`)
            );
        });

        it('프로덕션 환경에서 정상 호출 시, data.id가 없는 경우 UNKNOWN_ID 로그가 남아야 함', async () => {
            process.env.NODE_ENV = IdentifierConstants.kProduction;
            const sampleData = { link: 'https://example.com/1' };

            await service.sendMajorStyleNotification(noticeTitle, topic, sampleData);

            const expectedMessage = {
                notification: {
                    title: expectedNotificationTitle,
                    body: noticeTitle,
                },
                data: sampleData,
                topic: topic,
                "android": {
                    "priority": "high",
                },
            };

            expect(firebaseAdminMock.messaging).toHaveBeenCalled();
            expect(messagingMock.send).toHaveBeenCalledWith(expectedMessage);
            expect(loggerLogSpy).toHaveBeenCalledWith(
                expect.stringContaining(`✅ 푸시알림 보내기 성공: ${IdentifierConstants.UNKNOWN_ID}-${fakeResponse}`)
            );
        });

        it('개발 환경에서는 firebaseAdmin.messaging().send 호출 없이 개발 로그가 남아야 함', async () => {
            process.env.NODE_ENV = 'development';
            const sampleData = { id: 'majorStyle123', link: 'https://example.com/1' };

            await service.sendMajorStyleNotification(noticeTitle, topic, sampleData);

            expect(firebaseAdminMock.messaging).not.toHaveBeenCalled();
            expect(messagingMock.send).not.toHaveBeenCalled();
            expect(loggerDebugSpy).toHaveBeenCalledWith(
                expect.stringContaining(`🔕 개발 환경이므로 알림을 보내지 않습니다.`)
            );
        });

        it('firebaseAdmin.messaging().send 호출 중 에러 발생 시, 에러 로그가 기록되어야 함', async () => {
            process.env.NODE_ENV = 'production';
            const sampleData = { id: 'majorStyle123', link: 'https://example.com/1' };
            const mockError = 'MajorStyle send failed';
            const error = new Error(mockError);
            messagingMock.send.mockRejectedValue(error);

            await service.sendMajorStyleNotification(noticeTitle, topic, sampleData);

            expect(loggerErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining(`🚨 푸시알림 보내기 실패: ${error.message}`)
            );
        });
    });
});