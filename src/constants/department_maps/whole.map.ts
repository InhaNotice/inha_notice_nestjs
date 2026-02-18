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
 * 학사 공지(전체공지, 장학, 모집/채용)의 영문 학과명에서 국문 학과명으로 번역하는 상수를 정의한다.
 */
export const WHOLE_MAP: Record<string, string> = {
    // 전체공지
    'all-notices': '학사',
    // 장학
    SCHOLARSHIP: '장학',
    // 모집/채용
    RECRUITMENT: '모집/채용',
} as const;