import { NotificationPayload } from "src/interfaces/notification-payload.interface";


export abstract class BaseScraper {

    abstract fetchAllNotices(): Promise<Record<string, NotificationPayload[]>>;
    abstract fetchNotices(noticeType: string, page?: number): Promise<{ general: NotificationPayload[] }>;
    abstract getAllNoticeTypes(): string[];
}