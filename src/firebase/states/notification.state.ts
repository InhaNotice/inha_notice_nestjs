/*
 * This is file of the project inha_notice
 * Licensed under the MIT License.
 * Copyright (c) 2025-2026 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-17
 */


/**
 * 알림 상태의 인터페이스를 제공한다.
 */
export interface NotificationState {
    getNotificationTitle(topic: string): string;
}