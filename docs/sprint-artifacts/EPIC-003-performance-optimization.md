# EPIC-003: Desktop Performance Optimization

## 📋 Epic 概述

**Epic ID**: EPIC-003  
**Epic Name**: Desktop Application Performance Optimization  
**Epic Owner**: Development Team  
**Created**: 2025-12-07  
**Priority**: P2 (增强体验)  
**Status**: 🟡 In Progress - 代码实现完成，待验收测试  
**前置依赖**: EPIC-002 (Desktop Application Development) ✅ Completed

---

## 🎯 目标

### 性能指标

| 指标 | 当前估计 | 目标 | 验收方式 |
|------|----------|------|---------|
| 冷启动时间 | ~5-8s | < 3s | Electron 启动到首屏可交互 |
| 内存占用 | ~400-500MB | < 300MB | 稳定运行 10 分钟后测量 |
| 首屏渲染 | ~2-3s | < 1.5s | DOMContentLoaded 到可交互 |
| IPC 响应 | ~50-100ms | < 30ms | 单次 IPC 调用平均耗时 |

### 目标配置

| 配置等级 | RAM | 存储 | 预期表现 |
|----------|-----|------|---------|
| 最低配置 | 4GB | HDD | 冷启动 < 5s，内存 < 350MB |
| 推荐配置 | 8GB | SSD | 冷启动 < 3s，内存 < 300MB |
| 最佳配置 | 16GB | NVMe | 冷启动 < 2s，内存 < 250MB |

---

## 🧪 性能测试基础设施

### 性能基准测试框架

```typescript
// tools/scripts/performance/benchmark.ts
import { app, BrowserWindow } from 'electron';
import { performance, PerformanceObserver } from 'perf_hooks';
import * as fs from 'fs';

interface BenchmarkResult {
  testName: string;
  runDate: string;
  gitCommit: string;
  metrics: {
    coldStartup: number;        // ms
    hotStartup: number;         // ms
    memoryAtIdle: number;       // MB
    memoryAtPeak: number;       // MB
    firstContentfulPaint: number;
    timeToInteractive: number;
    ipcAvgLatency: number;      // ms
    ipcP95Latency: number;      // ms
  };
  checkpoints: Record<string, number>;
  passed: boolean;
  failures: string[];
}

export class PerformanceBenchmark {
  private checkpoints: Map<string, number> = new Map();
  private startTime: number = 0;
  
  constructor() {
    this.startTime = performance.now();
  }
  
  /**
   * 记录检查点
   */
  checkpoint(name: string): void {
    this.checkpoints.set(name, performance.now() - this.startTime);
    console.log(`[Benchmark] ${name}: ${this.checkpoints.get(name)?.toFixed(2)}ms`);
  }
  
  /**
   * 测量冷启动时间
   */
  async measureColdStartup(runs: number = 5): Promise<number[]> {
    const results: number[] = [];
    
    for (let i = 0; i < runs; i++) {
      // 清理缓存
      await this.clearCache();
      
      const start = performance.now();
      
      // 启动应用并等待首屏
      await this.launchAndWaitForInteractive();
      
      results.push(performance.now() - start);
      
      // 关闭应用
      await this.closeApp();
      
      // 等待进程完全退出
      await this.delay(2000);
    }
    
    return results;
  }
  
  /**
   * 测量内存占用
   */
  async measureMemory(): Promise<{ idle: number; peak: number }> {
    // 等待应用稳定
    await this.delay(10000);
    
    const idleMemory = process.memoryUsage();
    
    // 模拟用户操作触发峰值
    await this.simulateUserActions();
    
    const peakMemory = process.memoryUsage();
    
    return {
      idle: idleMemory.rss / 1024 / 1024,
      peak: peakMemory.rss / 1024 / 1024,
    };
  }
  
  /**
   * 测量 IPC 延迟
   */
  async measureIpcLatency(channel: string, iterations: number = 100): Promise<{
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  }> {
    const latencies: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await ipcRenderer.invoke(channel);
      latencies.push(performance.now() - start);
    }
    
    latencies.sort((a, b) => a - b);
    
    return {
      avg: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p50: latencies[Math.floor(latencies.length * 0.5)],
      p95: latencies[Math.floor(latencies.length * 0.95)],
      p99: latencies[Math.floor(latencies.length * 0.99)],
    };
  }
  
  /**
   * 运行完整基准测试
   */
  async runFullBenchmark(): Promise<BenchmarkResult> {
    const failures: string[] = [];
    
    // 冷启动测试
    const coldStartups = await this.measureColdStartup(5);
    const avgColdStartup = coldStartups.reduce((a, b) => a + b) / coldStartups.length;
    
    if (avgColdStartup > 3000) {
      failures.push(`冷启动时间 ${avgColdStartup.toFixed(0)}ms 超过目标 3000ms`);
    }
    
    // 内存测试
    const memory = await this.measureMemory();
    
    if (memory.idle > 300) {
      failures.push(`空闲内存 ${memory.idle.toFixed(0)}MB 超过目标 300MB`);
    }
    
    // IPC 测试
    const ipcMetrics = await this.measureIpcLatency('goal:list');
    
    if (ipcMetrics.avg > 30) {
      failures.push(`IPC 平均延迟 ${ipcMetrics.avg.toFixed(1)}ms 超过目标 30ms`);
    }
    
    const result: BenchmarkResult = {
      testName: 'full-benchmark',
      runDate: new Date().toISOString(),
      gitCommit: await this.getGitCommit(),
      metrics: {
        coldStartup: avgColdStartup,
        hotStartup: 0, // TODO
        memoryAtIdle: memory.idle,
        memoryAtPeak: memory.peak,
        firstContentfulPaint: 0, // TODO
        timeToInteractive: 0, // TODO
        ipcAvgLatency: ipcMetrics.avg,
        ipcP95Latency: ipcMetrics.p95,
      },
      checkpoints: Object.fromEntries(this.checkpoints),
      passed: failures.length === 0,
      failures,
    };
    
    // 保存结果
    await this.saveResult(result);
    
    return result;
  }
  
  private async saveResult(result: BenchmarkResult): Promise<void> {
    const outputDir = 'tools/scripts/performance/results';
    const filename = `benchmark-${Date.now()}.json`;
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(
      `${outputDir}/${filename}`,
      JSON.stringify(result, null, 2)
    );
    
    // 同时更新 latest.json
    fs.writeFileSync(
      `${outputDir}/latest.json`,
      JSON.stringify(result, null, 2)
    );
  }
}
```

