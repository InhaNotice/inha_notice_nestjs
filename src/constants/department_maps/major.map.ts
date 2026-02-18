/*
 * This is file of the project inha_notice
 * Licensed under the MIT License.
 * Copyright (c) 2025-2026 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2026-02-18
 */

/**
 * 영문 학과명에서 국문 학과명으로 번역하는 상수를 정의한다.
 */
export const MAJOR_MAP: Record<string, string> = {
    // 공과대학
    MECH: '기계공학과',
    AEROSPACE: '항공우주공학과',
    NAOE: '조선해양공학과',
    IE: '산업경영공학과',
    CHEMENG: '화학공학과',
    INHAPOLY: '고분자공학과',
    DMSE: '신소재공학과',
    CIVIL: '사회인프라공학과',
    ENVIRONMENT: '환경공학과',
    GEOINFO: '공간정보공학과',
    ARCH: '건축학부',
    ENERES: '에너지자원공학과',
    ELECTRICAL: '전기공학과',
    EE: '전자공학과',
    ICE: '정보통신공학과',
    EEE: '전기전자공학부',
    SSE: '반도체시스템공학과',
    IBATTERY: '이차전지융합학과',
    // 자연과학대학
    MATH: '수학과',
    STATISTICS: '통계학과',
    PHYSICS: '물리학과',
    CHEMISTRY: '화학과',
    OCEANOGRAPHY: '해양과학과',
    FOODNUTRI: '식품영양학과',
    // 경영대학
    BIZ: '경영학과',
    GFIBA: '파이낸스경영학과',
    APSL: '아태물류학과',
    STAR: '국제통상학과',
    // 사범대학
    KOREANEDU: '국어교육과',
    DELE: '영어교육과',
    SOCIALEDU: '사회교육과',
    PHYSICALEDU: '체육교육과',
    EDUCATION: '교육학과',
    MATHED: '수학교육과',
    // 사회과학대학
    PUBLICAD: '행정학과',
    POLITICAL: '정치외교학과',
    COMM: '미디어커뮤니케이션학과',
    ECON: '경제학과',
    CONSUMER: '소비자학과',
    CHILD: '아동심리학과',
    WELFARE: '사회복지학과',
    // 문과대학
    KOREAN: '한국어문학과',
    HISTORY: '사학과',
    PHILOSOPHY: '철학과',
    CHINESE: '중국학과',
    JAPAN: '일본언어문화학과',
    EES: '영미유럽인문융합학부',
    CULTURECM: '문화콘텐츠문화경영학과',
    // 의과대학
    MEDICINE: '의예과',
    // 간호대학
    NURSING: '간호학과',
    // 예술체육대학
    FINEARTS: '조형예술학과',
    INHADESIGN: '디자인융합학과',
    SPORT: '스포츠과학과',
    THEATREFILM: '연극영화학과',
    FASHION: '의류디자인학과',
    // 바이오시스템융합학부
    BIO: '생명공학과',
    BIOLOGY: '생명과학과',
    BIOPHARM: '바이오제약공학과',
    BIOMEDICAL: '첨단바이오의약학과',
    FOODSCIENCE: '바이오식품공학과',
    // 국제학부
    SGCSA: 'IBT학과',
    SGCSB: 'ISE학과',
    SGCSC: 'KLC학과',
    // 미래융합대학
    FCCOLLEGEA: '메카트로닉스공학과',
    FCCOLLEGEB: '소프트웨어융합공학과',
    FCCOLLEGEC: '산업경영학과',
    FCCOLLEGED: '금융투자학과',
    // 소프트웨어융합대학
    DOAI: '인공지능공학과',
    SME: '스마트모빌리티공학과',
    DATASCIENCE: '데이터사이언스학과',
    DESIGNTECH: '디자인테크놀리지학과',
    CSE: '컴퓨터공학과',
    // 프런티어창의대학
    LAS: '자유전공융합학부',
    ECS: '공학융합학부',
    NCS: '자연과학융합학부',
    CVGBA: '경영융합학부',
    CVGSOSCI: '사회과학융합학부',
    CVGHUMAN: '인문융합학부',
} as const;