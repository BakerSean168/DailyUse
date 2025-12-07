/**
 * IPC Data Compression Utility
 *
 * EPIC-003 STORY-018: IPC 通信优化
 * Task 18.2: 数据压缩
 *
 * 为大型 IPC 响应提供压缩支持，减少 IPC 通道传输开销
 * 使用 Node.js 原生 zlib，无需额外依赖
 */

import { gzipSync, gunzipSync, constants } from 'zlib';

// ========== 配置常量 ==========

/**
 * 压缩阈值（字节）
 * 只有超过此大小的数据才会被压缩
 * 默认 1KB - 小数据压缩开销可能大于收益
 */
export const COMPRESSION_THRESHOLD = 1024;

/**
 * 压缩级别（1-9）
 * 1 = 最快，9 = 最高压缩率
 * 推荐 6 作为平衡选择
 */
export const DEFAULT_COMPRESSION_LEVEL = 6;

/**
 * 压缩数据的标记前缀
 * 用于识别响应是否已压缩
 */
export const COMPRESSED_PREFIX = '__GZIP__';

// ========== 类型定义 ==========

export interface CompressionStats {
  /** 原始大小（字节） */
  originalSize: number;
  /** 压缩后大小（字节） */
  compressedSize: number;
  /** 压缩率 (0-1) */
  ratio: number;
  /** 压缩耗时（毫秒） */
  compressionTime: number;
  /** 是否实际压缩 */
  wasCompressed: boolean;
}

export interface CompressedPayload {
  /** 压缩标记 */
  __compressed: true;
  /** Base64 编码的压缩数据 */
  data: string;
  /** 原始大小 */
  originalSize: number;
}

export interface CompressionOptions {
  /** 压缩阈值（字节） */
  threshold?: number;
  /** 压缩级别 (1-9) */
  level?: number;
  /** 是否强制压缩（忽略阈值） */
  force?: boolean;
}

// ========== 核心函数 ==========

/**
 * 压缩数据
 *
 * @param data - 要压缩的数据（任意可 JSON 序列化的对象）
 * @param options - 压缩选项
 * @returns 压缩后的数据或原始数据（如果太小不值得压缩）
 */
export function compressForIpc<T>(
  data: T,
  options: CompressionOptions = {}
): T | CompressedPayload {
  const {
    threshold = COMPRESSION_THRESHOLD,
    level = DEFAULT_COMPRESSION_LEVEL,
    force = false,
  } = options;

  // 序列化为 JSON
  const jsonString = JSON.stringify(data);
  const originalSize = Buffer.byteLength(jsonString, 'utf8');

  // 检查是否需要压缩
  if (!force && originalSize < threshold) {
    return data;
  }

  try {
    // 使用 gzip 压缩
    const compressed = gzipSync(jsonString, {
      level: Math.min(Math.max(level, 1), 9) as
        | 1
        | 2
        | 3
        | 4
        | 5
        | 6
        | 7
        | 8
        | 9,
    });

    const compressedSize = compressed.length;

    // 如果压缩后更大，返回原始数据
    if (!force && compressedSize >= originalSize * 0.9) {
      return data;
    }

    // 返回压缩载荷
    return {
      __compressed: true,
      data: compressed.toString('base64'),
      originalSize,
    };
  } catch (error) {
    console.warn('[IpcCompression] Compression failed, returning original:', error);
    return data;
  }
}

/**
 * 解压数据
 *
 * @param payload - 可能被压缩的载荷
 * @returns 解压后的数据
 */
export function decompressFromIpc<T>(payload: T | CompressedPayload): T {
  // 检查是否是压缩载荷
  if (!isCompressedPayload(payload)) {
    return payload as T;
  }

  try {
    const compressed = Buffer.from(payload.data, 'base64');
    const decompressed = gunzipSync(compressed);
    return JSON.parse(decompressed.toString('utf8')) as T;
  } catch (error) {
    console.error('[IpcCompression] Decompression failed:', error);
    throw new Error('Failed to decompress IPC payload');
  }
}

/**
 * 检查载荷是否是压缩格式
 */
export function isCompressedPayload(
  payload: unknown
): payload is CompressedPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    '__compressed' in payload &&
    (payload as CompressedPayload).__compressed === true &&
    'data' in payload &&
    typeof (payload as CompressedPayload).data === 'string'
  );
}

/**
 * 获取压缩统计信息
 *
 * @param data - 要分析的数据
 * @param options - 压缩选项
 * @returns 压缩统计
 */
