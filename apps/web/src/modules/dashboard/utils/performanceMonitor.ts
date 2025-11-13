/**
 * Dashboard 性能监控工具
 * 用于诊断加载性能问题
 */

export interface PerformanceEntry {
  name: string;
  startTime: number;
  duration?: number;
  status: 'pending' | 'success' | 'error';
}

class PerformanceMonitor {
  private entries = new Map<string, PerformanceEntry>();

  /**
   * 开始监控一个操作
   */
  start(name: string): void {
    this.entries.set(name, {
      name,
      startTime: performance.now(),
      status: 'pending',
    });
    console.log(`⏱️ [Performance] ${name} 开始...`);
  }

  /**
   * 结束监控，标记为成功
   */
  end(name: string): void {
    const entry = this.entries.get(name);
    if (!entry) {
      console.warn(`⚠️ [Performance] 未找到监控项: ${name}`);
      return;
    }

    const duration = performance.now() - entry.startTime;
    entry.duration = duration;
    entry.status = 'success';

    const emoji = duration < 100 ? '✅' : duration < 500 ? '⚡' : duration < 2000 ? '⚠️' : '🔴';
    console.log(`${emoji} [Performance] ${name} 完成 - 耗时: ${duration.toFixed(2)}ms`);
  }

  /**
   * 标记为失败
   */
  error(name: string, error?: any): void {
    const entry = this.entries.get(name);
    if (!entry) {
      console.warn(`⚠️ [Performance] 未找到监控项: ${name}`);
      return;
    }

    const duration = performance.now() - entry.startTime;
    entry.duration = duration;
    entry.status = 'error';

    console.error(`❌ [Performance] ${name} 失败 - 耗时: ${duration.toFixed(2)}ms`, error);
  }

  /**
   * 获取总结报告
   */
  getSummary(): string {
    const entries = Array.from(this.entries.values());
    const total = entries.reduce((sum, e) => sum + (e.duration || 0), 0);

    const report = [
      '\n📊 性能监控报告',
      '='.repeat(50),
      ...entries.map((e) => {
        const status = e.status === 'success' ? '✅' : e.status === 'error' ? '❌' : '⏳';
        const duration = e.duration !== undefined ? `${e.duration.toFixed(2)}ms` : '进行中...';
        return `  ${status} ${e.name.padEnd(30)} ${duration}`;
      }),
      '='.repeat(50),
      `总耗时: ${total.toFixed(2)}ms`,
      '',
    ].join('\n');

    return report;
  }

  /**
   * 打印总结报告
   */
  printSummary(): void {
    console.log(this.getSummary());
  }

  /**
   * 清除所有记录
   */
  clear(): void {
    this.entries.clear();
  }
}

/**
 * 导出单例实例
 */
export const performanceMonitor = new PerformanceMonitor();
