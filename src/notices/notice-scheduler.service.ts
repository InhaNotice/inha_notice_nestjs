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
    private readonly logger = new Logger(NoticeSchedulerService.name);
    private static readonly databaseDir = path.join(process.cwd(), 'database');
    private static readonly dbPath = path.join(NoticeSchedulerService.databaseDir, 'notices.db');
    private db: sqlite3.Database;
    private cachedNoticeIds: Set<string> = new Set(); // ✅ 공지사항 ID 캐싱

    constructor(
        private readonly noticeScraperService: MajorNoticeScraperService,
        private readonly firebaseService: FirebaseService,
    ) {
        NoticeSchedulerService.initializeDatabaseDirectory(); // ✅ DB 폴더가 없으면 미리 생성

        this.db = new sqlite3.Database(NoticeSchedulerService.dbPath, (err) => {
            if (err) {
                this.logger.error('🚨 SQLite 데이터베이스 연결 실패:', err.message);
            } else {
                this.logger.log(`✅ SQLite 데이터베이스 연결 성공: ${NoticeSchedulerService.dbPath}`);
                this.initializeDatabase();
                this.loadCache(); // ✅ 서버 시작 시 캐싱 데이터 로드
            }
        });
    }

    // ✅ 데이터베이스 폴더가 없으면 생성하는 정적 메서드
    private static initializeDatabaseDirectory(): void {
        if (!fs.existsSync(this.databaseDir)) {
            try {
                fs.mkdirSync(this.databaseDir, { recursive: true });
                console.log(`✅ 데이터베이스 디렉터리 생성 완료: ${this.databaseDir}`);
            } catch (err) {
                console.error(`🚨 데이터베이스 디렉터리 생성 실패: ${err.message}`);
                process.exit(1); // 🚨 치명적인 오류로 인해 프로세스 종료
            }
        }
    }

    // ✅ SQLite 테이블 생성 (없다면 자동 생성)
    private initializeDatabase(): void {
        this.db.run(
            `CREATE TABLE IF NOT EXISTS notices (
                id TEXT PRIMARY KEY,
                title TEXT,
                link TEXT,
                date TEXT
            )`,
            (err) => {
                if (err) {
                    this.logger.error('🚨 notices 테이블 생성 실패:', err.message);
                } else {
                    this.logger.log('✅ notices 테이블 생성 완료');
                }
            }
        );
    }

    // ✅ 서버 시작 시 기존 데이터 로드 & 캐싱 (테이블이 존재할 때만 실행)
    private loadCache(): void {
        this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='notices'", (err, row) => {
            if (err) {
                this.logger.error('🚨 SQLite 테이블 확인 중 오류 발생:', err.message);
                return;
            }

            if (!row) {
                this.logger.warn('⚠️ notices 테이블이 존재하지 않아 캐시를 로드하지 않습니다.');
                return;
            }

            // ✅ notices 테이블이 존재하면 캐시 로드 실행
            this.db.all("SELECT id FROM notices", [], (err, rows) => {
                if (err) {
                    this.logger.error('🚨 SQLite 캐시 로드 중 오류 발생:', err.message);
                } else {
                    this.cachedNoticeIds = new Set(rows.map(row => (row as { id: string }).id));
                    this.logger.log(`✅ 캐싱된 공지사항 ID 로드 완료 (${this.cachedNoticeIds.size}개)`);
                }
            });
        });
    }

    @Cron('0 */10 9-16 * * *', { timeZone: 'Asia/Seoul' })
    async handleCron() {
        this.logger.log('📌 정기 크롤링 실행 중...');

        try {
            const notices = await this.noticeScraperService.fetchNotices(1);
            const todayNotices = this.getTodayNotices(notices.general);

            if (todayNotices.length === 0) {
                this.logger.log('🔹 오늘 날짜로 등록된 새로운 공지사항이 없습니다.');
                return;
            }

            // 🔹 캐싱된 공지사항 ID를 활용하여 필터링
            const newNotices = todayNotices.filter(notice => !this.cachedNoticeIds.has(notice.id));

            if (newNotices.length === 0) {
                this.logger.log('✅ 새로운 공지가 없으므로 알림을 보내지 않습니다.');
                return;
            }

            for (const notice of newNotices) {
                this.logger.log(`🚀 새로운 공지 발견: ${notice.title}`);

                // ✅ FCM을 통해 푸시 알림 보내기
                // await this.firebaseService.sendNotificationToAll(
                //     "[학과] 새로운 공지사항이 있습니다!",
                //     notice.title,
                //     { url: notice.link }
                // );

                // ✅ 새로운 공지사항 ID를 데이터베이스 및 캐싱에 추가
                await this.saveLastNoticeId(notice.id, notice.title, notice.link, notice.date);
                this.cachedNoticeIds.add(notice.id); // ✅ 캐시 업데이트
            }
        } catch (error) {
            this.logger.error('🚨 크롤링 중 오류 발생:', error);
        }
    }

    // ✅ 오늘 날짜의 공지만 필터링하여 반환
    private getTodayNotices(notices: Notice[]): Notice[] {
        const todayDate = dayjs().format('YYYY.MM.DD');
        return notices.filter((notice) => notice.date === todayDate);
    }

    // ✅ 새로운 공지사항 ID를 데이터베이스에 저장
    private saveLastNoticeId(id: string, title: string, link: string, date: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(
                "INSERT OR IGNORE INTO notices (id, title, link, date) VALUES (?, ?, ?, ?)",
                [id, title, link, date],
                (err) => {
                    if (err) {
                        this.logger.error('🚨 SQLite 저장 중 오류 발생:', err.message);
                        reject(err);
                    } else {
                        this.logger.log(`✅ 새로운 공지사항 ID 저장 완료: ${id}`);
                        resolve();
                    }
                }
            );
        });
    }
}