/*
 * This is file of the project inha_notice
 * Licensed under the MIT License.
 * Copyright (c) 2025-2026 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2026-01-29
 */

import { Logger } from '@nestjs/common';
import { performance } from 'perf_hooks';

export class GlobalDBMonitor {
    private static logger = new Logger('DB_COLD_START');
    private static startTime = performance.now();
    private static startMemory = process.memoryUsage().heapUsed;
    private static totalExpected = 0;
    private static connectedCount = 0;
    private static activeSchedulers = 0;

    /**
     * 바이트 단위를 MB로 변환하는 헬퍼 함수
     */
    private static toMB(bytes: number): string {
        return (bytes / 1024 / 1024).toFixed(2);
    }

    /**
     * 스케줄러가 초기화될 때 호출 (예: 5개의 스케줄러가 각각 호출)
     */
    static registerScheduler(dbCount: number) {
        this.activeSchedulers++;
        this.totalExpected += dbCount;
    }

    /**
     * 개별 DB 연결이 성공할 때마다 호출
     */
    static reportSuccess() {
        this.connectedCount++;
        this.checkFinished();
    }

    private static checkFinished() {
        if (this.totalExpected > 0 && this.connectedCount === this.totalExpected) {
            const endTime = performance.now();
            const duration = (endTime - this.startTime).toFixed(2);

            // [추가됨] 종료 시점 메모리 스냅샷
            const endMemory = process.memoryUsage().heapUsed;
            const memoryDiff = endMemory - this.startMemory;
            const diffSign = memoryDiff > 0 ? '+' : ''; // 부호 표시

            this.logger.log(`\n=============================================================`);
            this.logger.log(`🚀 [System Cold Start] 모든 스케줄러 DB 연결 완료`);
            this.logger.log(`📊 총 연결된 DB 파일 수 : ${this.connectedCount}개`);
            this.logger.log(`⏱️ 총 소요 시간        : ${duration}ms`);
            this.logger.log(`-------------------------------------------------------------`);
            this.logger.log(`💾 Heap Memory Usage (추정치):`);
            this.logger.log(`   - 초기 (Start)      : ${this.toMB(this.startMemory)} MB`);
            this.logger.log(`   - 직후 (End)        : ${this.toMB(endMemory)} MB`);
            this.logger.log(`   - 증가량 (Delta)    : ${diffSign}${this.toMB(memoryDiff)} MB`);
            this.logger.log(`=============================================================\n`);
        }
    }
}