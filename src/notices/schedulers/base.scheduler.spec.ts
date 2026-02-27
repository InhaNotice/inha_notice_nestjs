/*
 * This is file of the project inha_notice
 * Licensed under the MIT License.
 * Copyright (c) 2025-2026 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2026-02-27
 */

import { NotificationPayload } from 'src/interfaces/notification-payload.interface';
import { NoticeRepository } from 'src/database/notice.repository';
import { RiskWindowRepository } from 'src/database/risk-window.repository';
import { BaseScheduler } from 'src/notices/schedulers/base.scheduler';
import { Test, TestingModule } from '@nestjs/testing';

class TestSchedulerService extends BaseScheduler {
    constructor(
        noticeRepository: NoticeRepository,
        riskWindowRepository: RiskWindowRepository,
    ) {
        super();
        this['noticeRepository'] = noticeRepository;
        this['riskWindowRepository'] = riskWindowRepository;
        this.logger = {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
        } as any;

        this.scraperService = {
            fetchAllNotices: jest.fn(),
        } as any;
    };
    async sendFirebaseMessaging(notice: NotificationPayload, noticeType: string): Promise<void> {
        return;
    }
}


describe('BaseScheduler', () => {
    let service: TestSchedulerService;
    let noticeRepository: NoticeRepository;

    const mockNoticeRepository = {
        save: jest.fn(),
        deleteNoticesExcludingDate: jest.fn(),
    };

    const mockRiskWindowRepository = {
        save: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: NoticeRepository,
                    useValue: mockNoticeRepository,
                },
                {
                    provide: RiskWindowRepository,
                    useValue: mockRiskWindowRepository,
                },
            ],
        }).compile();

        noticeRepository = module.get<NoticeRepository>(NoticeRepository);
        const riskWindowRepository = module.get<RiskWindowRepository>(RiskWindowRepository);
        service = new TestSchedulerService(noticeRepository, riskWindowRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('executeCrawling 메서드는', () => {
        let sendFirebaseMessagingMock: jest.SpyInstance;
        let getTodayDateMock: jest.SpyInstance;

        beforeEach(() => {
            sendFirebaseMessagingMock = jest.spyOn<any, any>(service, 'sendFirebaseMessaging');
            // 날짜 고정 (2025.01.01)
            getTodayDateMock = jest.spyOn<any, any>(service, 'getTodayDate').mockReturnValue('2025.01.01');
        });

        it('오늘 날짜의 새로운 공지가 들어오면, 저장하고 알림을 보낸다.', async () => {
            // Arrange
            const notices: NotificationPayload[] = [{
                id: 'KR-1',
                title: 'New Notice',
                link: 'http://test.com',
                date: '2025.01.01', // 오늘 날짜
            }];

            jest.spyOn(service['scraperService'], 'fetchAllNotices').mockResolvedValue({
                'TEST': notices
            });
            // DB 저장 성공 (신규)
            mockNoticeRepository.save.mockResolvedValue(true);

            // Act
            await service['executeCrawling']('TEST_PREFIX');

            // Assert
            expect(mockNoticeRepository.save).toHaveBeenCalledWith('TEST', notices[0]);
            expect(mockRiskWindowRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    noticeType: 'TEST',
                    noticeId: 'KR-1',
                    riskWindowUs: expect.any(Number),
                }),
            );
            expect(sendFirebaseMessagingMock).toHaveBeenCalledWith(notices[0], 'TEST');
        });

        it('오늘 날짜지만 이미 DB에 있는 공지라면, 저장 시도하고 알림은 보내지 않는다.', async () => {
            // Arrange
            const notices: NotificationPayload[] = [{
                id: 'KR-1',
                title: 'Duplicate Notice',
                link: 'http://test.com',
                date: '2025.01.01', // 오늘 날짜
            }];

            jest.spyOn(service['scraperService'], 'fetchAllNotices').mockResolvedValue({
                'TEST': notices
            });
            // DB 저장 실패 (중복 -> false)
            mockNoticeRepository.save.mockResolvedValue(false);

            // Act
            await service['executeCrawling']('TEST_PREFIX');

            // Assert
            expect(mockNoticeRepository.save).toHaveBeenCalled();
            expect(sendFirebaseMessagingMock).not.toHaveBeenCalled(); // 알림 전송 X
        });

        it('오늘 날짜가 아닌 공지는 DB 저장 시도조차 하지 않는다 (Memory Filter).', async () => {
            // Arrange
            const notices: NotificationPayload[] = [{
                id: 'KR-Old',
                title: 'Old Notice',
                link: 'http://test.com',
                date: '2024.12.31', // 어제 날짜
            }];

            jest.spyOn(service['scraperService'], 'fetchAllNotices').mockResolvedValue({
                'TEST': notices
            });

            // Act
            await service['executeCrawling']('TEST_PREFIX');

            // Assert
            expect(mockNoticeRepository.save).not.toHaveBeenCalled(); // 저장 로직 호출 X
            expect(sendFirebaseMessagingMock).not.toHaveBeenCalled();
        });

        it('크롤링 중 에러 발생 시 로그를 남기고 종료한다 (프로세스 죽지 않음).', async () => {
            // Arrange
            const error = new Error('Scraping Failed');
            jest.spyOn(service['scraperService'], 'fetchAllNotices').mockRejectedValue(error);

            // Act
            await service['executeCrawling']('TEST_PREFIX');

            // Assert
            expect(service['logger'].error).toHaveBeenCalledWith(expect.stringContaining('Scraping Failed'));
        });

        it('위험구간 로그 저장에 실패해도 크롤링은 정상 진행된다.', async () => {
            // Arrange
            const notices: NotificationPayload[] = [{
                id: 'KR-1',
                title: 'New Notice',
                link: 'http://test.com',
                date: '2025.01.01',
            }];

            jest.spyOn(service['scraperService'], 'fetchAllNotices').mockResolvedValue({
                'TEST': notices,
            });
            mockNoticeRepository.save.mockResolvedValue(true);
            mockRiskWindowRepository.save.mockRejectedValue(new Error('DB Write Failed'));

            // Act
            await service['executeCrawling']('TEST_PREFIX');

            // Assert
            expect(sendFirebaseMessagingMock).toHaveBeenCalledWith(notices[0], 'TEST');
            expect(mockRiskWindowRepository.save).toHaveBeenCalled();
        });
    });

    describe('deleteOldNotices 메서드는', () => {
        it('Repository를 통해 오늘 날짜를 제외한 공지를 삭제한다.', async () => {
            // Arrange
            jest.spyOn<any, any>(service, 'getTodayDate').mockReturnValue('2025.01.01');
            mockNoticeRepository.deleteNoticesExcludingDate.mockResolvedValue(5); // 5개 삭제됨

            // Act
            await service['deleteOldNotices']('TEST_PREFIX');

            // Assert
            expect(mockNoticeRepository.deleteNoticesExcludingDate).toHaveBeenCalledWith('2025.01.01');
            expect(service['logger'].log).toHaveBeenCalledWith(expect.stringContaining('5건 삭제 완료'));
        });
    });

    describe('getTodayDate 메서드는', () => {
        it('YYYY.MM.DD 형식을 반환한다.', () => {
            const date = service['getTodayDate']();
            expect(date).toMatch(/^\d{4}\.\d{2}\.\d{2}$/);
        });
    });
});