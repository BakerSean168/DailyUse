# Story 13.55: Phase 7 - 性能测试

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.55 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 7: 测试与文档 |
| 优先级 | P2 (Medium) |
| 预估工时 | 6h |
| 前置依赖 | Story 13.54 (集成测试套件) |
| 关联模块 | Testing |

## 目标

建立性能测试框架，监控和优化应用性能。

## 任务列表

### 1. 性能测试框架 (2h)
- [ ] 性能测试工具配置
- [ ] 性能指标定义
- [ ] 基准测试设置

### 2. 渲染性能测试 (2h)
- [ ] 首屏渲染时间
- [ ] 列表滚动性能
- [ ] 动画帧率测试

### 3. 数据性能测试 (2h)
- [ ] 数据库查询性能
- [ ] IPC 通信延迟
- [ ] 内存使用监控

## 技术规范

### 性能测试配置
```typescript
// e2e/performance/config.ts
export interface PerformanceThresholds {
  // 启动性能
  appLaunchTime: number; // ms
  firstContentfulPaint: number; // ms
  timeToInteractive: number; // ms

  // 渲染性能
  frameRate: number; // fps
  longTaskThreshold: number; // ms
  layoutShiftScore: number;

  // 数据性能
  dbQueryTime: number; // ms
  ipcLatency: number; // ms
  memoryLimit: number; // MB
}

export const thresholds: PerformanceThresholds = {
  appLaunchTime: 3000,
  firstContentfulPaint: 1500,
  timeToInteractive: 2500,

  frameRate: 55,
  longTaskThreshold: 50,
  layoutShiftScore: 0.1,

  dbQueryTime: 100,
  ipcLatency: 50,
  memoryLimit: 500,
};

export interface PerformanceMetrics {
  timestamp: number;
  metric: string;
  value: number;
  unit: string;
  passed: boolean;
}
```

### 性能测试工具
```typescript
// e2e/performance/utils.ts
import { type Page, type ElectronApplication } from '@playwright/test';
import { thresholds, type PerformanceMetrics } from './config';

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private page: Page;
  private app: ElectronApplication;

  constructor(app: ElectronApplication, page: Page) {
    this.app = app;
    this.page = page;
  }

  async measureLaunchTime(): Promise<number> {
    const startTime = Date.now();
    
    await this.page.waitForSelector('#app', { state: 'visible' });
    await this.page.waitForLoadState('networkidle');
    
    const launchTime = Date.now() - startTime;
    
    this.recordMetric('appLaunchTime', launchTime, 'ms');
    return launchTime;
  }

  async measureFirstContentfulPaint(): Promise<number> {
    const fcp = await this.page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            observer.disconnect();
            resolve(fcpEntry.startTime);
          }
        });
        observer.observe({ entryTypes: ['paint'] });

        // Fallback timeout
        setTimeout(() => resolve(-1), 10000);
      });
    });

    this.recordMetric('firstContentfulPaint', fcp, 'ms');
    return fcp;
  }

  async measureTimeToInteractive(): Promise<number> {
    const startTime = Date.now();

    await this.page.waitForSelector('[data-testid="app-ready"]', {
      state: 'visible',
      timeout: 10000,
    });

    const tti = Date.now() - startTime;
    this.recordMetric('timeToInteractive', tti, 'ms');
    return tti;
  }

  async measureFrameRate(duration: number = 5000): Promise<number> {
    const frames = await this.page.evaluate(async (duration) => {
      let frameCount = 0;
      const startTime = performance.now();

      return new Promise<number>((resolve) => {
        const countFrame = () => {
          frameCount++;
          if (performance.now() - startTime < duration) {
            requestAnimationFrame(countFrame);
          } else {
            resolve(frameCount);
          }
        };
        requestAnimationFrame(countFrame);
      });
    }, duration);

    const fps = (frames / duration) * 1000;
    this.recordMetric('frameRate', fps, 'fps');
    return fps;
  }

  async measureLongTasks(): Promise<number[]> {
    const longTasks = await this.page.evaluate(() => {
      return new Promise<number[]>((resolve) => {
        const tasks: number[] = [];
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            tasks.push(entry.duration);
          }
        });
        observer.observe({ entryTypes: ['longtask'] });

        setTimeout(() => {
          observer.disconnect();
          resolve(tasks);
        }, 5000);
      });
    });

    if (longTasks.length > 0) {
      const maxTask = Math.max(...longTasks);
      this.recordMetric('maxLongTask', maxTask, 'ms');
    }

    return longTasks;
  }

  async measureMemoryUsage(): Promise<number> {
    const memory = await this.app.evaluate(async ({ process }) => {
      return process.memoryUsage().heapUsed / 1024 / 1024;
    });

    this.recordMetric('memoryUsage', memory, 'MB');
    return memory;
  }

  async measureIPCLatency(channel: string): Promise<number> {
    const startTime = Date.now();

    await this.page.evaluate(async (channel) => {
      return window.electron.ipcRenderer.invoke(channel);
    }, channel);

    const latency = Date.now() - startTime;
    this.recordMetric('ipcLatency', latency, 'ms');
    return latency;
  }

  async measureDbQueryTime(query: string): Promise<number> {
    const startTime = Date.now();

    await this.page.evaluate(async (query) => {
      return window.electron.ipcRenderer.invoke('db:query', query);
    }, query);

    const queryTime = Date.now() - startTime;
    this.recordMetric('dbQueryTime', queryTime, 'ms');
    return queryTime;
  }

  private recordMetric(metric: string, value: number, unit: string): void {
    const threshold = thresholds[metric as keyof typeof thresholds];
    const passed = threshold ? value <= threshold : true;

    this.metrics.push({
      timestamp: Date.now(),
      metric,
      value,
      unit,
      passed,
    });
  }

  getMetrics(): PerformanceMetrics[] {
    return this.metrics;
  }

  getFailedMetrics(): PerformanceMetrics[] {
    return this.metrics.filter((m) => !m.passed);
  }

  generateReport(): string {
    const report: string[] = ['# Performance Report', ''];

    for (const metric of this.metrics) {
      const status = metric.passed ? '✅' : '❌';
      report.push(`${status} **${metric.metric}**: ${metric.value.toFixed(2)} ${metric.unit}`);
    }

    const failed = this.getFailedMetrics();
    if (failed.length > 0) {
      report.push('', '## Failed Metrics', '');
      for (const metric of failed) {
        const threshold = thresholds[metric.metric as keyof typeof thresholds];
        report.push(`- ${metric.metric}: ${metric.value.toFixed(2)} ${metric.unit} (threshold: ${threshold})`);
      }
    }

    return report.join('\n');
  }
}
```

