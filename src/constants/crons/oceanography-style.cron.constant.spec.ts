/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-18
 */

import { OCEANOGRAPHY_STYLE_CRON } from "src/constants/crons/oceanography-style.cron.constant";

describe('Oceanography Style Cron 상수는', () => {
    it('정상적으로 배포환경의 상수로 정의되어 있다.', () => {
        expect(OCEANOGRAPHY_STYLE_CRON.CRON_WEEKDAYS).toBe('0 */10 9-16 * * 1-5');
        expect(OCEANOGRAPHY_STYLE_CRON.CRON_DELETE_OLD).toBe('0 0 17 * * 1-5');
    });
});