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