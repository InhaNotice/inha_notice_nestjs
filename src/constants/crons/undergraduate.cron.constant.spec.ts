/*
 * This is file of the project inha_notice
 * Licensed under the MIT License.
 * Copyright (c) 2025-2026 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-07-05
 */

import { UNDERGRADUATE_CRON } from "src/constants/crons/undergraduate.cron.constant";

describe('Undergraduate Cron 상수는', () => {
    it('정상적으로 배포환경의 상수로 정의되어 있다.', () => {
        expect(UNDERGRADUATE_CRON.CRON_DAY_BEFORE).toBe('0 18 * * *');
        expect(UNDERGRADUATE_CRON.CRON_TODAY).toBe('0 8 * * *');
    });
});