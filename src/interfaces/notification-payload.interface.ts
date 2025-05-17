/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-17
 */

/**
 * 공지알림, 학사알림 등 알림 형식에 대한 인터페이스를 정의한다.
 */
export interface NotificationPayload {
    id: string;
    title: string;
    link: string;
    date: string;
    writer: string;
    access: string;
};