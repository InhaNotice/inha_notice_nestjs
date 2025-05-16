/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-16
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dayjs from 'dayjs';
import { Injectable, Logger } from "@nestjs/common";
import { Cron } from '@nestjs/schedule';
import { UNDERGRADUATE_CRON } from "src/constants/crons/undergraduate.cron.constant";
import { FirebaseService } from 'src/firebase/firebase.service';
import { FirebaseNotificationContext } from 'src/firebase/firebase-notification.context';
import { UndergraudateState } from 'src/firebase/notifications/states/undergraduate.state';
import { ConfigService } from '@nestjs/config';
import { IDENTIFIER_CONSTANT } from 'src/constants/identifiers/identifier.constant';

@Injectable()
export class UndergraduateScheduler {
    private readonly context: FirebaseNotificationContext;
    private readonly logger: Logger;

    constructor(private readonly firebaseService: FirebaseService, private readonly configService: ConfigService) {
        this.context = new FirebaseNotificationContext(new UndergraudateState());
        this.logger = new Logger(UndergraduateScheduler.name);
    }

    @Cron(UNDERGRADUATE_CRON.UNDERGRADUATE_DAY_BEFORE_REMINDER, { timeZone: 'Asia/Seoul' })
    async handleDayBeforeReminder() {
        const targetDate = dayjs().add(1, 'day').format('YYYY-MM-DD');
        await this.handleReminder(targetDate, 'undergraduate-schedule-d1-notification');
    }

    @Cron(UNDERGRADUATE_CRON.UNDERGRADUATE_TODAY_REMINDER, { timeZone: 'Asia/Seoul' })
    async handleTodayReminder() {
        const targetDate = dayjs().format('YYYY-MM-DD');
        await this.handleReminder(targetDate, 'undergraduate-schedule-dd-notification');
    }

    private async handleReminder(targetDate: string, topic: string): Promise<void> {
        const schedulePath = path.join(__dirname, '../../config/undergraduate_schedule.json');
        const rawData = fs.readFileSync(schedulePath, 'utf8');
        const schedule: Schedule = JSON.parse(rawData);

        for (const events of Object.values(schedule)) {
            for (const event of events) {
                if (event.startDate === targetDate && event.title.length !== 0) {
                    const currentTime: Date = new Date();
                    const notificationTitle: string = this.context.getNotificationTitle(topic);
                    const notificationBody: string = event.title;
                    const data: Record<string, string> = {
                        id: currentTime.getTime().toString(),
                        link: this.configService.get<Record<string, string>>('calendar')?.INHA_CALENDAR || '',
                        date: targetDate,
                    }

                    if (process.env.NODE_ENV === IDENTIFIER_CONSTANT.kProduction) {
                        await this.firebaseService.sendNotificationToTopic(topic, notificationTitle, notificationBody, data);
                    } else {
                        this.logger.debug(`🔕 ${topic}의 새로운 공지 - ${notificationTitle}-${data.targetDate}`);
                    }
                }
            }
        }
    }
}