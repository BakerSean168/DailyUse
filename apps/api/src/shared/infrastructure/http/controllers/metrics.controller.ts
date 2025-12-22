/**
 * @file metrics.controller.ts
 * @description 指标控制器 - 提供 Prometheus 兼容格式的性能指标
 * @date 2025-12-22
 */

import type { Request, Response } from 'express';
import { getAllMetrics } from '@/shared/infrastructure/http/middlewares/performance.middleware';

/**
 * 指标控制器
 * 
 * 提供以下端点：
 * - `/metrics` - Prometheus 格式的指标输出
 */
export const metricsController = {
  /**
   * 获取 Prometheus 格式的指标
   * 
   * @route GET /metrics
   */
  getPrometheus: (_req: Request, res: Response): void => {
    const metrics = getAllMetrics();
    const lines: string[] = [];
    
    // 帮助文本
    lines.push('# HELP http_request_duration_ms HTTP request duration in milliseconds');
    lines.push('# TYPE http_request_duration_ms histogram');
    lines.push('');
    lines.push('# HELP http_requests_total Total number of HTTP requests');
    lines.push('# TYPE http_requests_total counter');
    lines.push('');
    
    // 遍历所有端点指标
    for (const [endpoint, stats] of Object.entries(metrics)) {
      if (!stats) continue;
      
      // 解析端点格式 "METHOD /path"
      const [method, ...pathParts] = endpoint.split(' ');
      const path = pathParts.join(' ') || '/';
      
      // 标签
      const labels = `method="${method}",path="${path}"`;
      
      // 请求计数
      lines.push(`http_requests_total{${labels}} ${stats.count}`);
      
      // 持续时间指标
      lines.push(`http_request_duration_ms_sum{${labels}} ${Math.round(stats.avg * stats.count)}`);
      lines.push(`http_request_duration_ms_count{${labels}} ${stats.count}`);
      lines.push(`http_request_duration_ms_avg{${labels}} ${stats.avg}`);
      lines.push(`http_request_duration_ms_p50{${labels}} ${stats.p50}`);
      lines.push(`http_request_duration_ms_max{${labels}} ${stats.max}`);
      lines.push(`http_request_duration_ms_p95{${labels}} ${stats.p95}`);
      lines.push(`http_request_duration_ms_p99{${labels}} ${stats.p99}`);
      lines.push('');
    }
    
    // 添加进程指标
    const memoryUsage = process.memoryUsage();
    lines.push('# HELP process_memory_heap_bytes Process heap memory usage');
    lines.push('# TYPE process_memory_heap_bytes gauge');
    lines.push(`process_memory_heap_bytes ${memoryUsage.heapUsed}`);
    lines.push('');
    
    lines.push('# HELP process_memory_rss_bytes Process RSS memory usage');
    lines.push('# TYPE process_memory_rss_bytes gauge');
    lines.push(`process_memory_rss_bytes ${memoryUsage.rss}`);
    lines.push('');
    
    lines.push('# HELP process_uptime_seconds Process uptime in seconds');
    lines.push('# TYPE process_uptime_seconds gauge');
    lines.push(`process_uptime_seconds ${Math.floor(process.uptime())}`);
    
    // 设置正确的 Content-Type
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.status(200).send(lines.join('\n'));
  },

  /**
   * 获取 JSON 格式的指标（用于调试和仪表板）
   * 
   * @route GET /metrics/json
   */
  getJson: (_req: Request, res: Response): void => {
    const metrics = getAllMetrics();
    
    // 计算汇总统计
    const allEndpoints = Object.entries(metrics);
    const totalRequests = allEndpoints.reduce((sum, [_, stats]) => sum + (stats?.count || 0), 0);
    
    const avgResponseTimes = allEndpoints.map(([_, stats]) => stats?.avg || 0).filter(Boolean);
    const overallAvg = avgResponseTimes.length > 0
      ? Math.round(avgResponseTimes.reduce((a, b) => a + b, 0) / avgResponseTimes.length)
      : 0;
    
    // 慢端点（avg > 200ms）
    const slowEndpoints = allEndpoints
      .filter(([_, stats]) => (stats?.avg || 0) > 200)
      .map(([endpoint, stats]) => ({
        endpoint,
        avgMs: stats?.avg,
        p95Ms: stats?.p95,
        p99Ms: stats?.p99,
        maxMs: stats?.max,
      }));
    
    res.status(200).json({
      summary: {
        totalRequests,
        overallAvgMs: overallAvg,
        endpointCount: allEndpoints.length,
        slowEndpointCount: slowEndpoints.length,
      },
      slowEndpoints,
      process: {
        uptime: Math.floor(process.uptime()),
        memoryMB: {
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024 * 100) / 100,
        },
      },
      allMetrics: metrics,
    });
  },
};

export default metricsController;
