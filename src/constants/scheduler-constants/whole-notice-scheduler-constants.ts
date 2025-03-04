/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-03-04
 */

export abstract class WholeNoticeSchedulerConstants {
    // 크론 표현식 상수
    static readonly CRON_WEEKDAYS = '0 */10 9-16 * * 1-5';
    static readonly CRON_EVENING = '0 */30 16-23 * * 1-5';
    static readonly CRON_WEEKEND = '0 */30 9-23 * * 6-7';
    static readonly CRON_DELETE_OLD = '0 0 0 * * 1-5';

    // 태스크 명칭 상수
    static readonly TASK_WEEKDAYS = '학사 정기(9~17시)';
    static readonly TASK_EVENING = '학사 저녁(17~24시)';
    static readonly TASK_WEEKEND = '학사 주말(9~24시)';
    static readonly TASK_DELETE_OLD = '학사 (00시)';
}