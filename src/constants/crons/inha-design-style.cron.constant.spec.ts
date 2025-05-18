import { INHA_DESIGN_STYLE_CRON } from "src/constants/crons/inha-design-style.cron.constant";

describe('Inha Design Style Cron 상수는', () => {
    it('정상적으로 배포환경의 상수로 정의되어 있다.', () => {
        expect(INHA_DESIGN_STYLE_CRON.CRON_WEEKDAYS).toBe('0 */10 9-16 * * 1-5');
        expect(INHA_DESIGN_STYLE_CRON.CRON_DELETE_OLD).toBe('0 0 17 * * 1-5');
    });
});