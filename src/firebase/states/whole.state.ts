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
import { WHOLE_MAP } from 'src/constants/department_maps/whole.map';

/**
 * Whole의 알림 상태를 정의한다.
*/
export class WholeState implements NotificationState {
  getNotificationTitle(topic: string): string {
    return WHOLE_MAP[topic] ?? '새로운 공지사항이 있어요!';
  }
}