### 启动性能测试
```typescript
// e2e/performance/launch.perf.ts
import { test, expect } from '@playwright/test';
import { launchApp, closeApp, type AppContext } from '../utils/electron-app';
import { PerformanceMonitor } from './utils';
import { thresholds } from './config';

let context: AppContext;
let monitor: PerformanceMonitor;

test.describe('Launch Performance', () => {
  test.beforeEach(async () => {
    context = await launchApp();
    monitor = new PerformanceMonitor(context.app, context.page);
  });

  test.afterEach(async () => {
    console.log(monitor.generateReport());
    if (context?.app) {
      await closeApp(context.app);
    }
  });

  test('should launch within acceptable time', async () => {
    const launchTime = await monitor.measureLaunchTime();
    expect(launchTime).toBeLessThan(thresholds.appLaunchTime);
  });

  test('should render first content quickly', async () => {
    const fcp = await monitor.measureFirstContentfulPaint();
    expect(fcp).toBeLessThan(thresholds.firstContentfulPaint);
  });

  test('should become interactive quickly', async () => {
    const tti = await monitor.measureTimeToInteractive();
    expect(tti).toBeLessThan(thresholds.timeToInteractive);
  });

  test('should maintain low memory usage on startup', async () => {
    const memory = await monitor.measureMemoryUsage();
    expect(memory).toBeLessThan(thresholds.memoryLimit);
  });
});
```

