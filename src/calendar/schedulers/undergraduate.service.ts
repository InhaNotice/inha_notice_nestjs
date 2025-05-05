/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-05-06
 */
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from '@nestjs/schedule';

@Injectable()
export class UndergraduateService {
    constructor(private readonly configService: ConfigService) {

    }
}