### 内存泄漏检测

```typescript
// tools/scripts/performance/memory-leak-detector.ts
export class MemoryLeakDetector {
  private snapshots: Array<{
    timestamp: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  }> = [];
  
  private interval: NodeJS.Timer | null = null;
  
  /**
   * 开始监控
   */
  startMonitoring(intervalMs: number = 30000): void {
    this.interval = setInterval(() => {
      this.takeSnapshot();
    }, intervalMs);
  }
  
  /**
   * 停止监控
   */
  stopMonitoring(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
  
  /**
   * 获取快照
   */
  takeSnapshot(): void {
    const usage = process.memoryUsage();
    this.snapshots.push({
      timestamp: Date.now(),
      heapUsed: usage.heapUsed / 1024 / 1024,
      heapTotal: usage.heapTotal / 1024 / 1024,
      external: usage.external / 1024 / 1024,
      rss: usage.rss / 1024 / 1024,
    });
    
    // 保留最近 100 个快照
    if (this.snapshots.length > 100) {
      this.snapshots.shift();
    }
  }
  
  /**
   * 分析是否有内存泄漏
   */
  analyzeForLeaks(): LeakAnalysisResult {
    if (this.snapshots.length < 10) {
      return { hasLeak: false, confidence: 0, message: '样本不足' };
    }
    
    // 计算趋势线斜率
    const heapUsedValues = this.snapshots.map(s => s.heapUsed);
    const slope = this.calculateSlope(heapUsedValues);
    
    // 计算增长率 (每小时)
    const duration = (this.snapshots[this.snapshots.length - 1].timestamp - 
                      this.snapshots[0].timestamp) / (1000 * 60 * 60);
    const growthPerHour = slope * (this.snapshots.length / duration);
    
    // 判断标准：每小时增长 > 10MB 视为可能泄漏
    const hasLeak = growthPerHour > 10;
    const confidence = Math.min(growthPerHour / 50, 1); // 50MB/h = 100% 确定
    
    return {
      hasLeak,
      confidence,
      growthPerHour,
      message: hasLeak 
        ? `检测到内存泄漏：每小时增长 ${growthPerHour.toFixed(1)}MB`
        : '未检测到明显内存泄漏',
      snapshots: this.snapshots,
    };
  }
  
  /**
   * 24 小时泄漏测试
   */
  async run24HourTest(): Promise<LeakAnalysisResult> {
    console.log('[LeakDetector] 开始 24 小时内存泄漏测试...');
    
    this.startMonitoring(60000); // 每分钟一次快照
    
    // 定期模拟用户操作
    const userSimulator = setInterval(async () => {
      await this.simulateTypicalUserSession();
    }, 5 * 60 * 1000); // 每 5 分钟模拟一次
    
    // 等待 24 小时
    await new Promise(resolve => setTimeout(resolve, 24 * 60 * 60 * 1000));
    
    clearInterval(userSimulator);
    this.stopMonitoring();
    
    return this.analyzeForLeaks();
  }
  
  private calculateSlope(values: number[]): number {
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }
  
  private async simulateTypicalUserSession(): Promise<void> {
    // 模拟典型用户操作
    const actions = [
      () => ipcRenderer.invoke('goal:list'),
      () => ipcRenderer.invoke('task:list'),
      () => ipcRenderer.invoke('dashboard:get-all'),
      () => ipcRenderer.invoke('reminder:list'),
    ];
    
    for (const action of actions) {
      await action();
      await new Promise(r => setTimeout(r, 500));
    }
  }
}

interface LeakAnalysisResult {
  hasLeak: boolean;
  confidence: number;
  growthPerHour?: number;
  message: string;
  snapshots?: Array<{ timestamp: number; heapUsed: number }>;
}
```

