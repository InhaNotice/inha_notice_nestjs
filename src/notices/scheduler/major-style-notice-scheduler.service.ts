/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-03-04
 */

import { Injectable, Logger, Scope } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MajorStyleNoticeScraperService } from 'src/notices/scraper/major-style-notice-scraper.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Notice } from 'src/notices/interfaces/notice.interface';
import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as dayjs from 'dayjs';
import * as fs from 'fs';
import { IdentifierConstants } from 'src/constants/identifiers';
import { MajorStyleNoticeSchedulerConstants } from 'src/constants/scheduler-constants/major-style-notice-scheduler-constants';

/**
 * 학과 스타일(국제처, SW중심대학사업단, 단과대, 대학원) 공지 스캐줄러
 * 
 * 주요 기능
 * - 학과 스타일의 공지를 크롤링하여 새로운 공지가 존재시 FCM 알림 전송
 * - 오래된 공지사항을 주기적으로 삭제 진행
 * - 캐싱 전략을 사용한 효율적인 연산
 * 
 * 목차
 * 1. 초기화 관련 메서드
 * 2. 스케줄링 메서드 (Cron, 2개)
 * 3. 주요 비즈니스 로직 (크롤링, 오래된 공지 삭제)
 * 4. DB 조작 및 삭제 관련 메서드
 * 5. 유틸리티 메서드
 */
@Injectable({ scope: Scope.DEFAULT })
export class MajorStyleNoticeSchedulerService {
    private readonly logger: Logger = new Logger(MajorStyleNoticeSchedulerService.name);
    private readonly databaseDir: string = path.join(process.cwd(), 'database', 'major_styles');
    private databases: Record<string, sqlite3.Database> = {};
    private cachedNoticeIds: Record<string, Set<string>> = {};

    constructor(
        private readonly majorStyleNoticeScraperService: MajorStyleNoticeScraperService,
        private readonly firebaseService: FirebaseService,
    ) {
        this.initializeDatabaseDirectory();
        this.initializeDatabases();
    }

    // ========================================
    // 1. 초기화 관련 메서드
    // ========================================

    /**
     * databaseDir 디렉터리 존재 확인 및 생성
     */
    private initializeDatabaseDirectory(): void {
        if (!fs.existsSync(this.databaseDir)) {
            try {
                fs.mkdirSync(this.databaseDir, { recursive: true });
            } catch (err) {
                this.logger.error(`❌ 데이터베이스 디렉터리 생성 실패: ${err.message}`);
            }
        }
    }

