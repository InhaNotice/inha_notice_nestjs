/*
 * This is file of the project inha_notice
 * Licensed under the MIT License.
 * Copyright (c) 2025-2026 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-07-05
 */

import { HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() { }

  /**
   * Provides the HTTP main page
   * @returns {string} - Returns a string representing the HTTP main page
   */
  getHome(): string {
    return "Hello World!";
  }

  /**
   * Provides the health check service for the load balancer
   * @returns {{ status: number; message: string }} - Returns the status code and message as JSON
   */
  healthCheck(): { status: number; message: string } {
    return {
      status: HttpStatus.OK,
      message: 'Successfully Health Check!'
    };
  }
}