// 这个文件提供 Express 集成，但 Express 是可选依赖
// 使用者需要自己安装 Express 类型定义

import { getHttpStatusCode } from '@dailyuse/contracts/response';
import type { ApiErrorResponse } from '@dailyuse/contracts/response';
import { createResponseBuilder, ResponseBuilder } from './responseBuilder';

// 定义基础的 Response 接口以避免依赖 Express
interface BaseExpressResponse {
  status(code: number): this;
  json(data: any): this;
}

/**
 * Express 响应工具类
 * 提供与 Express Response 对象集成的便捷方法
 */
export class ExpressResponseHelper {
  private res: BaseExpressResponse;
  private builder: ResponseBuilder;

  constructor(res: BaseExpressResponse, builder?: ResponseBuilder) {
    this.res = res;
    this.builder = builder || createResponseBuilder();
  }

  /**
   * 发送成功响应
   */
  success<T>(data: T, message = '操作成功') {
    const response = this.builder.success(data, message);
    return this.res.status(200).json(response);
  }

  /**
   * 发送创建成功响应
   */
  created<T>(data: T, message = '创建成功') {
    const response = this.builder.success(data, message);
    return this.res.status(201).json(response);
  }

  /**
   * 发送错误响应
   */
  error(response: ApiErrorResponse) {
    // response.code is already a number (ResponseCode), can be used directly as HTTP status
    const httpStatus = response.code;
    return this.res.status(httpStatus).json(response);
  }

  /**
   * 发送请求参数错误响应
   */
  badRequest(message = '请求参数错误', errors?: any[]) {
    const response = this.builder.badRequest(message, errors);
    return this.error(response);
  }

  /**
   * 发送未授权响应
   */
  unauthorized(message = '未授权访问') {
    const response = this.builder.unauthorized(message);
    return this.error(response);
  }

  /**
   * 发送禁止访问响应
   */
  forbidden(message = '禁止访问') {
    const response = this.builder.forbidden(message);
    return this.error(response);
  }

  /**
   * 发送资源未找到响应
   */
  notFound(message = '资源未找到') {
    const response = this.builder.notFound(message);
    return this.error(response);
  }

  /**
   * 发送验证错误响应
   */
  validationError(message = '数据验证失败', errors?: any[]) {
    const response = this.builder.validationError(message, errors);
    return this.error(response);
  }

  /**
   * 发送冲突响应
   */
  conflict(message = '资源冲突') {
    const response = this.builder.conflict(message);
    return this.error(response);
  }

  /**
   * 发送内部服务器错误响应
   */
  internalError(message = '内部服务器错误', debug?: any) {
    const response = this.builder.internalError(message, debug);
    return this.error(response);
  }

  /**
   * 发送业务逻辑错误响应
   */
  businessError(message: string, errorCode?: string) {
    const response = this.builder.businessError(message, errorCode);
    return this.error(response);
  }

  /**
   * 发送领域错误响应
   */
  domainError(message: string, errorCode?: string) {
    const response = this.builder.domainError(message, errorCode);
    return this.error(response);
  }
}

/**
 * 创建 Express 响应助手
 */
export function createExpressResponseHelper(
  res: BaseExpressResponse,
  builder?: ResponseBuilder,
): ExpressResponseHelper {
  return new ExpressResponseHelper(res, builder);
}
