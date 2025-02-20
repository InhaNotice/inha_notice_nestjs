import { Injectable, Logger, Scope } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Notice } from 'src/notices/interfaces/notice.interface';
import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as dayjs from 'dayjs';
import * as fs from 'fs';
import { WholeNoticeScraperService } from 'src/notices/scraper/whole-notice-scraper.service';

/**
 * 학사 공지 스캐줄러
 * 
 * 주요 기능
 * - 학사 공지를 크롤링하여 새로운 공지가 존재시 FCM 알림 전송
 * - 오래된 공지사항 주기적으로 삭제 진행
 * - 캐싱 전략을 사용한 효율적인 연산
 * 
 * 목차
 * 1. 초기화 관련 메서드
 * 2. 스케줄링 메서드 (Cron)
 * 3. 주요 비즈니스 로직 (크롤링, 알림)
 * 4. DB 조작 및 삭제 관련 메서드
 * 5. 유틸리티 메서드
 */
@Injectable({ scope: Scope.DEFAULT })
export class WholeNoticeSchedulerService {
    private readonly logger: Logger = new Logger(WholeNoticeSchedulerService.name);
    private readonly databaseDir: string = path.join(process.cwd(), 'database', 'whole');
    private readonly dbPath: string = path.join(process.cwd(), 'database', 'whole', 'WHOLE.db');
    private db: sqlite3.Database;
    private cachedNoticeIds: Set<string> = new Set();

    constructor(
        private readonly wholeNoticeScraperService: WholeNoticeScraperService,
        private readonly firebaseService: FirebaseService,
    ) {
        this.initializeDatabaseDir();
        this.initializeDatabase();
    }

    // ========================================
    // 1. 초기화 관련 메서드
    // ========================================

    /**
    * databaseDir 디렉터리 존재 확인 및 생성 함수
    */
    private initializeDatabaseDir(): void {

        if (!fs.existsSync(this.databaseDir)) {
            fs.mkdirSync(this.databaseDir, { recursive: true });
        }
    }