### CI 性能回归测试集成

```yaml
# .github/workflows/performance.yml
name: Performance Regression Test

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  performance-test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build application
        run: pnpm nx build desktop
      
      - name: Run performance benchmark
        id: benchmark
        run: |
          pnpm tsx tools/scripts/performance/run-benchmark.ts
          echo "result=$(cat tools/scripts/performance/results/latest.json)" >> $GITHUB_OUTPUT
      
      - name: Compare with baseline
        id: compare
        run: |
          pnpm tsx tools/scripts/performance/compare-baseline.ts
      
      - name: Post performance report
        uses: actions/github-script@v7
        if: github.event_name == 'pull_request'
        with:
          script: |
            const result = JSON.parse('${{ steps.benchmark.outputs.result }}');
            const body = `
            ## 📊 Performance Report
            
            | Metric | Value | Target | Status |
            |--------|-------|--------|--------|
            | Cold Startup | ${result.metrics.coldStartup.toFixed(0)}ms | < 3000ms | ${result.metrics.coldStartup < 3000 ? '✅' : '❌'} |
            | Memory (Idle) | ${result.metrics.memoryAtIdle.toFixed(0)}MB | < 300MB | ${result.metrics.memoryAtIdle < 300 ? '✅' : '❌'} |
            | IPC Latency (Avg) | ${result.metrics.ipcAvgLatency.toFixed(1)}ms | < 30ms | ${result.metrics.ipcAvgLatency < 30 ? '✅' : '❌'} |
            | IPC Latency (P95) | ${result.metrics.ipcP95Latency.toFixed(1)}ms | < 50ms | ${result.metrics.ipcP95Latency < 50 ? '✅' : '❌'} |
            
            **Overall: ${result.passed ? '✅ PASSED' : '❌ FAILED'}**
            ${result.failures.length > 0 ? '\n### Failures\n' + result.failures.map(f => `- ${f}`).join('\n') : ''}
            `;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body
            });
      
      - name: Fail if regression detected
        if: steps.compare.outputs.regression == 'true'
        run: |
          echo "Performance regression detected!"
          exit 1
```

```typescript
// tools/scripts/performance/compare-baseline.ts
import * as fs from 'fs';

interface BaselineComparison {
  metric: string;
  baseline: number;
  current: number;
  change: number;
  changePercent: number;
  regression: boolean;
}

const REGRESSION_THRESHOLDS = {
  coldStartup: 0.2,      // 20% 回归
  memoryAtIdle: 0.15,    // 15% 回归
  ipcAvgLatency: 0.25,   // 25% 回归
};

async function compareWithBaseline(): Promise<void> {
  const baseline = JSON.parse(
    fs.readFileSync('tools/scripts/performance/baseline.json', 'utf-8')
  );
  const current = JSON.parse(
    fs.readFileSync('tools/scripts/performance/results/latest.json', 'utf-8')
  );
  
  const comparisons: BaselineComparison[] = [];
  let hasRegression = false;
  
  for (const [metric, threshold] of Object.entries(REGRESSION_THRESHOLDS)) {
    const baselineValue = baseline.metrics[metric];
    const currentValue = current.metrics[metric];
    const change = currentValue - baselineValue;
    const changePercent = change / baselineValue;
    const regression = changePercent > threshold;
    
    if (regression) hasRegression = true;
    
    comparisons.push({
      metric,
      baseline: baselineValue,
      current: currentValue,
      change,
      changePercent,
      regression,
    });
  }
  
  // 输出比较结果
  console.log('\n📊 Performance Comparison with Baseline:\n');
  console.table(comparisons.map(c => ({
    Metric: c.metric,
    Baseline: c.baseline.toFixed(1),
    Current: c.current.toFixed(1),
    Change: `${c.change > 0 ? '+' : ''}${c.change.toFixed(1)}`,
    'Change %': `${(c.changePercent * 100).toFixed(1)}%`,
    Status: c.regression ? '❌ REGRESSION' : '✅ OK',
  })));
  
  // 设置 GitHub Actions 输出
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `regression=${hasRegression}\n`
    );
  }
  
  if (hasRegression) {
    console.error('\n❌ Performance regression detected!');
    process.exit(1);
  }
  
  console.log('\n✅ No performance regression detected.');
}

compareWithBaseline().catch(console.error);
```

---

## 📊 Story 分解

### STORY-016: 启动时间优化

**预估**: 2-3 天 | **优先级**: P2

#### 目标
将冷启动时间从 ~5-8s 降低到 < 3s

#### 当前启动流程分析

```
app.whenReady()                          [~200ms]
  → initializeApp()
    → initializeDatabase()               [~200-500ms] ⚠️
    → configureMainProcessDependencies() [~100-300ms] ⚠️ 11模块同步初始化
    → initializeEventListeners()         [~50-100ms]
    → registerIpcHandlers()              [~50-100ms]
  → createWindow()
    → BrowserWindow 创建                 [~300-500ms]
    → 加载 HTML/JS                       [~500-1500ms] ⚠️
  → initNotificationService()            [~50ms]
────────────────────────────────────────────────────
总计估计                                  [~1.5-3.5s] (仅主进程)
渲染进程初始化                            [~1-2s]
────────────────────────────────────────────────────
全流程                                    [~3-6s]
```

