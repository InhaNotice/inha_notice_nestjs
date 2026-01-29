/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2026-01-29
 */

/**
 * 학사 일반 공지사항 태그 선택자
 */
export abstract class GeneralTagSelectors {
    static readonly NOTICE_BOARD: string = '.artclTable tr:not(.headline)';
    static readonly NOTICE_TITLE: string = '._artclTdTitle .artclLinkView';
    static readonly NOTICE_DATE: string = '._artclTdRdate';
    static readonly NOTICE_WRITER: string = '._artclTdWriter';
    static readonly NOTICE_ACCESS: string = '._artclTdAccess';
}