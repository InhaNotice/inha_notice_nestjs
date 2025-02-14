import { Injectable, Logger, Scope } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Notice } from 'src/notices/interfaces/notice.interface';
import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as dayjs from 'dayjs';
import * as fs from 'fs';
import { WholeNoticeScraperService } from 'src/notices/scraper/whole-notice-scraper.service';

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

    @Cron('0 */10 9-16 * * 1-5', { timeZone: 'Asia/Seoul' })
    async handleWeekDaysCron() {
        await this.executeCrawling('학사 정기(9~16시)');
    }

    @Cron('0 */30 16-22 * * 1-5', { timeZone: 'Asia/Seoul' })
    async handleEveningCron() {
        await this.executeCrawling('학사 저녁(16~22시)');
    }

    @Cron('0 */30 9-22 * * 6-7', { timeZone: 'Asia/Seoul' })
    async handleWeekendCron() {
        await this.executeCrawling('학사 주말(9~22시)');
    }

    // 오늘 날짜가 아닌 공지사항 삭제 진행
    @Cron('0 0 23 * * 1-5', { timeZone: 'Asia/Seoul' })
    async deleteOldNotices() {
        this.logger.log('🗑️ 학사 오래된 공지사항 삭제 작업 시작...');

        const todayDate: string = this.getTodayDate();

        try {
            await this.deleteNoticesExceptToday(todayDate);
        } catch (error) {
            this.logger.error(`🚨 학사 오래된 공지사항 삭제 중 오류 발생: ${error.message}`);
        } finally {
            this.logger.log('🏁 학사 오래된 공지사항 삭제 작업 완료!');
        }
    }

    // database/whole 디렉터리 존재 여부 확인
    private initializeDatabaseDir(): void {

        if (!fs.existsSync(this.databaseDir)) {
            fs.mkdirSync(this.databaseDir, { recursive: true });
        }
    }

    private initializeDatabase(): void {
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                this.logger.error('🚨 SQLite 데이터베이스 연결 실패:', err.message);
            } else {
                this.initializeDatabaseTable();
            }
        })
    }

    // SQLite 테이블 생성 (없다면 자동 생성)
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
                    this.loadCache(); // 서버 시작 시 캐싱 데이터 로드
                }
            }
        );
    }

    // 서버 시작 시 기존 데이터 로드 & 캐싱
    private loadCache(): void {
        this.cachedNoticeIds = new Set();

        this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='notices'", (err, row) => {
            if (err) {
                this.logger.error(`🚨 학사 SQLite 테이블 확인 중 오류 발생: ${err.message}`);
                return;
            }

            if (!row) {
                this.logger.warn(`⚠️ 학사 notices 테이블이 존재하지 않아 캐시를 로드하지 않습니다.`);
                return;
            }

            // ✅ notices 테이블이 존재하면 캐시 로드 실행
            this.db.all("SELECT id FROM notices", [], (err, rows) => {
                if (err) {
                    this.logger.error(`🚨 학사 SQLite 캐시 로드 중 오류 발생: ${err.message}`);
                } else {
                    this.cachedNoticeIds = new Set(rows.map(row => (row as { id: string }).id));
                    this.logger.log(`✅ 학사 캐싱된 공지사항 ID 로드 완료 (${this.cachedNoticeIds.size}개)`);
                }
            });
        });
    }

    // 학사 공지사항 크롤링 함수
    private async executeCrawling(logPrefix: string) {
        this.logger.log(`📌 ${logPrefix} 크롤링 실행 중...`);

        try {
            const allNotices: Notice[] = await this.wholeNoticeScraperService.fetchNotices(1);
            const newNotices: Notice[] = await this.filterNewNotices(allNotices);

            if (newNotices.length === 0) {
                this.logger.log(`✅ ${logPrefix} 새로운 공지가 없으므로 알림을 보내지 않습니다.`);
                return;
            }

            for (const notice of newNotices) {
                this.logger.log(`🚀 ${logPrefix} 새로운 공지 발견: ${notice.title}`);

                if (process.env.NODE_ENV === 'production') {
                    await this.firebaseService.sendWholeNotification(notice.title, {
                        id: notice.id,
                        link: notice.link,
                    });
                } else {
                    this.logger.debug(`🔕 ${logPrefix} 개발 환경이므로 푸시 알림을 전송하지 않습니다.`);
                }

                await this.saveLastNoticeId(notice);
                this.cachedNoticeIds.add(notice.id);
            }
        } catch (error) {
            this.logger.error(`🚨 ${logPrefix} 크롤링 중 오류 발생: ${error.message}`);
        } finally {
            this.logger.log(`🏁 ${logPrefix} 크롤링 끝!`);
        }
    }

    // WHOLE.db에서 삭제 진행
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
                        this.loadCache();
                        resolve();
                    }
                }
            );
        });
    }


    // 학과별 새로운 공지 필터링
    private async filterNewNotices(notices: Notice[]): Promise<Notice[]> {
        // 오늘 날짜의 공지만 필터링하여 반환
        const todayDate: string = this.getTodayDate();
        const todayNotices: Notice[] = notices.filter((notice) => notice.date === todayDate);

        // 캐싱된 공지사항 ID를 활용하여 필터링
        const newNotices: Notice[] = todayNotices.filter(notice => !this.cachedNoticeIds.has(notice.id));

        return newNotices;
    }

    // 학과별 새로운 공지사항 ID를 데이터베이스에 저장
    private saveLastNoticeId(notice: Notice): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(
                "INSERT OR IGNORE INTO notices (id, title, link, date) VALUES (?, ?, ?, ?)",
                [notice.id, notice.title, notice.link, notice.date],
                (err) => {
                    if (err) {
                        this.logger.error(`🚨 학사 SQLite 저장 중 오류 발생: ${err.message}`);
                        reject(err);
                    } else {
                        this.logger.log(`✅ 학사 새로운 공지사항 ID 저장 완료: ${notice.id}`);
                        resolve();
                    }
                }
            );
        });
    }

    private getTodayDate(): string {
        return dayjs().format('YYYY.MM.DD');
    }
}
