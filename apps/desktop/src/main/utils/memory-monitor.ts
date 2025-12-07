/**
 * Memory Monitor
 *
 * 开发模式内存监控工具
 * 提供实时内存使用指示和趋势分析
 */

import { ipcMain, BrowserWindow } from 'electron';

// ============ Types ============

interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;    // MB
  heapTotal: number;   // MB
  external: number;    // MB
  rss: number;         // MB
  arrayBuffers: number; // MB
}

interface MemoryTrend {
  direction: 'up' | 'down' | 'stable';
  changePerHour: number; // MB/hour
  isLikelyLeak: boolean;
}

// ============ Memory Monitor Class ============

export class MemoryMonitor {
  private snapshots: MemorySnapshot[] = [];
  private interval: NodeJS.Timeout | null = null;
  private readonly maxSnapshots = 120; // 保留 2 小时的数据 (每分钟一次)
  private readonly leakThresholdPerHour = 10; // MB/hour

  /**
   * 开始监控
   */
  start(intervalMs: number = 60000): void {
    if (this.interval) {
      console.warn('[MemoryMonitor] Already running');
      return;
    }

    console.log('[MemoryMonitor] Starting memory monitoring...');

    // 立即获取一次快照
    this.takeSnapshot();

    // 定期获取快照
    this.interval = setInterval(() => {
      this.takeSnapshot();
      this.logMemoryStatus();
    }, intervalMs);
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('[MemoryMonitor] Stopped');
    }
  }

  /**
   * 获取快照
   */
  takeSnapshot(): MemorySnapshot {
    const usage = process.memoryUsage();
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      heapUsed: usage.heapUsed / 1024 / 1024,
      heapTotal: usage.heapTotal / 1024 / 1024,
      external: usage.external / 1024 / 1024,
      rss: usage.rss / 1024 / 1024,
      arrayBuffers: usage.arrayBuffers / 1024 / 1024,
    };

    this.snapshots.push(snapshot);

    // 保持最大快照数量
    while (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  /**
   * 获取当前内存状态
   */
  getCurrentStatus(): MemorySnapshot & { trend: MemoryTrend } {
    const current = this.snapshots[this.snapshots.length - 1] || this.takeSnapshot();
    return {
      ...current,
      trend: this.analyzeTrend(),
    };
  }

  /**
   * 分析内存趋势
   */
  analyzeTrend(): MemoryTrend {
    if (this.snapshots.length < 5) {
      return { direction: 'stable', changePerHour: 0, isLikelyLeak: false };
    }

    const values = this.snapshots.map(s => s.heapUsed);
    const slope = this.calculateSlope(values);

    // 计算每小时变化量
    const duration = (this.snapshots[this.snapshots.length - 1].timestamp -
                      this.snapshots[0].timestamp) / (1000 * 60 * 60);
    const changePerHour = duration > 0 ? (slope * this.snapshots.length) / duration : 0;

    let direction: MemoryTrend['direction'] = 'stable';
    if (changePerHour > 2) direction = 'up';
    else if (changePerHour < -2) direction = 'down';

    return {
      direction,
      changePerHour,
      isLikelyLeak: changePerHour > this.leakThresholdPerHour,
    };
  }

  /**
   * 获取所有快照
   */
  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  /**
   * 强制垃圾回收 (如果可用)
   */
  forceGC(): boolean {
    if (global.gc) {
      global.gc();
      console.log('[MemoryMonitor] Forced garbage collection');
      return true;
    }
    console.warn('[MemoryMonitor] GC not available. Run with --expose-gc flag.');
    return false;
  }

  /**
   * 打印内存状态日志
   */
  private logMemoryStatus(): void {
    const status = this.getCurrentStatus();
    const trend = status.trend;

    const trendIcon = trend.direction === 'up' ? '📈' :
                      trend.direction === 'down' ? '📉' : '➡️';
    const leakWarning = trend.isLikelyLeak ? ' ⚠️ POSSIBLE LEAK' : '';

    console.log(
      `[Memory] Heap: ${status.heapUsed.toFixed(1)}MB / ${status.heapTotal.toFixed(1)}MB | ` +
      `RSS: ${status.rss.toFixed(1)}MB | ` +
      `${trendIcon} ${trend.changePerHour.toFixed(1)}MB/h${leakWarning}`
    );
  }

  /**
   * 计算线性回归斜率
   */
  private calculateSlope(values: number[]): number {
    const n = values.length;
    if (n < 2) return 0;

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return 0;

    return (n * sumXY - sumX * sumY) / denominator;
  }
}

// ============ Singleton Instance ============

let memoryMonitor: MemoryMonitor | null = null;

export function getMemoryMonitor(): MemoryMonitor {
  if (!memoryMonitor) {
    memoryMonitor = new MemoryMonitor();
  }
  return memoryMonitor;
}

// ============ IPC Handlers ============

/**
 * 注册内存监控 IPC handlers (仅开发模式)
 */
export function registerMemoryMonitorIpcHandlers(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const monitor = getMemoryMonitor();

  ipcMain.handle('dev:memory:status', async () => {
    return monitor.getCurrentStatus();
  });

  ipcMain.handle('dev:memory:snapshots', async () => {
    return monitor.getSnapshots();
  });

  ipcMain.handle('dev:memory:force-gc', async () => {
    return monitor.forceGC();
  });

  console.log('[MemoryMonitor] IPC handlers registered');
}

// ============ Auto-start in Development ============

/**
 * 开发模式自动启动内存监控
 */
export function initMemoryMonitorForDev(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const monitor = getMemoryMonitor();
  monitor.start(60000); // 每分钟监控一次

  // 注册 IPC handlers
  registerMemoryMonitorIpcHandlers();
}
