/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-13
 */

import { Logger } from '@nestjs/common';
import * as sqlite3 from 'sqlite3';
import * as fs from 'fs';
import * as dayjs from 'dayjs';
import * as path from 'path';
import { AbsoluteStyleScraper } from 'src/notices/scrapers/absolute-style/absolute-style.scraper';
import { Notice } from 'src/notices/interfaces/notice.interface';
import { IdentifierConstants } from 'src/constants/identifiers';
import { FirebaseNotificationContext } from 'src/firebase/firebase-notification.context';

/**
 * AbsoluteStyle의 공지사항 크롤링 스케줄러를 제공하는 추상클래스
 * 
 * ### 주요 기능:
 * - 데이터베이스 생성
 * - 크롤링, 오래된 공지 삭제 등 스케줄러 동작 정의
 * - 기타 헬퍼 함수 정의
 * 
 * ### 목차:
 * 1. 필드 선언
 * 2. 추상메서드 선언
 * 3-1. 서비스 로직 구현 (초기화 관련 메서드)
 * 3-2. 서비스 로직 구현 (크롤링, 오래된 공지 삭제)
 * 4. 헬퍼 함수(크롤링, 오래된 공지 삭제 관련)
 */
export abstract class AbsoluteStyleScheduler {
    // ========================================
    // 1. 필드 선언
    // ========================================

    protected logger: Logger;
    protected directoryName: string;
    protected scraperService: AbsoluteStyleScraper;
    protected databaseDirectory: string;
    protected databases: Record<string, sqlite3.Database>;
    protected cachedNoticeIds: Record<string, Set<string>>;
    protected context: FirebaseNotificationContext;

    // ========================================
    // 2. 추상메서드 선언
    // ========================================

    abstract sendFirebaseMessaging(
        notice: Notice, noticeType: string
    ): Promise<void>;

    protected buildFirebaseMessagePayload(
        notice: Notice,
        noticeType: string,
    ): {
        title: string;
        body: string;
        data: Record<string, string>;
    } {
        const title = this.context.getNotificationTitle(noticeType);
        const body = notice.title;
        const data = {
            id: notice.id,
            link: notice.link,
            date: notice.date,
        };

        return { title, body, data };
    }

    // ========================================
    // 3-1. 서비스 로직 구현 (초기화 관련 메서드)
    // ========================================

    /**
     * databaseDirectory 디렉터리 존재 확인 및 생성
     */
    protected initializeDatabaseDirectory(): void {
        if (!fs.existsSync(this.databaseDirectory)) {
            try {
                fs.mkdirSync(this.databaseDirectory, { recursive: true });
            } catch (err) {
                this.logger.error(`❌ 데이터베이스 디렉터리 생성 실패: ${err.message}`);
            }
        }
    }

