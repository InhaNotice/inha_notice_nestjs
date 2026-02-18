/*
 * This is file of the project inha_notice
 * Licensed under the MIT License.
 * Copyright (c) 2025-2026 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-18
 */

import { NotificationState } from 'src/firebase/states/notification.state';
import { LIBRARY_STYLE_MAP } from 'src/constants/department_maps/library-style.map';

/**
 * Undergraduate의 알림 상태를 정의한다.
*/
export class LibraryStyleState implements NotificationState {
    getNotificationTitle(topic: string): string {
        return LIBRARY_STYLE_MAP[topic] ?? '새로운 공지사항이 있어요!';
    }
}