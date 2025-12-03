import type { Request, Response, NextFunction } from 'express';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('PerformanceMiddleware');

interface PerformanceMetrics {
  method: string;
  url: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
}

// In-memory metrics store (simple implementation)
class MetricsStore {
  private metrics: Map<string, number[]> = new Map();
  private readonly MAX_SAMPLES = 1000; // Keep last 1000 requests per endpoint

  recordRequest(endpoint: string, duration: number): void {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }

    const values = this.metrics.get(endpoint)!;
    values.push(duration);

    // Keep only last MAX_SAMPLES
    if (values.length > this.MAX_SAMPLES) {
      values.shift();
    }
  }

  getStats(endpoint: string): {
    count: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    max: number;
  } | null {
    const values = this.metrics.get(endpoint);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;

    return {
      count,
      avg: Math.round(values.reduce((a, b) => a + b, 0) / count),
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)],
      max: Math.max(...values),
    };
  }

  getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const result: Record<string, ReturnType<typeof this.getStats>> = {};

    for (const [endpoint, _] of this.metrics.entries()) {
      result[endpoint] = this.getStats(endpoint);
    }

    return result;
  }

  clear(): void {
    this.metrics.clear();
  }
}

export const metricsStore = new MetricsStore();

/**
 * Performance monitoring middleware
 * Logs request duration and tracks metrics per endpoint
 */
export function performanceMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 跳过 SSE 路由 - SSE 是长连接，不适合用常规性能监控
  if (req.path.includes('/sse/')) {
    return next();
  }
  
  const start = Date.now();
  const endpoint = `${req.method} ${req.route?.path || req.path}`;

  // Override res.json to capture when response is sent
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    const duration = Date.now() - start;

    // Log performance
    const logLevel = duration > 300 ? 'warn' : 'debug';
    logger[logLevel](`[PERF] ${endpoint} - ${duration}ms - ${res.statusCode}`);

    // Store metrics
    metricsStore.recordRequest(endpoint, duration);

    // Add performance header
    res.setHeader('X-Response-Time', `${duration}ms`);

    return originalJson(body);
  };

  // Handle response end for non-JSON responses
  res.on('finish', () => {
    if (res.getHeader('X-Response-Time')) {
      return; // Already logged via json override
    }

    const duration = Date.now() - start;
    const logLevel = duration > 300 ? 'warn' : 'debug';
    logger[logLevel](`[PERF] ${endpoint} - ${duration}ms - ${res.statusCode}`);

    metricsStore.recordRequest(endpoint, duration);
    
    // 只在响应头未发送时设置
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${duration}ms`);
    }
  });

  next();
}

/**
 * Get performance metrics for a specific endpoint
 */
export function getEndpointMetrics(endpoint: string) {
  return metricsStore.getStats(endpoint);
}

/**
 * Get all performance metrics
 */
export function getAllMetrics() {
  return metricsStore.getAllStats();
}

/**
 * Clear all metrics
 */
export function clearMetrics() {
  metricsStore.clear();
}
