import { Injectable, Logger, Scope } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MajorNoticeScraperService } from 'src/notices/major-notice-scraper.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Notice } from 'src/notices/interfaces/notice.interface';
import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as dayjs from 'dayjs';
import * as fs from 'fs';

@Injectable({ scope: Scope.DEFAULT })
export class NoticeSchedulerService {
    private readonly logger: Logger = new Logger(NoticeSchedulerService.name);
    private readonly databaseDir: string = path.join(process.cwd(), 'database');
    private databases: Record<string, sqlite3.Database> = {};
    private cachedNoticeIds: Record<string, Set<string>> = {}; // ✅ 학과별 공지사항 ID 캐싱

    constructor(
        private readonly noticeScraperService: MajorNoticeScraperService,
        private readonly firebaseService: FirebaseService,
    ) {
        this.initializeDatabaseDirectory(); // ✅ DB 폴더가 없으면 미리 생성
        this.initializeDatabases(); // ✅ 학과별 데이터베이스 생성
    }

    // ✅ 데이터베이스 폴더가 없으면 생성하는 메서드
    private initializeDatabaseDirectory(): void {
        if (!fs.existsSync(this.databaseDir)) {
            try {
                fs.mkdirSync(this.databaseDir, { recursive: true });
                this.logger.log(`✅ 데이터베이스 디렉터리 생성 완료: ${this.databaseDir}`);
            } catch (err) {
                this.logger.error(`🚨 데이터베이스 디렉터리 생성 실패: ${err.message}`);
                process.exit(1); // 🚨 치명적인 오류로 인해 프로세스 종료
            }
        }
    }

    // ✅ 학과별 SQLite 데이터베이스 초기화
    private initializeDatabases(): void {
        const majors: string[] = this.noticeScraperService.getAllMajors(); // 🔹 학과 목록 가져오기
        for (const major of majors) {
            const dbPath: string = path.join(this.databaseDir, `${major}.db`);
            this.databases[major] = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    this.logger.error(`🚨 ${major} 데이터베이스 연결 실패: ${err.message}`);
                } else {
                    this.logger.log(`✅ ${major} 데이터베이스 연결 성공: ${dbPath}`);
                    this.initializeTable(major);
                }
            });
        }
    }

    // ✅ 학과별 SQLite 테이블 생성 (없다면 자동 생성)
    private initializeTable(major: string): void {
        this.databases[major].run(
            `CREATE TABLE IF NOT EXISTS notices (
                id TEXT PRIMARY KEY,
                title TEXT,
                link TEXT,
                date TEXT
            )`,
            (err) => {
                if (err) {
                    this.logger.error(`🚨 ${major} 테이블 생성 실패: ${err.message}`);
                } else {
                    this.logger.log(`✅ ${major} notices 테이블 생성 완료`);
                    this.loadCache(major); // ✅ 테이블 생성 후 캐시 로드
                }
            }
        );
    }

    // ✅ 학과별 기존 데이터 로드 & 캐싱 (테이블이 존재할 때만 실행)
    private loadCache(major: string): void {
        this.cachedNoticeIds[major] = new Set();

        this.databases[major].get("SELECT name FROM sqlite_master WHERE type='table' AND name='notices'", (err, row) => {
            if (err) {
                this.logger.error(`🚨 ${major} SQLite 테이블 확인 중 오류 발생: ${err.message}`);
                return;
            }

            if (!row) {
                this.logger.warn(`⚠️ ${major} notices 테이블이 존재하지 않아 캐시를 로드하지 않습니다.`);
                return;
            }

            // ✅ notices 테이블이 존재하면 캐시 로드 실행
            this.databases[major].all("SELECT id FROM notices", [], (err, rows) => {
                if (err) {
                    this.logger.error(`🚨 ${major} SQLite 캐시 로드 중 오류 발생: ${err.message}`);
                } else {
                    this.cachedNoticeIds[major] = new Set(rows.map(row => (row as { id: string }).id));
                    this.logger.log(`✅ ${major} 캐싱된 공지사항 ID 로드 완료 (${this.cachedNoticeIds[major].size}개)`);
                }
            });
        });
    }

    @Cron('0 */10 9-16 * * *', { timeZone: 'Asia/Seoul' })
    async handleCron() {
        this.logger.log('📌 정기 크롤링 실행 중...');

        try {
            const allNotices: Record<string, Notice[]> = await this.noticeScraperService.fetchNoticesForAllMajors();

            for (const major of Object.keys(allNotices)) {
                const newNotices: Notice[] = await this.filterNewNotices(major, allNotices[major]);

                if (newNotices.length === 0) {
                    this.logger.log(`✅ ${major}학과의 새로운 공지가 없으므로 알림을 보내지 않습니다.`);
                    continue;
                }

                for (const notice of newNotices) {
                    this.logger.log(`🚀 ${major} 새로운 공지 발견: ${notice.title}`);

                    // ✅ 학과별 FCM 푸시 알림 전송
                    // await this.firebaseService.sendNotificationToAll(
                    //     `[${major.toUpperCase()}] 새로운 공지사항이 있습니다!`,
                    //     notice.title,
                    //     { url: notice.link }
                    // );

                    // ✅ 새로운 공지사항 ID를 데이터베이스 및 캐싱에 추가
                    await this.saveLastNoticeId(major, notice);
                    this.cachedNoticeIds[major].add(notice.id);
                }
            }
        } catch (error) {
            this.logger.error('🚨 크롤링 중 오류 발생:', error);
        } finally {
            this.logger.log('🏁 정기 크롤링 끝!');
        }
    }

    // ✅ 학과별 새로운 공지 필터링
    private async filterNewNotices(major: string, notices: Notice[]): Promise<Notice[]> {
        // ✅ 오늘 날짜의 공지만 필터링하여 반환
        const todayDate: string = dayjs().format('YYYY.MM.DD');
        const todayNotices: Notice[] = notices.filter((notice) => notice.date === todayDate);

        // 🔹 캐싱된 공지사항 ID를 활용하여 필터링
        const newNotices: Notice[] = todayNotices.filter(notice => !this.cachedNoticeIds[major].has(notice.id));

        return newNotices;
    }

    // ✅ 학과별 새로운 공지사항 ID를 데이터베이스에 저장
    private saveLastNoticeId(major: string, notice: Notice): Promise<void> {
        return new Promise((resolve, reject) => {
            this.databases[major].run(
                "INSERT OR IGNORE INTO notices (id, title, link, date) VALUES (?, ?, ?, ?)",
                [notice.id, notice.title, notice.link, notice.date],
                (err) => {
                    if (err) {
                        this.logger.error(`🚨 ${major} SQLite 저장 중 오류 발생: ${err.message}`);
                        reject(err);
                    } else {
                        this.logger.log(`✅ ${major} 새로운 공지사항 ID 저장 완료: ${notice.id}`);
                        resolve();
                    }
                }
            );
        });
    }
}