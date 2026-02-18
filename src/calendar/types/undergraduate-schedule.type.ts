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
 * undergraduate-schedule.json의 일정 타입을 결정한다.
 */
type ScheduleEvent = {
    title: string;
    startDate: string;
    note: string | null;
    color: string;
};

/**
 * ScheduleEvent 배열 타입을 정의한다.
 */
type Schedule = {
    [month: string]: ScheduleEvent[];
};