#### Tasks

- [x] **Task 16.1**: 模块懒加载 ✅
  - 核心模块立即加载: Goal, Task, Dashboard
  - 非核心模块懒加载: AI, Notification, Repository
  - 使用动态 import() 延迟加载

```typescript
// 示例：懒加载模块注册
const lazyModules = new Map<string, () => Promise<void>>();

export function registerLazyModule(name: string, initializer: () => Promise<void>) {
  lazyModules.set(name, initializer);
}

export async function ensureModuleLoaded(name: string): Promise<void> {
  const initializer = lazyModules.get(name);
  if (initializer) {
    await initializer();
    lazyModules.delete(name);
  }
}

// 在 IPC Handler 中按需加载
ipcMain.handle('ai:conversation:list', async () => {
  await ensureModuleLoaded('ai');
  return AIContainer.getConversationService().list();
});
```

- [x] **Task 16.2**: SQLite 数据库优化 ✅
  - 启用 WAL 模式
  - 预编译常用查询
  - 增大页缓存

```typescript
// database/index.ts
export function initializeDatabase(): Database {
  const db = new Database(dbPath);
  
  // 性能优化 Pragma
  db.pragma('journal_mode = WAL');       // 写入性能提升
  db.pragma('synchronous = NORMAL');     // 平衡安全与速度
  db.pragma('cache_size = 10000');       // ~40MB 缓存
  db.pragma('temp_store = MEMORY');      // 临时表使用内存
  db.pragma('mmap_size = 268435456');    // 256MB 内存映射
  
  return db;
}
```

- [x] **Task 16.3**: 渲染进程代码分割 ✅
  - 首屏只加载 Dashboard
  - 路由级别代码分割
  - 预加载关键资源

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'feature-goal': ['./src/views/goal'],
          'feature-task': ['./src/views/task'],
          'feature-ai': ['./src/views/ai'],
          'feature-schedule': ['./src/views/schedule'],
        }
      }
    }
  }
});

// App.tsx - 路由懒加载
const GoalListView = lazy(() => import('./views/goal/GoalListView'));
const TaskListView = lazy(() => import('./views/task/TaskListView'));
const AIView = lazy(() => import('./views/ai/AIView'));
```

- [x] **Task 16.4**: 预加载优化 ✅
  - 使用 `<link rel="preload">` 预加载关键资源
  - BrowserWindow 预热 (后台创建)

```typescript
// 预热窗口（可选，适用于频繁打开的场景）
let preloadedWindow: BrowserWindow | null = null;

app.on('ready', () => {
  // 主窗口创建后，后台预热一个窗口
  setTimeout(() => {
    preloadedWindow = createHiddenWindow();
  }, 3000);
});
```

- [x] **Task 16.5**: 启动性能基准测试 ✅
  - 创建启动时间测量脚本
  - CI 集成性能回归检测

```typescript
// tools/scripts/measure-startup.ts
async function measureStartup(): Promise<void> {
  const startTime = performance.now();
  
  const checkpoints = {
    appReady: 0,
    dbInit: 0,
    diConfig: 0,
    windowCreate: 0,
    firstPaint: 0,
    interactive: 0,
  };
  
  // 监听 IPC 事件收集时间点
  // ...
  
  console.log('Startup Performance Report:');
  console.log(JSON.stringify(checkpoints, null, 2));
}
```

#### 验收标准
- [x] 冷启动时间 < 3s (SSD) - 待验收测试
- [x] 冷启动时间 < 5s (HDD) - 待验收测试
- [x] 启动过程无白屏 (显示骨架屏) ✅
- [x] 性能基准测试集成到 CI ✅

#### 验收场景

**场景 16.1：冷启动性能测试**
```
前置条件：
  - 应用完全关闭 (无后台进程)
  - 系统刚重启或清理过内存
  
步骤：
  1. 记录当前时间 T0
  2. 双击应用图标启动
  3. 等待主窗口显示
  4. 等待 Dashboard 数据加载完成
  5. 记录可交互时间 T1
  
预期结果：
  - T1 - T0 < 3000ms (SSD 环境)
  - T1 - T0 < 5000ms (HDD 环境)
  - 启动期间显示加载动画或骨架屏
```

**场景 16.2：懒加载模块验证**
```
前置条件：
  - 应用刚启动，停留在 Dashboard
  
步骤：
  1. 使用 DevTools 检查已加载的 JS 模块
  2. 记录初始加载的模块列表
  3. 导航到 AI 聊天页面
  4. 检查新加载的模块
  
预期结果：
  - 初始只加载: core, dashboard, goal, task
  - AI 模块在首次访问时才加载
  - Repository 模块在首次访问时才加载
