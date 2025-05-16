/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-16
 */

export const UNDERGRADUATE_CRON: Record<string, string> = {
    // 평일 18시에 하루 전 알림 보내기
    UNDERGRADUATE_DAY_BEFORE_REMINDER: '0 18 * * 1-5',

    // 평일 8시에 오늘 일정 알림 보내기
    UNDERGRADUATE_TODAY_REMINDER: '0 8 * * 1-5',
} as const;