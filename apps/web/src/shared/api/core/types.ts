/**
 * 前端API客户端类型定义
 * 使用 @dailyuse/contracts 中的统一响应类型
 */

import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import type {
  ApiResponse,
  SuccessResponse,
  ErrorResponse,
  PaginationInfo,
  ErrorDetail,
} from '@dailyuse/contracts';

// 重新导出 contracts 中的类型，供前端使用
export type { ApiResponse, SuccessResponse, ErrorResponse, PaginationInfo, ErrorDetail };

/**
 * 基础API响应（向后兼容）
 * @deprecated 使用 ApiResponse 代替
 */
export type BaseApiResponse<T = any> = ApiResponse<T>;

/**
 * API客户端配置
 */
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  enableAuth?: boolean;
  enableCache?: boolean;
  enableLogging?: boolean;
  retryCount?: number;
  retryDelay?: number;
  cacheTimeout?: number;
}

/**
 * 请求选项
 */
export interface RequestOptions {
  timeout?: number;
  retries?: number;
  enableCache?: boolean;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  validateStatus?: (status: number) => boolean;
  params?: Record<string, any>;
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分页响应数据（向后兼容）
 * @deprecated 使用 SuccessResponse<T> with pagination 代替
 */
export interface PaginatedData<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 文件上传选项
 */
export interface UploadOptions {
  maxFileSize?: number;
  allowedTypes?: string[];
  onUploadProgress?: (progressEvent: UploadProgress) => void;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * 上传进度信息
 */
export interface UploadProgress {
  loaded: number;
  total?: number;
  progress?: number;
}

/**
 * 文件上传响应
 */
export interface FileUploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

/**
 * 文件上传进度回调
 */
export interface UploadProgressCallback {
  (progressEvent: UploadProgress): void;
}

/**
 * API客户端接口
 */
export interface IApiClient {
  get<T = any>(url: string, options?: RequestOptions): Promise<T>;
  post<T = any>(url: string, data?: any, options?: RequestOptions): Promise<T>;
  put<T = any>(url: string, data?: any, options?: RequestOptions): Promise<T>;
  delete<T = any>(url: string, options?: RequestOptions): Promise<T>;
  patch<T = any>(url: string, data?: any, options?: RequestOptions): Promise<T>;
  upload<T = any>(url: string, file: File | FormData, options?: UploadOptions): Promise<T>;
  download(url: string, filename?: string, options?: RequestOptions): Promise<void>;
}

/**
 * 响应提取策略
 * - 'auto': 自动提取 data 字段（默认，向后兼容）
 * - 'full': 返回完整响应（包含 data, message, timestamp 等）
 * - 'raw': 返回原始 axios response
 */
export type ResponseExtractStrategy = 'auto' | 'full' | 'raw';

/**
 * HTTP客户端配置扩展
 */
export interface HttpClientConfig extends AxiosRequestConfig, Partial<ApiClientConfig> {
  // 认证配置
  authType?: 'bearer' | 'basic';

  // 重试配置
  enableRetry?: boolean;
  retryCondition?: (error: any) => boolean;

  // 响应提取策略
  responseExtractStrategy?: ResponseExtractStrategy;

  // 错误处理
  errorHandler?: (error: any) => void;
  authFailHandler?: () => void;

  // 请求变换
  requestTransformer?: (config: AxiosRequestConfig) => AxiosRequestConfig;
  responseTransformer?: <T>(response: AxiosResponse<T>) => T;
}
