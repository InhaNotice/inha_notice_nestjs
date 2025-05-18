import { UNDERGRADUATE_CRON } from "./undergraduate.cron.constant";

describe('Undergraduate Cron 상수는', () => {
    it('정상적으로 배포환경의 상수로 정의되어 있다.', () => {
        expect(UNDERGRADUATE_CRON.UNDERGRADUATE_DAY_BEFORE_REMINDER).toBe('0 18 * * 1-5');
        expect(UNDERGRADUATE_CRON.UNDERGRADUATE_TODAY_REMINDER).toBe('0 8 * * 1-5');
    });
});