    /**
     * 데이터베이스 연결 및 생성
     */
    private initializeDatabase(): void {
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                this.logger.error('🚨 SQLite 데이터베이스 연결 실패:', err.message);
            } else {
                this.initializeDatabaseTable();
            }
        })
    }

    /**
     * SQLite 테이블 생성 (없다면 자동 생성)
     */
    private initializeDatabaseTable(): void {
        this.db.run(
            `CREATE TABLE IF NOT EXISTS notices (
                    id TEXT PRIMARY KEY,
                    title TEXT,
                    link TEXT,
                    date TEXT
                )`,
            (err) => {
                if (err) {
                    this.logger.error('🚨 학사(WHOLE) 테이블 생성 실패:', err.message);
                } else {
                    // 서버 시작 시 최초 1회 캐싱 로딩
                    this.loadCache();
                }
            }
        );
    }

    /**
     * 서버 시작 또는 공지사항 삭제 후, 새롭게 데이터베이스에서 불러와 공지사항 Id를 캐싱함
     * 
     * 참고: File를 불러와 공지사항 Id 캐싱함. 데이터 누락될 가능성 없음
     */
    private loadCache(): void {
        this.cachedNoticeIds = new Set();

        this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='notices'", (err, row) => {
            if (err) {
                this.logger.error(`❌ 학사 SQLite 테이블 확인 중 오류 발생: ${err.message}`);
                return;
            }

            if (!row) {
                this.logger.warn(`⛔️ 학사 notices 테이블이 존재하지 않아 캐시를 로드하지 않습니다.`);
                return;
            }

            // notices 테이블이 존재하면 캐시 로드 실행
            this.db.all("SELECT id FROM notices", [], (err, rows) => {
                if (err) {
                    this.logger.error(`❌ 학사 SQLite 캐시 로드 중 오류 발생: ${err.message}`);
                } else {
                    this.cachedNoticeIds = new Set(rows.map(row => (row as { id: string }).id));
                    this.logger.log(`✅ 학사 캐싱된 공지사항 ID 로드 완료 (${this.cachedNoticeIds.size}개)`);
                }
            });
        });
    }


    // ========================================
    // 2. 스케줄링 메서드 (Cron)
    // ========================================

    /**
     * 평일(월~금) 9시~16시 59분, 10분 간격으로 학사 공지 크롤링
     */
    @Cron('0 */10 9-16 * * 1-5', { timeZone: 'Asia/Seoul' })
    async handleWeekDaysCron() {
        await this.executeCrawling('학사 정기(9~16시)');
    }

    /**
     * 평일(월~금) 17시~23시, 30분 간격으로 학사 공지 크롤링
     */
    @Cron('0 */30 16-22 * * 1-5', { timeZone: 'Asia/Seoul' })
    async handleEveningCron() {
        await this.executeCrawling('학사 저녁(16~22시)');
    }

    /**
     * 주말(토~일) 9시~23시, 30분 간격으로 학사 공지 크롤링
     */
    @Cron('0 */30 9-22 * * 6-7', { timeZone: 'Asia/Seoul' })
    async handleWeekendCron() {
        await this.executeCrawling('학사 주말(9~22시)');
    }

    /**
     * 평일(월~금) 23시, 1회 오늘 날짜가 아닌 공지사항 삭제
     * 
     * 참고: 오늘 날짜 포함한 모든 공지 삭제시 크롤링이 다시 진행된다면 푸시 알림 발생 가능하지만,
     * 오늘 날짜가 아닌 공지사항 삭제시 그러한 문제가 발생해도 아무런 영향 없음
     */
    @Cron('0 0 23 * * 1-5', { timeZone: 'Asia/Seoul' })
    async deleteOldNotices() {
        const todayDate: string = this.getTodayDate();

        try {
            await this.deleteNoticesExceptToday(todayDate);
        } catch (error) {
            this.logger.error(`🚨 학사 오래된 공지사항 삭제 중 오류 발생: ${error.message}`);
        } finally {
            this.logger.log('🏁 학사 오래된 공지사항 삭제 작업 완료!');
        }
    }

    // ========================================
    // 3. 주요 비즈니스 로직 (크롤링, 알림)
    // ========================================

    /**
     * 학사 공지사항 크롤링
     * @param {string} logPrefix - 로그 식별용 접두사
     */
    private async executeCrawling(logPrefix: string): Promise<void> {
        this.logger.log(`📌 ${logPrefix} 크롤링 실행 중...`);

        try {
            const allNotices: Notice[] = await this.wholeNoticeScraperService.fetchNotices(1);
            const newNotices: Notice[] = await this.filterNewNotices(allNotices);

            // 새로운 공지사항이 존재하지 않으면 종료
            if (newNotices.length === 0) {
                return;
            }

            for (const notice of newNotices) {
                this.logger.log(`🚀 ${logPrefix} 새로운 공지 발견: ${notice.title}`);

                // 배포 환경일 때만 FCM 알림 전송
                if (process.env.NODE_ENV === 'production') {
                    await this.firebaseService.sendWholeNotification(notice.title, {
                        id: notice.id,
                        link: notice.link,
                    });
                } else {
                    this.logger.debug(`🔕 ${logPrefix} 개발 환경이므로 푸시 알림을 전송하지 않습니다.`);
                }

                // File에 기록
                await this.saveNotice(notice);
                // 캐시에 새로운 공지 Id 추가
                this.cachedNoticeIds.add(notice.id);
            }
        } catch (error) {
            this.logger.error(`❌ ${logPrefix} 크롤링 중 오류 발생: ${error.message}`);
        } finally {
            this.logger.log(`🏁 ${logPrefix} 크롤링 끝!`);
        }
    }

    // ========================================
    // 4. DB 조작 및 삭제 관련 메서드
    // ========================================

    /**
     * 오늘 날짜를 제외한 모든 공지사항 삭제
     * @param {string} todayDate - 오늘날짜: YYYY.MM.DD
     */
    private deleteNoticesExceptToday(todayDate: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(
                `DELETE FROM notices WHERE date != ?`,
                [todayDate],
                (err) => {
                    if (err) {
                        this.logger.error(`🚨 학사 오래된 공지사항 삭제 실패: ${err.message}`);
                        reject(err);
                    } else {
                        this.logger.log('🗑️ 학사 오늘이 아닌 공지사항 삭제 완료');
                        // 공지사항 삭제 후, 최신 상태로 캐싱 업데이트
                        this.loadCache();
                        resolve();
                    }
                }
            );
        });
    }


    /**
     * 오늘 날짜의 필터링된 새로운 공지사항 객체 배열 반환
     * @param {Notice[]} notices - 크롤링한 원본 공지사항 객체 배열
     * @returns {Promise<Notice[]>} - 오늘 날짜의 필터링된 새로운 공지사항 객체 배열
     */
    private async filterNewNotices(notices: Notice[]): Promise<Notice[]> {
        // todayDate: YYYY.MM.DD
        const todayDate: string = this.getTodayDate();
        // todayNotices: 오늘 날짜 필터링한 공지사항 객체 배열
        const todayNotices: Notice[] = notices.filter((notice) => notice.date === todayDate);

        // newNotices: 오늘 날짜의 필터링된 새로운 공지사항 객체 배열
        // 캐싱된 기존의 공지와 비교하여 새로운 공지사항만 선별
        const newNotices: Notice[] = todayNotices.filter(notice => !this.cachedNoticeIds.has(notice.id));

        return newNotices;
    }

    // 학과별 새로운 공지사항 ID를 데이터베이스에 저장
    /**
     * 새로운 공지를 데이터베이스에 저장
     * @param {Notice} notice - 새로운 공지사항 객체
     */
    private saveNotice(notice: Notice): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(
                "INSERT OR IGNORE INTO notices (id, title, link, date) VALUES (?, ?, ?, ?)",
                [notice.id, notice.title, notice.link, notice.date],
                (err) => {
                    if (err) {
                        this.logger.error(`❌ 학사 SQLite 저장 중 오류 발생: ${err.message}`);
                        reject(err);
                    } else {
                        this.logger.log(`✅ 학사 새로운 공지사항 ID 저장 완료: ${notice.id}`);
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