export function getCompressionStats<T>(
  data: T,
  options: CompressionOptions = {}
): CompressionStats {
  const { level = DEFAULT_COMPRESSION_LEVEL } = options;

  const jsonString = JSON.stringify(data);
  const originalSize = Buffer.byteLength(jsonString, 'utf8');

  const startTime = performance.now();

  try {
    const compressed = gzipSync(jsonString, {
      level: Math.min(Math.max(level, 1), 9) as
        | 1
        | 2
        | 3
        | 4
        | 5
        | 6
        | 7
        | 8
        | 9,
    });

    const compressionTime = performance.now() - startTime;
    const compressedSize = compressed.length;

    return {
      originalSize,
      compressedSize,
      ratio: 1 - compressedSize / originalSize,
      compressionTime,
      wasCompressed: true,
    };
  } catch {
    return {
      originalSize,
      compressedSize: originalSize,
      ratio: 0,
      compressionTime: performance.now() - startTime,
      wasCompressed: false,
    };
  }
}

// ========== 高阶函数装饰器 ==========

/**
 * IPC 处理器压缩装饰器
 *
 * 自动压缩返回值超过阈值的 IPC 响应
 *
 * @example
 * ```typescript
 * const handler = withCompression(async (args) => {
 *   return await fetchLargeData(args);
 * });
 * ```
 */
export function withCompression<TArgs extends unknown[], TResult>(
  handler: (...args: TArgs) => Promise<TResult>,
  options: CompressionOptions = {}
): (...args: TArgs) => Promise<TResult | CompressedPayload> {
  return async (...args: TArgs) => {
    const result = await handler(...args);
    return compressForIpc(result, options);
  };
}

/**
 * IPC 响应自动解压中间件（渲染进程使用）
 *
 * @example
 * ```typescript
 * const data = autoDecompress(await ipcRenderer.invoke('get-data'));
 * ```
 */
export function autoDecompress<T>(response: T | CompressedPayload): T {
  return decompressFromIpc(response);
}

// ========== 批量压缩支持 ==========

/**
 * 批量压缩多个数据项
 * 适用于需要同时传输多个大型对象的场景
 */
export function compressBatch<T>(
  items: T[],
  options: CompressionOptions = {}
): (T | CompressedPayload)[] {
  return items.map((item) => compressForIpc(item, options));
}

/**
 * 批量解压
 */
export function decompressBatch<T>(
  items: (T | CompressedPayload)[]
): T[] {
  return items.map((item) => decompressFromIpc(item));
}

// ========== 渲染进程辅助类 ==========

/**
 * 渲染进程 IPC 压缩客户端
 *
 * 提供自动解压的 IPC 调用封装
 */
export class IpcCompressionClient {
  private compressionEnabled: boolean = true;

  /**
   * 启用/禁用自动解压
   */
  setEnabled(enabled: boolean): void {
    this.compressionEnabled = enabled;
  }

  /**
   * 处理可能压缩的 IPC 响应
   */
  processResponse<T>(response: T | CompressedPayload): T {
    if (!this.compressionEnabled) {
      return response as T;
    }
    return decompressFromIpc(response);
  }

  /**
   * 在发送前压缩大型请求数据
   */
  prepareRequest<T>(data: T, options?: CompressionOptions): T | CompressedPayload {
    if (!this.compressionEnabled) {
      return data;
    }
    return compressForIpc(data, options);
  }
}

// ========== 单例实例 ==========

let clientInstance: IpcCompressionClient | null = null;

/**
 * 获取压缩客户端单例
 */
export function getCompressionClient(): IpcCompressionClient {
  if (!clientInstance) {
    clientInstance = new IpcCompressionClient();
  }
  return clientInstance;
}

// ========== 性能分析工具 ==========

/**
 * 分析数据是否值得压缩
 *
 * @returns 建议是否压缩以及预期收益
 */
export function analyzeCompressionBenefit<T>(data: T): {
  shouldCompress: boolean;
  originalSize: number;
  estimatedCompressedSize: number;
  estimatedSavings: number;
  recommendation: string;
} {
  const stats = getCompressionStats(data);

  const shouldCompress =
    stats.originalSize > COMPRESSION_THRESHOLD && stats.ratio > 0.1;

  const estimatedSavings = Math.round(stats.ratio * 100);

  let recommendation: string;
  if (stats.originalSize < COMPRESSION_THRESHOLD) {
    recommendation = '数据太小，压缩开销可能大于收益';
  } else if (stats.ratio < 0.1) {
    recommendation = '压缩率低于 10%，不建议压缩';
  } else if (stats.ratio < 0.3) {
    recommendation = '中等压缩收益，可选择性压缩';
  } else {
    recommendation = `高压缩收益（${estimatedSavings}%），强烈建议压缩`;
  }

  return {
    shouldCompress,
    originalSize: stats.originalSize,
    estimatedCompressedSize: stats.compressedSize,
    estimatedSavings,
    recommendation,
  };
}