    /**
     * 데이터베이스 연결 및 생성
     */
    protected initializeDatabases(): void {
        const noticeTypes: string[] = this.scraperService.getAllNoticeTypes();
        for (const noticeType of noticeTypes) {
            const dbPath: string = path.join(this.databaseDirectory, `${noticeType}.db`);
            this.databases[noticeType] = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    this.logger.error(`❌ ${noticeType} 데이터베이스 연결 실패: ${err.message}`);
                } else {
                    this.initializeTable(noticeType);
                }
            });
        }
    }

    /**
     * 공지 타입별 SQLite 테이블 생성 (없다면 자동 생성)
     * @param {string} noticeType - 학과 스타일 공지별 키: (ex) INTERNATIONAL, SWUNIV, ...
     */
    protected initializeTable(noticeType: string): void {
        this.databases[noticeType].run(
            `CREATE TABLE IF NOT EXISTS notices (
                id TEXT PRIMARY KEY,
                title TEXT,
                link TEXT,
                date TEXT
            )`,
            (err) => {
                if (err) {
                    this.logger.error(`❌ ${noticeType} 테이블 생성 실패: ${err.message}`);
                } else {
                    // 서버 시작 시 최초 1회 캐싱 로딩
                    this.loadCache(noticeType);
                }
            }
        );
    }

    /**
     * 서버 시작 또는 공지사항 삭제 후, 새롭게 데이터베이스에서 불러와 공지사항 Id를 캐싱함
     * 
     * 참고: File를 불러와 공지사항 Id 캐싱함. 데이터 누락될 가능성 없음.
     * 테이블이 존재할 때만 실행됨.
     * 
     * @param {string} noticeType - 각 공지타입에 맞게 데이터베이스를 불러오거나 생성함
     */
    protected loadCache(noticeType: string): void {
        this.cachedNoticeIds[noticeType] = new Set();

        this.databases[noticeType].get("SELECT name FROM sqlite_master WHERE type='table' AND name='notices'", (err, row) => {
            if (err) {
                this.logger.error(`❌ ${noticeType} SQLite 테이블 확인 중 오류 발생: ${err.message}`);
                return;
            }

            if (!row) {
                this.logger.warn(`⛔️ ${noticeType} notices 테이블이 존재하지 않아 캐시를 로드하지 않습니다.`);
                return;
            }

            // notices 테이블이 존재하면 캐시 로드 실행
            this.databases[noticeType].all("SELECT id FROM notices", [], (err, rows) => {
                if (err) {
                    this.logger.error(`❌ ${noticeType} SQLite 캐시 로드 중 오류 발생: ${err.message}`);
                    return;
                }
                this.cachedNoticeIds[noticeType] = new Set(rows.map(row => (row as { id: string }).id));
                this.logger.log(`✅ ${noticeType} 캐싱된 공지사항 ID 로드 완료 (${this.cachedNoticeIds[noticeType].size}개)`);
            });
        });
    }

    // ========================================
    // 3-2. 서비스 로직 구현 (크롤링, 오래된 공지 삭제)
    // ========================================

    /**
     * 크롤링
     * @param {string} logPrefix - 로그 식별용 접두사
     */
    protected async executeCrawling(logPrefix: string): Promise<void> {
        this.logger.log(`📌 ${logPrefix} 크롤링 실행 중...`);

        try {
            const allNotices: Record<string, Notice[]> = await this.scraperService.fetchAllNotices();

            for (const noticeType of Object.keys(allNotices)) {
                const newNotices: Notice[] = this.filterNewNotices(noticeType, allNotices[noticeType]);

                // 새로운 공지사항이 존재하지 않으면 건너뛰기
                if (newNotices.length === 0) {
                    continue;
                }

                for (const notice of newNotices) {
                    // 배포 환경일 때만 FCM 알림 전송
                    if (process.env.NODE_ENV === IdentifierConstants.kProduction) {
                        await this.sendFirebaseMessaging(notice, noticeType);
                    } else {
                        this.logger.debug(`🔕 ${noticeType}의 새로운 공지 - ${notice.title}-${notice.date}`);
                    }

                    // File에 기록
                    this.saveNotice(noticeType, notice);
                    // 캐시에 새로운 공지 Id 추가
                    this.cachedNoticeIds[noticeType].add(notice.id);
                }
            }
        } catch (error) {
            this.logger.error(`❌ ${logPrefix} 크롤링 중 오류 발생:, ${error.message}`);
        } finally {
            this.logger.log(`🏁 ${logPrefix} 정기 크롤링 끝!`);
        }
    }

    /**
     * 오래된 공지 삭제
     * @param {string} logPrefix - 로그 식별용 접두사
     */
    protected async deleteOldNotices(logPrefix: string): Promise<void> {
        const todayDate: string = this.getTodayDate();

        try {
            for (const noticeType of Object.keys(this.databases)) {
                await this.deleteNoticesExceptToday(noticeType, todayDate);
                this.logger.log(`✅ ${logPrefix}-${noticeType} 오래된 공지사항 삭제 완료`);
            }
        } catch (error) {
            this.logger.error(`❌ ${logPrefix} 오래된 공지사항 삭제 중 오류 발생: ${error.message}`);
        }
    }

    // ========================================
    // 4. 헬퍼 함수(크롤링, 오래된 공지 삭제 관련)
    // ========================================

    /**
     * 오늘 날짜를 제외한 모든 공지사항 삭제
     * @param {string} noticeType - 공지타입
     * @param todayDate - 오늘날짜: YYYY.MM.DD
     */
    protected async deleteNoticesExceptToday(noticeType: string, todayDate: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.databases[noticeType].run(
                `DELETE FROM notices WHERE date != ?`,
                [todayDate],
                (err) => {
                    if (err) {
                        this.logger.error(`🚨 ${noticeType} 오래된 공지사항 삭제 실패: ${err.message}`);
                        reject(err);
                    } else {
                        this.logger.log(`🗑️ ${noticeType} 오늘이 아닌 공지사항 삭제 완료`);
                        // 공지사항 삭제 후, 최신 상태로 캐싱 업데이트
                        this.loadCache(noticeType);
                        resolve();
                    }
                }
            );
        });
    }

    /**
     * 오늘 날짜의 필터링된 새로운 공지사항 객체 배열 반환
     * @param {string} noticeType - 공지타입
     * @param {Notice[]} notices - 크롤링한 원본 공지사항 객체 배열
     * @returns {Promise<Notice[]>} - 오늘 날짜의 필터링된 새로운 공지사항 객체 배열
     */
    protected filterNewNotices(noticeType: string, notices: Notice[]): Notice[] {
        // todayDate: YYYY.MM.DD
        const todayDate: string = this.getTodayDate();
        // todayNotices: 오늘 날짜 필터링한 공지사항 객체 배열
        const todayNotices: Notice[] = notices.filter((notice) => notice.date === todayDate);

        // newNotices: 오늘 날짜의 필터링된 새로운 공지사항 객체 배열
        // 캐싱된 기존의 공지와 비교하여 새로운 공지사항만 선별
        const newNotices: Notice[] = todayNotices.filter(notice => !this.cachedNoticeIds[noticeType].has(notice.id));

        return newNotices;
    }

    /**
     * 새로운 공지를 데이터베이스에 저장
     * @param {string} noticeType - 공지타입
     * @param {Notice} notice - 새로운 공지사항 객체
     */
    protected async saveNotice(noticeType: string, notice: Notice): Promise<void> {
        return new Promise((resolve, reject) => {
            this.databases[noticeType].run(
                "INSERT OR IGNORE INTO notices (id, title, link, date) VALUES (?, ?, ?, ?)",
                [notice.id, notice.title, notice.link, notice.date],
                (err) => {
                    if (err) {
                        this.logger.error(`🚨 ${noticeType} SQLite 저장 중 오류 발생: ${err.message}`);
                        reject(err);
                    } else {
                        this.logger.log(`✅ ${noticeType} 새로운 공지사항 ID 저장 완료: ${notice.id}`);
                        resolve();
                    }
                }
            );
        });
    }

    /**
     * 오늘 날짜(YYYY.MM.DD)를 반환
     * @returns {string} 오늘 날짜
     */
    protected getTodayDate(): string {
        return dayjs().format('YYYY.MM.DD');
    }
}