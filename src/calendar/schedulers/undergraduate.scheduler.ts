/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-17
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dayjs from 'dayjs';
import { Injectable } from "@nestjs/common";
import { Cron } from '@nestjs/schedule';
import { UNDERGRADUATE_CRON } from "src/constants/crons/undergraduate.cron.constant";
import { FirebaseService } from 'src/firebase/firebase.service';
import { FirebaseNotificationContext } from 'src/firebase/firebase-notification.context';
import { UndergraudateState } from 'src/firebase/states/undergraduate.state';
import { ConfigService } from '@nestjs/config';
import { NotificationPayload } from 'src/interfaces/notification-payload.interface';
import { FirebaseMessagePayload, FirebaseNotifiable } from 'src/interfaces/firebase-notificable.interface';
import { IDENTIFIER_CONSTANT } from 'src/constants/identifiers/identifier.constant';

@Injectable()
export class UndergraduateScheduler extends FirebaseNotifiable {
    private readonly context: FirebaseNotificationContext;

    constructor(private readonly firebaseService: FirebaseService, private readonly configService: ConfigService) {
        super();
        this.context = new FirebaseNotificationContext(new UndergraudateState());
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
        const schedulePath = path.join(process.cwd(), 'assets', 'undergraduate-schedule.json');
        const rawData = fs.readFileSync(schedulePath, 'utf8');
        const schedule: Schedule = JSON.parse(rawData);

        for (const events of Object.values(schedule)) {
            for (const event of events) {
                if (event.startDate === targetDate && event.title.length !== 0) {
                    const notice: NotificationPayload = {
                        id: this.getShortTimestampId(),
                        title: event.title,
                        link: this.configService.get<Record<string, string>>('calendar')?.INHA_CALENDAR || '',
                        date: targetDate,
                        writer: IDENTIFIER_CONSTANT.UNKNOWN_WRITER,
                        access: IDENTIFIER_CONSTANT.UNKNOWN_ACCESS,
                    };

                    await this.sendFirebaseMessaging(notice, topic);
                }
            }
        }
    }

    private getShortTimestampId(): string {
        return new Date().getTime().toString().slice(0, 5);
    }

    // ========================================
    // sendFirebaseMessaging() 구현
    // ========================================

    async sendFirebaseMessaging(notice: NotificationPayload, topic: string): Promise<void> {
        const { title, body, data }: FirebaseMessagePayload = this.buildFirebaseMessagePayload(this.context, notice, topic);
        return await this.firebaseService.sendNotificationToTopic(topic, title, body, data);
    }
}