/**
 * API项目响应工具
 * 基于新的响应系统重构
 */

import type { Response } from 'express';
import { createResponseBuilder, createExpressResponseHelper } from '@dailyuse/utils';
import type { ResponseBuilderOptions } from '@dailyuse/contracts/response';

/**
 * 创建响应助手，用于API路由
 */
export function createApiResponseHelper(res: Response, options?: ResponseBuilderOptions) {
  return createExpressResponseHelper(res, createResponseBuilder(options));
}

/**
 * 成功响应
 */
export const ok = <T>(res: Response, data?: T, message = 'ok'): void => {
  const helper = createApiResponseHelper(res);
  helper.success(data, message);
};

/**
 * 创建成功响应
 */
export const created = <T>(res: Response, data?: T, message = 'created'): void => {
  const helper = createApiResponseHelper(res);
  helper.created(data, message);
};

/**
 * 请求参数错误响应
 */
export const badRequest = (res: Response, message = 'bad request', errors?: any[]): void => {
  const helper = createApiResponseHelper(res);
  helper.badRequest(message, errors);
};

/**
 * 未授权响应
 */
export const unauthorized = (res: Response, message = 'unauthorized'): void => {
  const helper = createApiResponseHelper(res);
  helper.unauthorized(message);
};

/**
 * 禁止访问响应
 */
export const forbidden = (res: Response, message = 'forbidden'): void => {
  const helper = createApiResponseHelper(res);
  helper.forbidden(message);
};

/**
 * 资源未找到响应
 */
export const notFound = (res: Response, message = 'not found'): void => {
  const helper = createApiResponseHelper(res);
  helper.notFound(message);
};

/**
 * 内部错误响应
 */
export const error = (
  res: Response,
  message = 'internal error',
  status = 500,
  debug?: any,
): void => {
  const helper = createApiResponseHelper(res);
  helper.internalError(message, debug);
};

/**
 * 验证错误响应
 */
export const validationError = (
  res: Response,
  message = 'validation failed',
  errors?: any[],
): void => {
  const helper = createApiResponseHelper(res);
  helper.validationError(message, errors);
};

/**
 * 业务逻辑错误响应
 */
export const businessError = (res: Response, message: string, errorCode?: string): void => {
  const helper = createApiResponseHelper(res);
  helper.businessError(message, errorCode);
};