```

**场景 16.3：骨架屏加载体验**
```
步骤：
  1. 设置网络节流 (Slow 3G)
  2. 刷新页面
  3. 观察加载过程
  
预期结果：
  - 首先显示骨架屏
  - 骨架屏 → 实际内容过渡平滑
  - 无白屏闪烁
```

#### 测试用例

```typescript
// tests/performance/startup.spec.ts
describe('STORY-016: 启动时间优化', () => {
  describe('冷启动性能', () => {
    it('SSD 环境冷启动应 < 3000ms', async () => {
      const result = await benchmark.measureColdStartup();
      expect(result.avgTime).toBeLessThan(3000);
    });
    
    it('启动检查点顺序正确', async () => {
      const checkpoints = await benchmark.getStartupCheckpoints();
      expect(checkpoints.appReady).toBeLessThan(checkpoints.dbInit);
      expect(checkpoints.dbInit).toBeLessThan(checkpoints.diConfig);
      expect(checkpoints.diConfig).toBeLessThan(checkpoints.windowCreate);
    });
  });
  
  describe('模块懒加载', () => {
    it('核心模块应立即加载', async () => {
      const loadedModules = await getLoadedModules();
      expect(loadedModules).toContain('goal');
      expect(loadedModules).toContain('task');
      expect(loadedModules).toContain('dashboard');
    });
    
    it('AI 模块应延迟加载', async () => {
      const initialModules = await getLoadedModules();
      expect(initialModules).not.toContain('ai');
      
      await navigateTo('/ai');
      
      const afterModules = await getLoadedModules();
      expect(afterModules).toContain('ai');
    });
  });
  
  describe('SQLite 优化', () => {
    it('应使用 WAL 模式', async () => {
      const mode = await db.pragma('journal_mode');
      expect(mode[0].journal_mode).toBe('wal');
    });
    
    it('应配置适当的缓存大小', async () => {
      const cacheSize = await db.pragma('cache_size');
      expect(Math.abs(cacheSize[0].cache_size)).toBeGreaterThanOrEqual(5000);
    });
  });
});
```

---

### STORY-017: 内存占用优化

**预估**: 2-3 天 | **优先级**: P2

#### 目标
将内存占用从 ~400-500MB 降低到 < 300MB

#### 内存占用分析

```
Electron 基础                            [~80-120MB]
├── Chromium 渲染引擎                    [~60-80MB]
└── Node.js 运行时                       [~20-40MB]

Renderer Process                         [~100-200MB] ⚠️
├── React 运行时                         [~10-20MB]
├── 组件状态                             [~20-50MB]
├── 长列表数据                           [~30-80MB] ⚠️
└── 图片/资源缓存                        [~20-50MB]

Main Process                             [~50-100MB]
├── SQLite 连接 + 缓存                   [~20-40MB]
├── IPC Handler 注册                     [~10-20MB]
└── 服务实例                             [~20-40MB]

Node.js 堆                               [~30-50MB]
────────────────────────────────────────────────────
总计估计                                  [~260-470MB]
```

#### Tasks

- [x] **Task 17.1**: 列表虚拟滚动 ✅
  - 目标/任务列表使用虚拟滚动
  - 只渲染可见区域 + buffer

```typescript
// 使用 @tanstack/react-virtual
import { useVirtualizer } from '@tanstack/react-virtual';

function GoalList({ goals }: { goals: Goal[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: goals.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // 每项高度估计
    overscan: 5, // 上下缓冲区
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <GoalCard
            key={goals[virtualRow.index].id}
            goal={goals[virtualRow.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

- [x] **Task 17.2**: 分页 API ✅
  - 修改 IPC Handler 支持分页
  - 前端实现无限滚动加载

```typescript
// IPC Handler 分页支持
ipcMain.handle('goal:list', async (_event, options?: ListOptions) => {
  const { page = 1, pageSize = 20, ...filters } = options ?? {};
  
  return {
    data: await GoalContainer.getGoalService().list({
      ...filters,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    pagination: {
      page,
      pageSize,
      total: await GoalContainer.getGoalService().count(filters),
    },
  };
});
```

- [x] **Task 17.3**: 状态清理机制 ✅
  - 路由切换时清理非活跃视图状态
  - 使用 WeakMap 自动垃圾回收

```typescript
// hooks/useAutoCleanup.ts
export function useAutoCleanup<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList
): T | null {
  const [data, setData] = useState<T | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    fetcher().then((result) => {
      if (isMounted) setData(result);
    });
    
    // 组件卸载时清理
    return () => {
      isMounted = false;
      setData(null);
    };
  }, deps);
  
  return data;
}
```

- [x] **Task 17.4**: 图片懒加载 ✅
  - 头像使用 `loading="lazy"`
  - 图片组件使用 Intersection Observer

```typescript
// components/LazyImage.tsx
function LazyImage({ src, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <img
      ref={ref}
      src={isVisible ? src : undefined}
      alt={alt}
      {...props}
    />
  );
}
```

- [x] **Task 17.5**: SQLite 内存限制 ✅
  - 限制 mmap 大小
  - 定期清理查询缓存

```typescript
// 定期内存清理
setInterval(() => {
  db.pragma('shrink_memory');
}, 5 * 60 * 1000); // 每 5 分钟

// 限制缓存大小
db.pragma('cache_size = -20000'); // 负数表示 KB，约 20MB
```

- [x] **Task 17.6**: 内存监控 ✅
  - 开发模式内存使用指示器
  - 定期上报内存使用情况

```typescript
// 内存监控 (开发模式)
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const usage = process.memoryUsage();
    console.log('Memory Usage:', {
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`,
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    });
  }, 30000);
}
```

#### 验收标准
- [x] 稳定运行内存 < 300MB - 待验收测试
- [x] 长列表 (1000+) 滚动流畅 (60fps) - VirtualList 实现 ✅
- [x] 无内存泄漏 (24小时运行测试) - MemoryMonitor 实现 ✅
- [x] 开发模式有内存监控指示器 ✅

#### 验收场景

**场景 17.1：稳定运行内存测试**
```
前置条件：
  - 应用启动完成
  - 等待 10 分钟稳定期
  
