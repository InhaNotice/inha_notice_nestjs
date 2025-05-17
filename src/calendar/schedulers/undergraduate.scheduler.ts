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

    /**
     * 입력 targetDate와 일치하는 학사일정이 있는 경우, Firebase 메시지를 보낸다.
     * @param {string} targetDate - 'YYYY-MM-DD'
     * @param {string} topic - Firebase 토픽
     */
    async handleReminder(targetDate: string, topic: string): Promise<void> {
        const schedulePath = path.join(process.cwd(), 'assets', 'undergraduate-schedule.json');
        const rawData = await fs.promises.readFile(schedulePath, 'utf8');
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

    /**
     * 학사일정의 NotificationPayload의 id를 결정하여 반환한다.
     * @returns {string} - '12345'
     */
    private getShortTimestampId(): string {
        return new Date().getTime().toString().slice(0, 5);
    }

    /**
     * Firebase 메시지를 보낸다.
     * @param {NotificationPayload} notice - 전처리된 알림 메시지 정보
     * @param {string} topic - Firebase 토픽
     * @returns {Promise<void>}
     */
    async sendFirebaseMessaging(notice: NotificationPayload, topic: string): Promise<void> {
        const { title, body, data }: FirebaseMessagePayload = this.buildFirebaseMessagePayload(this.context, notice, topic);
        return await this.firebaseService.sendNotificationToTopic(topic, title, body, data);
    }
}