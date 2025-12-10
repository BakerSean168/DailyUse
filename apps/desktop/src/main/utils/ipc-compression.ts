/**
 * IPC Data Compression Utility
 *
 * Provides support for compressing large IPC payloads to reduce transmission overhead.
 * Uses Node.js native zlib for compression.
 *
 * @module utils/ipc-compression
 */

import { gzipSync, gunzipSync, constants } from 'zlib';

// ========== Configuration Constants ==========

/**
 * Compression Threshold (Bytes)
 * Data smaller than this will not be compressed.
 * Default: 1024 (1KB). Small data compression might add overhead without benefit.
 */
export const COMPRESSION_THRESHOLD = 1024;

/**
 * Compression Level (1-9)
 * 1 = Fastest, 9 = Best compression.
 * Default: 6 (Balanced).
 */
export const DEFAULT_COMPRESSION_LEVEL = 6;

/**
 * Prefix to identify compressed data strings if not using the object payload wrapper.
 * (Currently using object wrapper `CompressedPayload` for safer typing).
 */
export const COMPRESSED_PREFIX = '__GZIP__';

// ========== Types ==========

/**
 * Statistics about a compression operation.
 */
export interface CompressionStats {
  /** Original size in bytes. */
  originalSize: number;
  /** Compressed size in bytes. */
  compressedSize: number;
  /** Compression ratio (0-1), where higher means better compression (e.g., 0.8 means 80% size reduction). */
  ratio: number;
  /** Time taken to compress in milliseconds. */
  compressionTime: number;
  /** Whether the data was actually compressed. */
  wasCompressed: boolean;
}

/**
 * Structure of a compressed payload sent over IPC.
 */
export interface CompressedPayload {
  /** Marker to identify payload as compressed. */
  __compressed: true;
  /** Base64 encoded compressed data string. */
  data: string;
  /** Original size of the data before compression. */
  originalSize: number;
}

/**
 * Options for compression.
 */
export interface CompressionOptions {
  /** Threshold in bytes to trigger compression. */
  threshold?: number;
  /** Zlib compression level (1-9). */
  level?: number;
  /** Whether to force compression even if below threshold. */
  force?: boolean;
}

// ========== Core Functions ==========

/**
 * Compresses data if it meets the criteria.
 *
 * @template T The type of the data to compress.
 * @param {T} data - The data to compress (must be JSON serializable).
 * @param {CompressionOptions} [options={}] - Compression options.
 * @returns {T | CompressedPayload} The compressed payload or the original data if not compressed.
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

  // Serialize to JSON
  const jsonString = JSON.stringify(data);
  const originalSize = Buffer.byteLength(jsonString, 'utf8');

  // Check if compression is needed
  if (!force && originalSize < threshold) {
    return data;
  }

  try {
    // Compress using gzip
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

    // If compressed size is larger (or not significantly smaller), return original
    if (!force && compressedSize >= originalSize * 0.9) {
      return data;
    }

    // Return compressed payload
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
 * Decompresses data if it is a compressed payload.
 *
 * @template T The expected type of the decompressed data.
 * @param {T | CompressedPayload} payload - The payload to check and decompress.
 * @returns {T} The decompressed data or the original data if it wasn't compressed.
 */