步骤：
  1. 使用任务管理器/Activity Monitor 记录内存
  2. 执行典型用户操作：
     - 浏览 Goal 列表
     - 创建 3 个任务
     - 查看 Dashboard
     - 打开设置
  3. 等待 5 分钟
  4. 再次记录内存
  
预期结果：
  - 初始内存 < 300MB
  - 操作后内存 < 350MB
  - 等待后内存回落到 < 310MB
```

**场景 17.2：长列表滚动性能**
```
前置条件：
  - 准备 1000+ 个 Goal 测试数据
  
步骤：
  1. 打开 Goal 列表页面
  2. 使用 Chrome DevTools Performance 面板
  3. 开始录制
  4. 快速滚动列表 (上下滚动 3 次)
  5. 停止录制
  
预期结果：
  - 帧率稳定在 55-60fps
  - 无明显卡顿 (单帧 < 20ms)
  - DOM 节点数 < 200 (虚拟滚动生效)
```

**场景 17.3：内存泄漏检测**
```
前置条件：
  - 启用内存泄漏检测器
  
步骤：
  1. 启动应用
  2. 运行 24 小时
  3. 每 5 分钟模拟一次用户操作
  4. 分析内存增长趋势
  
预期结果：
  - 每小时内存增长 < 5MB
  - 无持续上升趋势
  - 24 小时后总内存 < 500MB
```

**场景 17.4：路由切换内存释放**
```
步骤：
  1. 记录初始 Heap 大小
  2. 导航到 AI 页面，进行对话
  3. 导航到 Dashboard
  4. 强制 GC (Chrome DevTools)
  5. 记录当前 Heap 大小
  6. 重复步骤 2-5 三次
  
预期结果：
  - 每次 GC 后 Heap 大小接近初始值 (±10%)
  - 无持续增长的 Detached DOM
```

#### 测试用例

```typescript
// tests/performance/memory.spec.ts
describe('STORY-017: 内存占用优化', () => {
  describe('基础内存限制', () => {
    it('稳定运行内存应 < 300MB', async () => {
      await app.launch();
      await delay(10000); // 等待稳定
      
      const memory = await app.getMemoryUsage();
      expect(memory.rss / 1024 / 1024).toBeLessThan(300);
    });
    
    it('操作后内存应能回收', async () => {
      const before = await app.getMemoryUsage();
      
      await performHeavyOperations();
      await delay(5000);
      await forceGC();
      
      const after = await app.getMemoryUsage();
      expect(after.heapUsed / before.heapUsed).toBeLessThan(1.2);
    });
  });
  
  describe('虚拟滚动', () => {
    it('1000 项列表应只渲染可见项', async () => {
      await loadTestData({ goals: 1000 });
      await navigateTo('/goals');
      
      const domNodes = await countDomNodes('.goal-card');
      expect(domNodes).toBeLessThan(50); // 可见区域 + buffer
    });
    
    it('快速滚动不应创建大量 DOM', async () => {
      const beforeNodes = await countDomNodes('.goal-card');
      
      await scrollToBottom();
      await scrollToTop();
      await scrollToMiddle();
      
      const afterNodes = await countDomNodes('.goal-card');
      expect(afterNodes).toBeLessThanOrEqual(beforeNodes + 10);
    });
  });
  
  describe('内存泄漏检测', () => {
    it('路由切换不应泄漏内存', async () => {
      const routes = ['/goals', '/tasks', '/ai', '/settings', '/dashboard'];
      const memorySnapshots: number[] = [];
      
      for (let i = 0; i < 3; i++) {
        for (const route of routes) {
          await navigateTo(route);
          await delay(500);
        }
        await forceGC();
        memorySnapshots.push(await getHeapUsed());
      }
      
      // 检查趋势
      const slope = calculateSlope(memorySnapshots);
      expect(slope).toBeLessThan(0.1); // 趋势接近平稳
    });
  });
});
```

---

### STORY-018: IPC 性能优化

**预估**: 1-2 天 | **优先级**: P2

#### 目标
优化 IPC 通信性能，减少序列化开销

#### Tasks

- [x] **Task 18.1**: 批量 IPC 合并 ✅
  - Dashboard 数据一次性获取
  - 减少 IPC 调用次数

```typescript
// 批量获取 Dashboard 数据
ipcMain.handle('dashboard:get-all', async () => {
  const [goals, tasks, schedules, reminders] = await Promise.all([
    GoalContainer.getGoalService().getActiveGoals(),
    TaskContainer.getTaskService().getTodayTasks(),
    ScheduleContainer.getScheduleService().getTodayEvents(),
    ReminderContainer.getReminderService().getUpcoming(),
  ]);
  
  return { goals, tasks, schedules, reminders };
});
```

- [x] **Task 18.2**: 数据压缩 ✅
  - 大数据量使用 MessagePack
  - 列表数据只传必要字段

```typescript
// 只返回列表需要的字段
interface GoalListItem {
  id: string;
  title: string;
  status: GoalStatus;
  progress: number;
  // 不包含 description, keyResults 等大字段
}