### 渲染性能测试
```typescript
// e2e/performance/rendering.perf.ts
import { test, expect } from '@playwright/test';
import { launchApp, closeApp, type AppContext } from '../utils/electron-app';
import { PerformanceMonitor } from './utils';
import { thresholds } from './config';

let context: AppContext;
let monitor: PerformanceMonitor;

test.describe('Rendering Performance', () => {
  test.beforeEach(async () => {
    context = await launchApp();
    monitor = new PerformanceMonitor(context.app, context.page);
  });

  test.afterEach(async () => {
    console.log(monitor.generateReport());
    if (context?.app) {
      await closeApp(context.app);
    }
  });

  test('should maintain stable frame rate', async () => {
    await context.page.goto('/#/dashboard');
    await context.page.waitForLoadState('networkidle');

    const fps = await monitor.measureFrameRate();
    expect(fps).toBeGreaterThan(thresholds.frameRate);
  });

  test('should avoid long tasks during navigation', async () => {
    await context.page.goto('/#/tasks');
    const longTasks = await monitor.measureLongTasks();

    const exceedingTasks = longTasks.filter((t) => t > thresholds.longTaskThreshold);
    expect(exceedingTasks.length).toBeLessThan(3);
  });

  test('should scroll task list smoothly', async () => {
    const { page } = context;

    // Create many tasks for scroll test
    await page.goto('/#/tasks');
    for (let i = 0; i < 50; i++) {
      await page.evaluate((i) => {
        window.electron.ipcRenderer.invoke('task:create', {
          title: `Scroll Test Task ${i}`,
          status: 'pending',
        });
      }, i);
    }

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Measure frame rate during scroll
    const taskList = page.locator('[data-testid="task-list"]');
    
    const scrollFps = await page.evaluate(async () => {
      const list = document.querySelector('[data-testid="task-list"]');
      if (!list) return 0;

      let frameCount = 0;
      const startTime = performance.now();

      return new Promise<number>((resolve) => {
        const countFrame = () => {
          frameCount++;
          list.scrollTop += 10;
          
          if (list.scrollTop < list.scrollHeight - list.clientHeight) {
            requestAnimationFrame(countFrame);
          } else {
            const duration = performance.now() - startTime;
            resolve((frameCount / duration) * 1000);
          }
        };
        requestAnimationFrame(countFrame);
      });
    });

    expect(scrollFps).toBeGreaterThan(thresholds.frameRate);
  });

  test('should animate modal smoothly', async () => {
    const { page } = context;

    await page.goto('/#/tasks');
    await page.waitForLoadState('networkidle');

    // Measure animation frame rate
    const animationStart = performance.now();
    await page.click('[data-testid="add-task-button"]');

    const modalFps = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let frameCount = 0;
        const startTime = performance.now();

        const countFrame = () => {
          frameCount++;
          if (performance.now() - startTime < 300) {
            // Modal animation duration
            requestAnimationFrame(countFrame);
          } else {
            resolve((frameCount / 300) * 1000);
          }
        };
        requestAnimationFrame(countFrame);
      });
    });

    expect(modalFps).toBeGreaterThan(thresholds.frameRate);
  });
});
```

