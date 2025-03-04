/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-03-04
 */

/**
 * 학과 스타일(국제처, SWUNIV, 단과대, 대학원)의 영문 학과명에서 국문 학과명으로 번역하는 컨테이너
 */
export const majorStyleMappings: Record<string, string> = {
    // 국제처, SWUNIV
    "INTERNATIONAL": "국제처",
    "SWUNIV": "SW중심대학사업단",
    //단과대
    'ENGCOLLEAGE': '공과대학',
    'NSCOLLEAGE': '자연과학대학',
    'CBA': '경영대학',
    'EDCOLLEGE': '사범대학',
    'SSCOLLEGE': '사회과학대학',
    'HACOLLEGE': '문과대학',
    'ARTSPORTS': '예술체육대학',
    'SWCC': '소프트웨어융합대학',
    'GENERALEDU': '프런티어창의대학',
    // 대학원
    'GRAD': '일반대학원',
    'ENGRAD': '공학대학원',
    'MBA': '경영대학원',
    'EDUGRAD': '교육대학원',
    'ADMGRAD': '정책대학원',
    'COUNSELGRAD': '상담심리대학원',
    'GSPH': '보건대학원',
    'ILS': '법학전문대학원',
    'GSL': '물류전문대학원',
    'IMIS': '제조혁신전문대학원',
};