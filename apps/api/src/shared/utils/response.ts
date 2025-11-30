/**
 * API响应工具函数
 * 使用统一的响应格式 (@dailyuse/contracts)
 *
 * 所有API路由应该使用这些函数返回响应，确保：
 * 1. 响应格式统一
 * 2. 类型安全
 * 3. 前端拦截器能正确处理
 */

import type { Response } from 'express';
import {
  ResponseBuilder,
  ResponseCode,
  getHttpStatusCode,
} from '@dailyuse/contracts/response';
import type {
  ApiResponse,
  SuccessResponse,
  ErrorResponse,
  ErrorDetail,
  PaginationInfo,
} from '@dailyuse/contracts/response';

/**
 * 获取请求追踪ID
 */
function getTraceId(res: Response): string | undefined {
  return res.locals.traceId || res.getHeader('X-Trace-Id')?.toString();
}

/**
 * 发送响应并设置HTTP状态码
 */
function sendResponse(res: Response, response: ApiResponse<any>): Response {
  const httpStatus = getHttpStatusCode(response.code);
  return res.status(httpStatus).json(response);
}

/**
 * 创建响应构建器
 */
function createBuilder(res: Response): ResponseBuilder {
  return new ResponseBuilder({
    traceId: getTraceId(res),
    includeDebug: process.env.NODE_ENV === 'development',
    environment: process.env.NODE_ENV,
  });
}

/**
 * 成功响应 (200)
 * @param res Express Response 对象
 * @param data 响应数据
 * @param message 成功消息，默认 "操作成功"
 */
export function ok<T>(res: Response, data?: T, message = '操作成功'): Response {
  const builder = createBuilder(res);
  const response = builder.success(data, message);
  return sendResponse(res, response);
}

/**
 * 创建成功响应 (201)
 * @param res Express Response 对象
 * @param data 创建的资源数据
 * @param message 成功消息，默认 "创建成功"
 */
export function created<T>(res: Response, data?: T, message = '创建成功'): Response {
  const builder = createBuilder(res);
  const response = builder.success(data, message);
  return res.status(201).json(response);
}

/**
 * 列表响应（带分页）
 * @param res Express Response 对象
 * @param data 数据列表
 * @param pagination 分页信息
 * @param message 成功消息，默认 "查询成功"
 */
export function list<T>(
  res: Response,
  data: T,
  pagination: PaginationInfo,
  message = '查询成功',
): Response {
  const builder = createBuilder(res);
  const response = builder.successWithPagination(data, pagination, message);
  return sendResponse(res, response);
}

/**
 * 请求参数错误响应 (400)
 * @param res Express Response 对象
 * @param message 错误消息，默认 "请求参数错误"
 * @param errors 错误详情列表
 */
export function badRequest(
  res: Response,
  message = '请求参数错误',
  errors?: ErrorDetail[],
): Response {
  const builder = createBuilder(res);
  const response = builder.error(ResponseCode.BAD_REQUEST, message, 'BAD_REQUEST', errors);
  return sendResponse(res, response);
}

/**
 * 未授权响应 (401)
 * @param res Express Response 对象
 * @param message 错误消息，默认 "未授权访问"
 */
export function unauthorized(res: Response, message = '未授权访问'): Response {
  const builder = createBuilder(res);
  const response = builder.unauthorized(message);
  return sendResponse(res, response);
}

/**
 * 禁止访问响应 (403)
 * @param res Express Response 对象
 * @param message 错误消息，默认 "无权访问此资源"
 */
export function forbidden(res: Response, message = '无权访问此资源'): Response {
  const builder = createBuilder(res);
  const response = builder.forbidden(message);
  return sendResponse(res, response);
}

/**
 * 资源未找到响应 (404)
 * @param res Express Response 对象
 * @param message 错误消息，默认 "请求的资源不存在"
 */
export function notFound(res: Response, message = '请求的资源不存在'): Response {
  const builder = createBuilder(res);
  const response = builder.notFound(message);
  return sendResponse(res, response);
}

/**
 * 资源冲突响应 (409)
 * @param res Express Response 对象
 * @param message 错误消息，默认 "资源冲突"
 */
export function conflict(res: Response, message = '资源冲突'): Response {
  const builder = createBuilder(res);
  const response = builder.conflict(message);
  return sendResponse(res, response);
}

/**
 * 参数验证错误响应 (422)
 * @param res Express Response 对象
 * @param message 错误消息，默认 "参数验证失败"
 * @param errors 验证错误详情列表
 */
export function validationError(
  res: Response,
  message = '参数验证失败',
  errors?: ErrorDetail[],
): Response {
  const builder = createBuilder(res);
  const response = builder.validationError(message, errors);
  return sendResponse(res, response);
}

/**
 * 业务逻辑错误响应 (400，code: 1000)
 * @param res Express Response 对象
 * @param message 错误消息
 * @param errorCode 业务错误码
 * @param errors 错误详情列表
 */
export function businessError(
  res: Response,
  message: string,
  errorCode?: string,
  errors?: ErrorDetail[],
): Response {
  const builder = createBuilder(res);
  const response = builder.businessError(message, errorCode, errors);
  return sendResponse(res, response);
}

/**
 * 服务器内部错误响应 (500)
 * @param res Express Response 对象
 * @param message 错误消息，默认 "服务器内部错误"
 * @param debug 调试信息（仅开发环境）
 */
export function error(res: Response, message = '服务器内部错误', debug?: any): Response {
  const builder = createBuilder(res);
  const response = builder.internalError(message, debug);
  return sendResponse(res, response);
}

/**
 * 服务不可用响应 (503)
 * @param res Express Response 对象
 * @param message 错误消息，默认 "服务暂时不可用"
 */
export function serviceUnavailable(res: Response, message = '服务暂时不可用'): Response {
  const builder = createBuilder(res);
  const response = builder.serviceUnavailable(message);
  return sendResponse(res, response);
}

/**
 * 导出响应构建器（高级用法）
 */
export { ResponseBuilder, ResponseCode };
