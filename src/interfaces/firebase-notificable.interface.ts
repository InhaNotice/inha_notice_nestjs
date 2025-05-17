/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-17
 */
import { NotificationPayload } from 'src/interfaces/notification-payload.interface';

/**
 * Firebase Message Payload 인터페이스를 정의한다.
 */
export interface FirebaseMessagePayload {
    title: string;
    body: string;
    data: {
        id: string;
        link: string;
        date: string;
    }
}

/**
 * Firebase 알림 전송을 위한 인터페이스를 정의한다.
 */
export abstract class FirebaseNotifiable {
    /**
     * Firebase 메시지 전송
     * @param notice - 전송할 공지사항
     * @param noticeType - 공지사항 유형
     */
    abstract sendFirebaseMessaging(notice: NotificationPayload, noticeType: string): Promise<void>;

    /**
     * Firebase 메시지 payload 생성
     */
    protected buildFirebaseMessagePayload(
        context: { getNotificationTitle: (type: string) => string },
        notice: NotificationPayload,
        topic: string,
    ): FirebaseMessagePayload {
        const title = context.getNotificationTitle(topic);
        const body = notice.title;
        const data = {
            id: notice.id,
            link: notice.link,
            date: notice.date,
        };

        return { title, body, data };
    }
}