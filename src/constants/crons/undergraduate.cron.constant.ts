/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-19
 */

/**
 * 학사일정 스케줄러의 Cron 상수를 정의한다.
 */
export const UNDERGRADUATE_CRON: Record<string, string> = {
    // 평일 18시에 하루 전 알림 보내기
    CRON_DAY_BEFORE: '0 18 * * 1-5',
    TASK_DAY_BEFORE: '하루 전 일정(18시)',

    // 평일 8시에 오늘 일정 알림 보내기
    CRON_TODAY: '0 8 * * 1-5',
    TASK_TODAY: '오늘 일정(8시)',
} as const;