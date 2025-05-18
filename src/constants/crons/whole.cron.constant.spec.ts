/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-18
 */

import { WHOLE_CRON } from "src/constants/crons/whole.cron.constant";

describe('Whole Cron 상수는', () => {
    it('정상적으로 배포환경의 상수로 정의되어 있다.', () => {
        expect(WHOLE_CRON.CRON_WEEKDAYS).toBe('0 */10 9-16 * * 1-5');
        expect(WHOLE_CRON.CRON_EVENING).toBe('0 */30 17-23 * * 1-5');
        expect(WHOLE_CRON.CRON_WEEKEND).toBe('0 */30 9-23 * * 6-7');
        expect(WHOLE_CRON.CRON_DELETE_OLD).toBe('0 0 0 * * 1-5');
    });
});