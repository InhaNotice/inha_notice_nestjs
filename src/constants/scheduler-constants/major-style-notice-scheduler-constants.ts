/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-03-04
 */

export abstract class MajorStyleNoticeSchedulerConstants {
    // 평일(월~금) 9시~16시 59분까지, 10분 간격으로 학과 스타일 공지 크롤링
    static readonly CRON_WEEKDAYS = '0 */10 9-16 * * 1-5';
    static readonly TASK_WEEKDAYS = '정기(9~17시)';
    // 평일(월~금) 17시 정각, 1회 오늘 날짜가 아닌 공지사항 삭제
    static readonly CRON_DELETE_OLD = '0 0 17 * * 1-5';
    static readonly TASK_DELETE_OLD = '(17시)';
}