/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-12
 */
import * as fs from 'fs';
import * as path from 'path';
import * as dayjs from 'dayjs';
import { Injectable, Logger } from "@nestjs/common";
import { Cron } from '@nestjs/schedule';
import { UndergraduateConstant } from "src/constants/calendar/scheduler/undergraduate.constant";
import { FirebaseService } from 'src/firebase/firebase.service';
import { IdentifierConstants } from 'src/constants/identifiers';

@Injectable()
export class UndergraduateScheduler {
    private logger: Logger;

    constructor(private readonly firebaseService: FirebaseService) {
        this.logger = new Logger(UndergraduateScheduler.name);
    }

    @Cron(UndergraduateConstant.UNDERGRADUATE_DAY_BEFORE_REMINDER, { timeZone: 'Asia/Seoul' })
    async handleDayBeforeReminder() {
        const targetDate = dayjs().add(1, 'day').format('YYYY-MM-DD');
        await this.handleReminder(targetDate, 'undergraduate-schedule-d1-notification');
    }

    @Cron(UndergraduateConstant.UNDERGRADUATE_TODAY_REMINDER, { timeZone: 'Asia/Seoul' })
    async handleTodayReminder() {
        const targetDate = dayjs().format('YYYY-MM-DD');
        await this.handleReminder(targetDate, 'undergraduate-schedule-dd-notification');
    }

    private async handleReminder(targetDate: string, noticeType: string): Promise<void> {
        const schedulePath = path.join(__dirname, '../../config/undergraduate_schedule.json');
        const rawData = fs.readFileSync(schedulePath, 'utf8');
        const schedule: Schedule = JSON.parse(rawData);

        for (const events of Object.values(schedule)) {
            for (const event of events) {
                if (event.startDate === targetDate && event.title.length !== 0) {
                    const currentTime = new Date();
                    const data: Record<string, string> = {
                        id: currentTime.getTime().toString(),
                        date: targetDate,
                    };
                    if (process.env.NODE_ENV === IdentifierConstants.kProduction) {
                        await this.sendFirebaseCalendarMessaging(noticeType, event.title, data);
                    } else {
                        this.logger.debug(`🔕 ${noticeType}의 새로운 공지 - ${data.id}-${data.date}`);
                    }
                }
            }
        }
    }

    async sendFirebaseCalendarMessaging(noticeType: string, noticeTitle: string, data?: Record<string, string>): Promise<void> {
        return this.firebaseService.sendCalendarNotification(
            noticeType,
            noticeTitle,
            data,
        )
    }
}