/*
 * This is file of the project inha_notice
 * Licensed under the MIT License.
 * Copyright (c) 2025-2026 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-17
 */

import { NotificationState } from 'src/firebase/states/notification.state';

/**
 * Firebase 알림의 제목 생성을 담당하는 컨텍스트 클래스.
 */
export class FirebaseNotificationContext {
    private state: NotificationState;

    constructor(state: NotificationState) {
        this.state = state;
    }

    setState(state: NotificationState) {
        this.state = state;
    }

    getNotificationTitle(topic: string): string {
        return this.state.getNotificationTitle(topic);
    }
}