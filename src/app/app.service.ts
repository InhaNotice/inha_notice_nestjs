/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-02-22
 */

import { HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() { }

  /**
   * HTTP 메인 페이지 제공
   * @returns {string} - HTTP 메인 페이지 정의(문자열 반환)
   */
  getHome(): string {
    return "Hello World!";
  }

  /**
   * 로드밸런서 Health check 서비스를 제공
   * @returns {status: number; message: string} - 상태코드와 메시지를 JSON으로 반환
   */
  healthCheck(): { status: number; message: string } {
    return {
      status: HttpStatus.OK,
      message: 'health check에 성공하였습니다.'
    };
  }
}