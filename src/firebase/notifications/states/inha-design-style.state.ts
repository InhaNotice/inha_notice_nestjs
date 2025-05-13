/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-13
 */

import { NotificationState } from 'src/firebase/notifications/notification.state';
import { inhaDesignStyleMapping } from 'src/constants/notice/mappings/inha-design-style.mapping';

export class InhaDesignStyleState implements NotificationState {
    getNotificationTitle(topic: string): string {
        return inhaDesignStyleMapping[topic] ?? '새로운 공지사항이 있어요!';
    }
}