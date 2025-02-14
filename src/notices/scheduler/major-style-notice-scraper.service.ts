import { Injectable, Logger, Scope } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MajorStyleNoticeScraperService } from 'src/notices/scraper/major-style-notice-scraper.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Notice } from 'src/notices/interfaces/notice.interface';
import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as dayjs from 'dayjs';
import * as fs from 'fs';

@Injectable({ scope: Scope.DEFAULT })
export class MajorStyleNoticeSchedulerService {
    private readonly logger: Logger = new Logger(MajorStyleNoticeSchedulerService.name);
    private readonly databaseDir: string = path.join(process.cwd(), 'database', 'major_styles');
    private databases: Record<string, sqlite3.Database> = {};
    private cachedNoticeIds: Record<string, Set<string>> = {}; // ✅ 학과 스타일 공지별 공지사항 ID 캐싱

    constructor(
        private readonly majorStyleNoticeScraperService: MajorStyleNoticeScraperService,
        private readonly firebaseService: FirebaseService,
    ) {
        this.initializeDatabaseDirectory(); // ✅ DB 폴더가 없으면 미리 생성
        this.initializeDatabases(); // ✅ 학과 스타일 공지별 데이터베이스 생성
    }

    // ✅ 데이터베이스 폴더가 없으면 생성하는 메서드
    private initializeDatabaseDirectory(): void {
        if (!fs.existsSync(this.databaseDir)) {
            try {
                fs.mkdirSync(this.databaseDir, { recursive: true });
            } catch (err) {
                this.logger.error(`🚨 데이터베이스 디렉터리 생성 실패: ${err.message}`);
                this.logger.warn(`⚠️ 데이터베이스 디렉터리를 생성하지 못했습니다. 일부 기능이 제한될 수 있습니다.`);
            }
        }
    }

    // ✅ 학과 스타일 공지별 SQLite 데이터베이스 초기화
    private initializeDatabases(): void {
        const noticeTypes: string[] = this.majorStyleNoticeScraperService.getAllNoticeTypes();
        for (const noticeType of noticeTypes) {
            const dbPath: string = path.join(this.databaseDir, `${noticeType}.db`);
            this.databases[noticeType] = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    this.logger.error(`🚨 ${noticeType} 데이터베이스 연결 실패: ${err.message}`);
                } else {
                    this.initializeTable(noticeType);
                }
            });
        }
    }

    // ✅ 학과 스타일 공지별 SQLite 테이블 생성 (없다면 자동 생성)
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
                    this.logger.error(`🚨 ${noticeType} 테이블 생성 실패: ${err.message}`);
                } else {
                    this.loadCache(noticeType); // ✅ 테이블 생성 후 캐시 로드
                }
            }
        );
    }

    // ✅ 학과 스타일 공지별 기존 데이터 로드 & 캐싱 (테이블이 존재할 때만 실행)
    private loadCache(noticeType: string): void {
        this.cachedNoticeIds[noticeType] = new Set();

        this.databases[noticeType].get("SELECT name FROM sqlite_master WHERE type='table' AND name='notices'", (err, row) => {
            if (err) {
                this.logger.error(`🚨 ${noticeType} SQLite 테이블 확인 중 오류 발생: ${err.message}`);
                return;
            }

            if (!row) {
                this.logger.warn(`⚠️ ${noticeType} notices 테이블이 존재하지 않아 캐시를 로드하지 않습니다.`);
                return;
            }

            // ✅ notices 테이블이 존재하면 캐시 로드 실행
            this.databases[noticeType].all("SELECT id FROM notices", [], (err, rows) => {
                if (err) {
                    this.logger.error(`🚨 ${noticeType} SQLite 캐시 로드 중 오류 발생: ${err.message}`);
                } else {
                    this.cachedNoticeIds[noticeType] = new Set(rows.map(row => (row as { id: string }).id));
                    this.logger.log(`✅ ${noticeType} 캐싱된 공지사항 ID 로드 완료 (${this.cachedNoticeIds[noticeType].size}개)`);
                }
            });
        });
    }

    @Cron('0 */10 9-16 * * 1-5', { timeZone: 'Asia/Seoul' })
    async handleCron() {
        this.logger.log('📌 학과 스타일(국제처, SW) 정기 크롤링 실행 중...');

        try {
            const allNotices: Record<string, Notice[]> = await this.majorStyleNoticeScraperService.fetchNoticesForAllNoticeTypes();

            for (const noticeType of Object.keys(allNotices)) {
                const newNotices: Notice[] = await this.filterNewNotices(noticeType, allNotices[noticeType]);

                if (newNotices.length === 0) {
                    this.logger.log(`✅ ${noticeType}의 새로운 공지가 없으므로 알림을 보내지 않습니다.`);
                    continue;
                }

                for (const notice of newNotices) {
                    this.logger.log(`🚀 ${noticeType} 새로운 공지 발견: ${notice.title}`);

                    // ✅ 학과 스타일 공지별 FCM 푸시 알림 전송
                    if (process.env.NODE_ENV === 'production') {
                        await this.firebaseService.sendMajorStyleNotification(
                            notice.title,
                            noticeType,
                            {
                                id: notice.id,
                                link: notice.link,
                            }
                        )
                    } else {
                        this.logger.debug('🔕 개발 환경이므로 푸시 알림을 전송하지 않습니다.');
                    }


                    // ✅ 새로운 공지사항 ID를 데이터베이스 및 캐싱에 추가
                    await this.saveLastNoticeId(noticeType, notice);
                    this.cachedNoticeIds[noticeType].add(notice.id);
                }
            }
        } catch (error) {
            this.logger.error('🚨 크롤링 중 오류 발생:', error.message);
        } finally {
            this.logger.log('🏁 학과 스타일(국제처, SW) 정기 크롤링 끝!');
        }
    }

    @Cron('0 0 17 * * 1-5', { timeZone: 'Asia/Seoul' })
    async deleteOldNotices() {
        this.logger.log('🗑️ 학과 스타일(국제처, SW) 오래된 공지사항 삭제 작업 시작...');

        const todayDate: string = dayjs().format('YYYY.MM.DD');

        try {
            for (const noticeType of Object.keys(this.databases)) {
                await this.deleteNoticesExceptToday(noticeType, todayDate);
            }
        } catch (error) {
            this.logger.error(`🚨 오래된 공지사항 삭제 중 오류 발생: ${error.message}`);
        } finally {
            this.logger.log('🏁 학과 스타일(국제처, SW) 오래된 공지사항 삭제 작업 완료!');
        }
    }

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
                        // 삭제 이후 캐시 재로딩 (최신 상태 유지 목적)
                        this.loadCache(noticeType);
                        resolve();
                    }
                }
            );
        });
    }

    // ✅ 학과 스타일 공지별 새로운 공지 필터링
    private async filterNewNotices(noticeType: string, notices: Notice[]): Promise<Notice[]> {
        // ✅ 오늘 날짜의 공지만 필터링하여 반환
        const todayDate: string = dayjs().format('YYYY.MM.DD');
        const todayNotices: Notice[] = notices.filter((notice) => notice.date === todayDate);

        // 🔹 캐싱된 공지사항 ID를 활용하여 필터링
        const newNotices: Notice[] = todayNotices.filter(notice => !this.cachedNoticeIds[noticeType].has(notice.id));

        return newNotices;
    }

    // ✅ 학과 스타일 공지별 새로운 공지사항 ID를 데이터베이스에 저장
    private saveLastNoticeId(noticeType: string, notice: Notice): Promise<void> {
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
}