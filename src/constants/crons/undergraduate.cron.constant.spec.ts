/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-18
 */

import { UNDERGRADUATE_CRON } from "src/constants/crons/undergraduate.cron.constant";

describe('Undergraduate Cron 상수는', () => {
    it('정상적으로 배포환경의 상수로 정의되어 있다.', () => {
        expect(UNDERGRADUATE_CRON.UNDERGRADUATE_DAY_BEFORE_REMINDER).toBe('0 18 * * 1-5');
        expect(UNDERGRADUATE_CRON.UNDERGRADUATE_TODAY_REMINDER).toBe('0 8 * * 1-5');
    });
});