    /**
     * 데이터베이스 연결 및 생성
     */
    private initializeDatabases(): void {
        const noticeTypes: string[] = this.majorStyleNoticeScraperService.getAllNoticeTypes();
        for (const noticeType of noticeTypes) {
            const dbPath: string = path.join(this.databaseDir, `${noticeType}.db`);
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
     * 학과 스타일 공지별 SQLite 테이블 생성 (없다면 자동 생성)
     * @param {string} noticeType - 학과 스타일 공지별 키: (ex) INTERNATIONAL, SWUNIV, ...
     */
    private initializeTable(noticeType: string): void {
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
     */
    private loadCache(noticeType: string): void {
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
                } else {
                    this.cachedNoticeIds[noticeType] = new Set(rows.map(row => (row as { id: string }).id));
                    this.logger.log(`✅ ${noticeType} 캐싱된 공지사항 ID 로드 완료 (${this.cachedNoticeIds[noticeType].size}개)`);
                }
            });
        });
    }

    // ========================================
    // 2. 스케줄링 메서드 (Cron, 2개)
    // ========================================

    /**
     * 평일(월~금) 9시~16시 59분까지, 10분 간격으로 학과 스타일 공지 크롤링
     */
    @Cron(MajorStyleNoticeSchedulerConstants.CRON_WEEKDAYS, { timeZone: 'Asia/Seoul' })
    async handleWeekDaysCron() {
        await this.executeCrawling(MajorStyleNoticeSchedulerConstants.TASK_WEEKDAYS);
    }

    /**
     * 평일(월~금) 17시 정각, 1회 오늘 날짜가 아닌 공지사항 삭제
     * 
     * 참고: 오늘 날짜 포함한 모든 공지 삭제시 크롤링이 다시 진행된다면 푸시 알림 발생 가능하지만,
     * 오늘 날짜가 아닌 공지사항 삭제시 그러한 문제가 발생해도 아무런 영향 없음
     */
    @Cron(MajorStyleNoticeSchedulerConstants.CRON_DELETE_OLD, { timeZone: 'Asia/Seoul' })
    async handleDeleteCron() {
        await this.deleteOldNotices(MajorStyleNoticeSchedulerConstants.TASK_DELETE_OLD);
    }

    // ========================================
    // 3. 주요 비즈니스 로직 (크롤링, 오래된 공지 삭제)
    // ========================================

    /**
     * 학과 스타일 공지 크롤링
     * @param {string} logPrefix - 로그 식별용 접두사
     */
    private async executeCrawling(logPrefix: string): Promise<void> {
        this.logger.log(`📌 ${logPrefix} 정기 크롤링 실행 중...`);

        try {
            const allNotices: Record<string, Notice[]> = await this.majorStyleNoticeScraperService.fetchAllNotices();

            for (const noticeType of Object.keys(allNotices)) {
                const newNotices: Notice[] = await this.filterNewNotices(noticeType, allNotices[noticeType]);

                // 새로운 공지사항이 존재하지 않으면 건너뛰기
                if (newNotices.length === 0) {
                    continue;
                }

                for (const notice of newNotices) {
                    this.logger.log(`🚀 ${noticeType} 새로운 공지 발견: ${notice.title} - ${notice.date}`);

                    // 배포 환경일 때만 FCM 알림 전송
                    if (process.env.NODE_ENV === IdentifierConstants.kProduction) {
                        await this.firebaseService.sendMajorStyleNotification(
                            notice.title,
                            noticeType,
                            {
                                id: notice.id,
                                link: notice.link,
                            }
                        )
                    } else {
                        this.logger.debug(`🔕 ${logPrefix}-${noticeType} 개발 환경이므로 푸시 알림을 전송하지 않습니다.`);
                    }

                    // File에 기록
                    await this.saveNotice(noticeType, notice);
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
     * 학과 스타일 오래된 공지 삭제
     * @param {string} logPrefix - 로그 식별용 접두사
     */
    private async deleteOldNotices(logPrefix: string): Promise<void> {
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
    // 4. DB 조작 및 삭제 관련 메서드
    // ========================================

    /**
     * 오늘 날짜를 제외한 모든 공지사항 삭제
     * @param {string} noticeType - 공지타입: INTERNATIONAL 또는 SWUNIV
     * @param todayDate - 오늘날짜: YYYY.MM.DD
     */
    private deleteNoticesExceptToday(noticeType: string, todayDate: string): Promise<void> {
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
     * @param {string} noticeType - 공지타입: INTERNATIONAL 또는 SWUNIV
     * @param {Notice[]} notices - 크롤링한 원본 공지사항 객체 배열
     * @returns {Promise<Notice[]>} - 오늘 날짜의 필터링된 새로운 공지사항 객체 배열
     */
    private async filterNewNotices(noticeType: string, notices: Notice[]): Promise<Notice[]> {
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
    private saveNotice(noticeType: string, notice: Notice): Promise<void> {
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

    // ========================================
    // 5. 유틸리티 메서드
    // ========================================

    /**
     * 오늘 날짜(YYYY.MM.DD)를 반환
     * @returns {string} 오늘 날짜
     */
    private getTodayDate(): string {
        return dayjs().format('YYYY.MM.DD');
    }
}