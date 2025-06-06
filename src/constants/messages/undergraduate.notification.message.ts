/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-17
 */

/**
 * 학사일정 알림 제목을 토픽을 기반으로 번역하는 상수를 정의한다.
 */
export const UNDERGRADUATE_NOTIFICATION_MESSAGES: Record<string, string> = {
    'undergraduate-schedule-d1-notification': '내일 일정이 있어요!',
    'undergraduate-schedule-dd-notification': '오늘 일정이 있어요!',
} as const;