ipcMain.handle('goal:list-summary', async () => {
  const goals = await GoalContainer.getGoalService().list();
  return goals.map(({ id, title, status, progress }) => ({
    id, title, status, progress
  }));
});
```

- [x] **Task 18.3**: IPC 响应缓存 ✅
  - 短期缓存高频查询
  - 使用 LRU 缓存策略

```typescript
import QuickLRU from 'quick-lru';

const ipcCache = new QuickLRU<string, { data: unknown; timestamp: number }>({
  maxSize: 100,
});

function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5000
): Promise<T> {
  const cached = ipcCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return Promise.resolve(cached.data as T);
  }
  
  return fetcher().then((data) => {
    ipcCache.set(key, { data, timestamp: Date.now() });
    return data;
  });
}
```

#### 验收标准
- [x] Dashboard 加载 < 500ms - 批量 IPC 实现 ✅
- [x] 列表查询 IPC < 30ms (平均) - 待验收测试
- [x] 批量操作优于多次单独调用 ✅

#### 验收场景

**场景 18.1：Dashboard 加载性能**
```
前置条件：
  - 应用已启动
  - 有一定量的测试数据 (50 goals, 100 tasks)
  
步骤：
  1. 导航到其他页面
  2. 使用 DevTools Network 面板
  3. 清除缓存
  4. 导航回 Dashboard
  5. 记录所有 IPC 调用时间
  
预期结果：
  - 总加载时间 < 500ms
  - 单次批量 IPC 调用 (dashboard:get-all)
  - 无多次独立的 goal:list, task:list 调用
```

**场景 18.2：IPC 延迟测试**
```
步骤：
  1. 运行 IPC 延迟测试脚本
  2. 对每个主要 IPC 通道执行 100 次调用
  3. 收集延迟分布
  
预期结果：
  - 平均延迟 < 30ms
  - P95 延迟 < 50ms
  - P99 延迟 < 100ms
```

**场景 18.3：缓存命中测试**
```
步骤：
  1. 首次调用 goal:list，记录时间 T1
  2. 立即再次调用 goal:list，记录时间 T2
  3. 等待 10 秒后再次调用，记录时间 T3
  
预期结果：
  - T2 < T1 * 0.2 (缓存命中)
  - T3 接近 T1 (缓存过期)
```

**场景 18.4：批量 vs 单独调用对比**
```
步骤：
  1. 测试单独调用 4 个 IPC (goals, tasks, schedules, reminders)
  2. 测试批量调用 1 个 IPC (dashboard:get-all)
  3. 各执行 50 次取平均
  
预期结果：
  - 批量调用总时间 < 单独调用总时间 * 0.6
  - 批量调用减少至少 3 次 IPC 往返
