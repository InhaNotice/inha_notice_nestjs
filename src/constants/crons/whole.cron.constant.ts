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
 * Whole 공지 스케줄러의 Cron 상수를 정의한다.
 */
export const WHOLE_CRON: Record<string, string> = {
    /**
     * 평일(월~금) 9시~16시 59분까지, 10분 간격으로 학사 공지 크롤링
     */
    CRON_WEEKDAYS: '0 */10 9-16 * * 1-5',
    TASK_WEEKDAYS: '정기(9~17시)',

    /**
    * 평일(월~금) 17시~23시 59분까지, 30분 간격으로 학사 공지 크롤링
    */
    CRON_EVENING: '0 */30 17-23 * * 1-5',
    TASK_EVENING: '저녁(17~24시)',

    /**
     * 주말(토~일) 9시~23시 59분까지, 30분 간격으로 학사 공지 크롤링
     */
    CRON_WEEKEND: '0 */30 9-23 * * 6-7',
    TASK_WEEKEND: '주말(9~24시)',

    /**
     * 평일(월~금) 23시 정각, 1회 오늘 날짜가 아닌 공지사항 삭제
     * 
     * 참고: 오늘 날짜 포함한 모든 공지 삭제시 크롤링이 다시 진행된다면 푸시 알림 발생 가능하지만,
     * 오늘 날짜가 아닌 공지사항 삭제시 그러한 문제가 발생해도 아무런 영향 없음
     */
    CRON_DELETE_OLD: '0 0 0 * * 1-5',
    TASK_DELETE_OLD: '(00시)',
} as const;
