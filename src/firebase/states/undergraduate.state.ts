/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-17
 */

import { NotificationState } from 'src/firebase/states/notification.state';
import { UNDERGRADUATE_NOTIFICATION_MESSAGES } from 'src/constants/messages/undergraduate.notification.message';

/**
 * Undergraduate의 알림 상태를 정의한다.
*/
export class UndergraudateState implements NotificationState {
    getNotificationTitle(topic: string): string {
        return UNDERGRADUATE_NOTIFICATION_MESSAGES[topic] ?? '새로운 공지사항이 있어요!';
    }
}