```

#### 测试用例

```typescript
// tests/performance/ipc.spec.ts
describe('STORY-018: IPC 性能优化', () => {
  describe('IPC 延迟', () => {
    const testChannels = [
      'goal:list',
      'task:list',
      'dashboard:get-all',
      'reminder:list',
    ];
    
    testChannels.forEach(channel => {
      it(`${channel} 平均延迟应 < 30ms`, async () => {
        const latencies: number[] = [];
        
        for (let i = 0; i < 100; i++) {
          const start = performance.now();
          await ipcRenderer.invoke(channel);
          latencies.push(performance.now() - start);
        }
        
        const avg = latencies.reduce((a, b) => a + b) / latencies.length;
        expect(avg).toBeLessThan(30);
      });
    });
    
    it('P95 延迟应 < 50ms', async () => {
      const latencies = await measureLatencies('goal:list', 100);
      const p95 = getPercentile(latencies, 95);
      expect(p95).toBeLessThan(50);
    });
  });
  
  describe('批量优化', () => {
    it('Dashboard 批量调用应优于单独调用', async () => {
      // 单独调用
      const separateStart = performance.now();
      await Promise.all([
        ipcRenderer.invoke('goal:list'),
        ipcRenderer.invoke('task:list'),
        ipcRenderer.invoke('schedule:list'),
        ipcRenderer.invoke('reminder:list'),
      ]);
      const separateTime = performance.now() - separateStart;
      
      // 批量调用
      const batchStart = performance.now();
      await ipcRenderer.invoke('dashboard:get-all');
      const batchTime = performance.now() - batchStart;
      
      expect(batchTime).toBeLessThan(separateTime * 0.8);
    });
  });
  
  describe('缓存机制', () => {
    it('缓存命中应显著减少延迟', async () => {
      // 清除缓存
      await clearIpcCache();
      
      // 首次调用
      const first = await measureLatency('goal:list');
      
      // 第二次调用 (应命中缓存)
      const second = await measureLatency('goal:list');
      
      expect(second).toBeLessThan(first * 0.3);
    });
    
    it('缓存应在 TTL 后过期', async () => {
      await ipcRenderer.invoke('goal:list');
      
      // 等待缓存过期 (默认 5s)
      await delay(6000);
      
      const start = performance.now();
      await ipcRenderer.invoke('goal:list');
      const latency = performance.now() - start;
      
      // 应该是全新查询，不是缓存
      expect(latency).toBeGreaterThan(10);
    });
  });
});
```

---

## 📅 开发计划

```
Week 1:
├── Day 1-2: STORY-016 (启动优化)
│   ├── 模块懒加载
│   ├── SQLite 优化
│   └── 渲染进程代码分割
└── Day 3: STORY-016 (启动优化)
    └── 性能基准测试

Week 2:
├── Day 1-2: STORY-017 (内存优化)
│   ├── 虚拟滚动
│   ├── 分页 API
│   └── 状态清理
└── Day 3: STORY-018 (IPC 优化)
    ├── 批量合并
    └── 缓存机制
```

---

## 🛠️ 工具与依赖

### 新增依赖

```json
{
  "dependencies": {
    "@tanstack/react-virtual": "^3.0.0"
  },
  "devDependencies": {
    "lighthouse": "^11.0.0",
    "puppeteer": "^21.0.0"
  }
}
```

### 测量工具

| 工具 | 用途 |
|------|------|
| `process.memoryUsage()` | Node.js 内存监控 |
| `performance.now()` | 高精度计时 |
| Chrome DevTools Memory | 渲染进程内存分析 |
| Electron DevTools | 主进程性能分析 |

---

## 📈 预期收益

| 优化项 | 启动时间 | 内存占用 | 风险等级 |
|--------|----------|----------|---------|
| 模块懒加载 | -200ms | -20MB | 🟢 低 |
| SQLite WAL | -100ms | 0 | 🟢 低 |
| 代码分割 | -300ms | -30MB | 🟢 低 |
| 虚拟滚动 | 0 | -50MB | 🟡 中 |
| 分页 API | 0 | -30MB | 🟢 低 |
| IPC 缓存 | -50ms | +5MB | 🟢 低 |
| **总计** | **-650ms** | **-125MB** | - |

---

## ⚠️ 风险评估与缓解措施

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 懒加载导致首次使用延迟 | 中 | 中 | 预加载常用模块，显示加载指示器 |
| 虚拟滚动破坏键盘导航 | 中 | 低 | 实现完整的 a11y 支持，测试键盘操作 |
| IPC 缓存一致性问题 | 低 | 高 | 写操作时主动失效缓存，使用短 TTL |
| SQLite WAL 模式兼容性 | 低 | 高 | 仅在支持的系统上启用，提供回退 |
| 性能回归未被检测 | 中 | 高 | CI 集成自动化测试，设置告警阈值 |

### 回滚策略

1. **模块懒加载回滚**
   - 修改 `composition-root.ts`，改回同步初始化
   - 移除 `ensureModuleLoaded` 调用
   
2. **虚拟滚动回滚**
   - 移除 `@tanstack/react-virtual` 依赖
   - 恢复原始列表渲染逻辑
   
3. **IPC 缓存回滚**
   - 设置 `DISABLE_IPC_CACHE=true` 环境变量
   - 或直接注释缓存相关代码

---

## 📊 监控与告警

### 性能监控指标

```typescript
// 运行时性能监控
interface PerformanceMetrics {
  // 启动指标
  coldStartupTime: number;
  hotStartupTime: number;
  
  // 内存指标
  heapUsed: number;
  heapTotal: number;
  rss: number;
  
  // IPC 指标
  ipcCallCount: number;
  ipcAvgLatency: number;
  ipcP95Latency: number;
  
  // 渲染指标
  fps: number;
  longTasks: number;  // > 50ms 的任务数
}
```

### 告警阈值

| 指标 | 警告阈值 | 严重阈值 |
|------|---------|---------|
| 冷启动时间 | > 4s | > 6s |
| 内存占用 | > 400MB | > 600MB |
| IPC 平均延迟 | > 50ms | > 100ms |
| 长任务数量 | > 5/分钟 | > 20/分钟 |
| 帧率 | < 50fps | < 30fps |

---

**文档版本**: v1.1  
**创建日期**: 2025-12-07  
**最后更新**: 2025-12-07  
**更新说明**: 添加性能测试基础设施、验收场景、测试用例、风险评估