export function decompressFromIpc<T>(payload: T | CompressedPayload): T {
  // Check if payload is compressed
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
 * Type guard to check if a payload is compressed.
 *
 * @param {unknown} payload - The payload to check.
 * @returns {payload is CompressedPayload} True if it is a compressed payload.
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
 * Analyzes compression statistics for a given data set without returning the compressed data.
 * Useful for performance tuning.
 *
 * @template T The type of data to analyze.
 * @param {T} data - The data to analyze.
 * @param {CompressionOptions} [options={}] - Options to simulate.
 * @returns {CompressionStats} The compression statistics.
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

// ========== Decorators/Wrappers ==========

/**
 * Higher-order function to wrap an async handler with compression.
 * Automatically compresses the return value if it exceeds the threshold.
 *
 * @example
 * ```typescript
 * const handler = withCompression(async (args) => {
 *   return await fetchLargeData(args);
 * });
 * ```
 *
 * @template TArgs The arguments type.
 * @template TResult The result type.
 * @param {(...args: TArgs) => Promise<TResult>} handler - The handler to wrap.
 * @param {CompressionOptions} [options={}] - Compression options.
 * @returns {(...args: TArgs) => Promise<TResult | CompressedPayload>} The wrapped handler.
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
 * Automatically decompresses a response if needed.
 * Useful as a utility in the renderer process.
 *
 * @example
 * ```typescript
 * const data = autoDecompress(await ipcRenderer.invoke('get-data'));
 * ```
 *
 * @template T The expected type.
 * @param {T | CompressedPayload} response - The response to process.
 * @returns {T} The decompressed data.
 */
export function autoDecompress<T>(response: T | CompressedPayload): T {
  return decompressFromIpc(response);
}

// ========== Batch Operations ==========

/**
 * Compresses multiple items in a batch.
 *
 * @template T The type of items.
 * @param {T[]} items - The list of items to compress.
 * @param {CompressionOptions} [options={}] - Compression options.
 * @returns {(T | CompressedPayload)[]} The list of (potentially) compressed items.
 */
export function compressBatch<T>(
  items: T[],
  options: CompressionOptions = {}
): (T | CompressedPayload)[] {
  return items.map((item) => compressForIpc(item, options));
}

/**
 * Decompresses multiple items in a batch.
 *
 * @template T The type of items.
 * @param {(T | CompressedPayload)[]} items - The list of items to decompress.
 * @returns {T[]} The list of decompressed items.
 */
export function decompressBatch<T>(
  items: (T | CompressedPayload)[]
): T[] {
  return items.map((item) => decompressFromIpc(item));
}

// ========== Client Helper ==========

/**
 * Client-side helper for handling IPC compression.
 */
export class IpcCompressionClient {
  private compressionEnabled: boolean = true;

  /**
   * Enables or disables automatic compression/decompression.
   *
   * @param {boolean} enabled - Whether compression handling is enabled.
   */
  setEnabled(enabled: boolean): void {
    this.compressionEnabled = enabled;
  }

  /**
   * Processes an IPC response, decompressing it if necessary.
   *
   * @template T The expected response type.
   * @param {T | CompressedPayload} response - The response from IPC.
   * @returns {T} The processed response.
   */
  processResponse<T>(response: T | CompressedPayload): T {
    if (!this.compressionEnabled) {
      return response as T;
    }
    return decompressFromIpc(response);
  }

  /**
   * Prepares a request payload by compressing it if beneficial.
   *
   * @template T The request data type.
   * @param {T} data - The data to send.
   * @param {CompressionOptions} [options] - Compression options.
   * @returns {T | CompressedPayload} The prepared payload.
   */
  prepareRequest<T>(data: T, options?: CompressionOptions): T | CompressedPayload {
    if (!this.compressionEnabled) {
      return data;
    }
    return compressForIpc(data, options);
  }
}

// ========== Singleton Instance ==========

let clientInstance: IpcCompressionClient | null = null;

/**
 * Retrieves the singleton instance of IpcCompressionClient.
 *
 * @returns {IpcCompressionClient} The client instance.
 */
export function getCompressionClient(): IpcCompressionClient {
  if (!clientInstance) {
    clientInstance = new IpcCompressionClient();
  }
  return clientInstance;
}

// ========== Analysis Tools ==========

/**
 * Analyzes whether a dataset would benefit from compression.
 *
 * @template T The data type.
 * @param {T} data - The data to analyze.
 * @returns {Object} An analysis report with recommendation.
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
    recommendation = 'Data too small, overhead might exceed benefit';
  } else if (stats.ratio < 0.1) {
    recommendation = 'Compression ratio < 10%, not recommended';
  } else if (stats.ratio < 0.3) {
    recommendation = 'Moderate benefit, optional';
  } else {
    recommendation = `High benefit (${estimatedSavings}%), strongly recommended`;
  }

  return {
    shouldCompress,
    originalSize: stats.originalSize,
    estimatedCompressedSize: stats.compressedSize,
    estimatedSavings,
    recommendation,
  };
}