### 数据性能测试
```typescript
// e2e/performance/data.perf.ts
import { test, expect } from '@playwright/test';
import { launchApp, closeApp, type AppContext } from '../utils/electron-app';
import { PerformanceMonitor } from './utils';
import { thresholds } from './config';

let context: AppContext;
let monitor: PerformanceMonitor;

test.describe('Data Performance', () => {
  test.beforeEach(async () => {
    context = await launchApp();
    monitor = new PerformanceMonitor(context.app, context.page);
  });

  test.afterEach(async () => {
    console.log(monitor.generateReport());
    if (context?.app) {
      await closeApp(context.app);
    }
  });

  test('should query tasks quickly', async () => {
    const { page } = context;

    // Create test data
    for (let i = 0; i < 100; i++) {
      await page.evaluate((i) => {
        return window.electron.ipcRenderer.invoke('task:create', {
          title: `Perf Test Task ${i}`,
          status: 'pending',
        });
      }, i);
    }

    // Measure query time
    const queryTime = await page.evaluate(async () => {
      const start = performance.now();
      await window.electron.ipcRenderer.invoke('task:get-all');
      return performance.now() - start;
    });

    expect(queryTime).toBeLessThan(thresholds.dbQueryTime);
  });

  test('should have low IPC latency', async () => {
    const latency = await monitor.measureIPCLatency('app:get-version');
    expect(latency).toBeLessThan(thresholds.ipcLatency);
  });

  test('should handle bulk operations efficiently', async () => {
    const { page } = context;

    // Bulk create
    const createTime = await page.evaluate(async () => {
      const tasks = Array.from({ length: 50 }, (_, i) => ({
        title: `Bulk Task ${i}`,
        status: 'pending',
      }));

      const start = performance.now();
      await window.electron.ipcRenderer.invoke('task:create-bulk', tasks);
      return performance.now() - start;
    });

    expect(createTime).toBeLessThan(500);

    // Bulk update
    const updateTime = await page.evaluate(async () => {
      const start = performance.now();
      await window.electron.ipcRenderer.invoke('task:update-bulk', {
        filter: { status: 'pending' },
        update: { status: 'completed' },
      });
      return performance.now() - start;
    });

    expect(updateTime).toBeLessThan(500);
  });

  test('should maintain stable memory under load', async () => {
    const { page } = context;

    // Initial memory
    const initialMemory = await monitor.measureMemoryUsage();

    // Create load
    for (let i = 0; i < 200; i++) {
      await page.evaluate((i) => {
        return window.electron.ipcRenderer.invoke('task:create', {
          title: `Memory Test Task ${i}`,
          description: 'A'.repeat(1000), // 1KB description
        });
      }, i);
    }

    // Memory after load
    const loadedMemory = await monitor.measureMemoryUsage();

    // Memory increase should be reasonable
    const memoryIncrease = loadedMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(100); // Less than 100MB increase

    // Total memory should still be under limit
    expect(loadedMemory).toBeLessThan(thresholds.memoryLimit);
  });

  test('should cleanup memory after large operations', async () => {
    const { page } = context;

    // Create and then delete many items
    const ids = await page.evaluate(async () => {
      const createdIds: string[] = [];
      for (let i = 0; i < 100; i++) {
        const task = await window.electron.ipcRenderer.invoke('task:create', {
          title: `Cleanup Test ${i}`,
        });
        createdIds.push(task.id);
      }
      return createdIds;
    }, []);

    const beforeDelete = await monitor.measureMemoryUsage();

    // Delete all
    await page.evaluate(async (ids) => {
      for (const id of ids) {
        await window.electron.ipcRenderer.invoke('task:delete', id);
      }
    }, ids);

    // Force GC if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });

    await context.page.waitForTimeout(1000);

    const afterDelete = await monitor.measureMemoryUsage();

    // Memory should decrease or stay stable
    expect(afterDelete).toBeLessThanOrEqual(beforeDelete + 10);
  });
});
```

### 性能测试报告
```typescript
// e2e/performance/reporter.ts
import fs from 'fs';
import path from 'path';
import { type PerformanceMetrics } from './config';

export class PerformanceReporter {
  private results: Map<string, PerformanceMetrics[]> = new Map();

  addTestResults(testName: string, metrics: PerformanceMetrics[]): void {
    this.results.set(testName, metrics);
  }

  generateHTMLReport(): string {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Performance Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    .passed { color: green; }
    .failed { color: red; }
    .chart { height: 200px; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>Performance Test Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  
  ${Array.from(this.results.entries())
    .map(
      ([testName, metrics]) => `
    <h2>${testName}</h2>
    <table>
      <tr>
        <th>Metric</th>
        <th>Value</th>
        <th>Unit</th>
        <th>Status</th>
      </tr>
      ${metrics
        .map(
          (m) => `
        <tr>
          <td>${m.metric}</td>
          <td>${m.value.toFixed(2)}</td>
          <td>${m.unit}</td>
          <td class="${m.passed ? 'passed' : 'failed'}">${m.passed ? '✓ Passed' : '✗ Failed'}</td>
        </tr>
      `
        )
        .join('')}
    </table>
  `
    )
    .join('')}
</body>
</html>
    `;

    return html;
  }

  saveReport(outputPath: string): void {
    const html = this.generateHTMLReport();
    fs.writeFileSync(outputPath, html);
  }

  generateJSON(): string {
    const data = Object.fromEntries(this.results);
    return JSON.stringify(data, null, 2);
  }

  saveJSONReport(outputPath: string): void {
    const json = this.generateJSON();
    fs.writeFileSync(outputPath, json);
  }
}
```

## 验收标准

- [ ] 应用启动时间 < 3 秒
- [ ] 首屏渲染时间 < 1.5 秒
- [ ] 帧率保持 > 55fps
- [ ] IPC 延迟 < 50ms
- [ ] 数据库查询 < 100ms
- [ ] 内存使用 < 500MB
- [ ] 性能报告正确生成
- [ ] TypeScript 类型检查通过

## 相关文件

- `e2e/performance/config.ts`
- `e2e/performance/utils.ts`
- `e2e/performance/launch.perf.ts`
- `e2e/performance/rendering.perf.ts`
- `e2e/performance/data.perf.ts`
- `e2e/performance/reporter.ts`
