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
import { Injectable } from "@nestjs/common";
import { Cron } from '@nestjs/schedule';
import { UndergraduateConstant } from "src/constants/calendar/scheduler/undergraduate.constant";

@Injectable()
export class UndergraduateScheduler {
    @Cron(UndergraduateConstant.UNDERGRADUATE_DAY_BEFORE_REMINDER, { timeZone: 'Asia/Seoul' })
    async handleDayBeforeReminder() {
        const targetDate: string = dayjs().add(1, 'day').format('YYYY-MM-DD');
        const schedulePath: string = path.join(__dirname, '../../config/undergraduate_schedule.json');
        const rawData: string = fs.readFileSync(schedulePath, 'utf8');
        const schedule: Schedule = JSON.parse(rawData);

        const matchedEvents: ScheduleEvent[] = [];

        for (const events of Object.values(schedule)) {
            for (const event of events) {
                if (event.startDate === targetDate) {
                    matchedEvents.push(event);
                }
            }
        }
    }

    @Cron(UndergraduateConstant.UNDERGRADUATE_TODAY_REMINDER, { timeZone: 'Asia/Seoul' })
    async handleTodayReminder() {

    }

    async sendFirebaseMessaging(notice: Notice, noticeType: string): Promise<void> {
        return;
    }
}