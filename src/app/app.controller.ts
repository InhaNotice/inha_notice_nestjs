/*
 * This is file of the project inha_notice
 * Licensed under the MIT License.
 * Copyright (c) 2025-2026 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-02-22
 */

import { Controller, Get } from '@nestjs/common';
import { AppService } from 'src/app/app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHome(): string {
    return this.appService.getHome();
  }

  @Get('health')
  check() {
    return this.appService.healthCheck();
  }
}