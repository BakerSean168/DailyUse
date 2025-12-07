/**
 * EPIC-003: Memory Leak Detector
 * 
 * 内存泄漏检测器，用于长期运行测试
 */
import * as fs from 'fs';
import * as path from 'path';

export interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;    // MB
  heapTotal: number;   // MB
  external: number;    // MB
  rss: number;         // MB
}

export interface LeakAnalysisResult {
  hasLeak: boolean;
  confidence: number;
  growthPerHour?: number;
  message: string;
  snapshots?: MemorySnapshot[];
}

export class MemoryLeakDetector {
  private snapshots: MemorySnapshot[] = [];
  private interval: NodeJS.Timeout | null = null;
  private outputDir: string;
  
  constructor(outputDir?: string) {
    this.outputDir = outputDir || path.join(__dirname, 'results');
  }
  
  /**
   * 开始监控
   */
  startMonitoring(intervalMs: number = 30000): void {
    console.log(`[LeakDetector] 开始监控内存 (间隔: ${intervalMs}ms)`);
    
    this.interval = setInterval(() => {
      this.takeSnapshot();
    }, intervalMs);
    
    // 立即取一次快照
    this.takeSnapshot();
  }
  
  /**
   * 停止监控
   */
  stopMonitoring(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    console.log('[LeakDetector] 监控已停止');
  }
  
  /**
   * 获取快照
   */
  takeSnapshot(): void {
    const usage = process.memoryUsage();
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      heapUsed: usage.heapUsed / 1024 / 1024,
      heapTotal: usage.heapTotal / 1024 / 1024,
      external: usage.external / 1024 / 1024,
      rss: usage.rss / 1024 / 1024,
    };
    
    this.snapshots.push(snapshot);
    
    // 保留最近 100 个快照
    if (this.snapshots.length > 100) {
      this.snapshots.shift();
    }
    
    console.log(
      `[LeakDetector] Snapshot #${this.snapshots.length}: ` +
      `Heap=${snapshot.heapUsed.toFixed(1)}MB, RSS=${snapshot.rss.toFixed(1)}MB`
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
  
  /**
   * 分析是否有内存泄漏
   */
  analyzeForLeaks(): LeakAnalysisResult {
    if (this.snapshots.length < 10) {
      return {
        hasLeak: false,
        confidence: 0,
        message: `样本不足 (${this.snapshots.length}/10)`
      };
    }
    
    // 计算趋势线斜率
    const heapUsedValues = this.snapshots.map(s => s.heapUsed);
    const slope = this.calculateSlope(heapUsedValues);
    
    // 计算时间跨度 (小时)
    const firstSnapshot = this.snapshots[0];
    const lastSnapshot = this.snapshots[this.snapshots.length - 1];
    const durationHours = (lastSnapshot.timestamp - firstSnapshot.timestamp) / (1000 * 60 * 60);
    
    if (durationHours < 0.01) {
      return {
        hasLeak: false,
        confidence: 0,
        message: '监控时间太短'
      };
    }
    
    // 计算每小时增长率 (MB/h)
    const samplesPerHour = this.snapshots.length / durationHours;
    const growthPerHour = slope * samplesPerHour;
    
    // 判断标准：
    // - 每小时增长 > 10MB 视为可能泄漏
    // - 每小时增长 > 50MB 视为严重泄漏
    const hasLeak = growthPerHour > 10;
    const confidence = Math.min(Math.abs(growthPerHour) / 50, 1);
    
    // 计算总增长
    const totalGrowth = lastSnapshot.heapUsed - firstSnapshot.heapUsed;
    
    return {
      hasLeak,
      confidence,
      growthPerHour,
      message: hasLeak
        ? `⚠️ 检测到内存泄漏：每小时增长 ${growthPerHour.toFixed(1)}MB (总增长 ${totalGrowth.toFixed(1)}MB)`
        : `✅ 未检测到明显内存泄漏 (每小时 ${growthPerHour.toFixed(1)}MB)`,
      snapshots: this.snapshots,
    };
  }
  
  /**
   * 导出结果
   */
  exportResults(filename?: string): void {
    const result = this.analyzeForLeaks();
    
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    const outputPath = path.join(
      this.outputDir,
      filename || `memory-analysis-${Date.now()}.json`
    );
    
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`[LeakDetector] 结果已导出: ${outputPath}`);
  }
  
  /**
   * 短期泄漏测试 (5 分钟)
   */
  async runQuickTest(): Promise<LeakAnalysisResult> {
    console.log('[LeakDetector] 开始 5 分钟快速内存泄漏测试...');
    
    this.startMonitoring(10000); // 每 10 秒一次快照
    
    // 等待 5 分钟
    await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    
    this.stopMonitoring();
    const result = this.analyzeForLeaks();
    this.exportResults('quick-leak-test.json');
    
    return result;
  }
  
  /**
   * 长期泄漏测试 (可配置时间)
   */
  async runExtendedTest(durationMinutes: number = 60): Promise<LeakAnalysisResult> {
    console.log(`[LeakDetector] 开始 ${durationMinutes} 分钟内存泄漏测试...`);
    
    const intervalMs = Math.max(30000, (durationMinutes * 60 * 1000) / 100);
    this.startMonitoring(intervalMs);
    
    // 等待指定时间
    await new Promise(resolve => setTimeout(resolve, durationMinutes * 60 * 1000));
    
    this.stopMonitoring();
    const result = this.analyzeForLeaks();
    this.exportResults(`extended-leak-test-${durationMinutes}min.json`);
    
    return result;
  }
  
  /**
   * 获取当前统计信息
   */
  getStats(): {
    snapshotCount: number;
    currentHeap: number;
    currentRss: number;
    peakHeap: number;
    peakRss: number;
  } {
    if (this.snapshots.length === 0) {
      return {
        snapshotCount: 0,
        currentHeap: 0,
        currentRss: 0,
        peakHeap: 0,
        peakRss: 0,
      };
    }
    
    const current = this.snapshots[this.snapshots.length - 1];
    const peakHeap = Math.max(...this.snapshots.map(s => s.heapUsed));
    const peakRss = Math.max(...this.snapshots.map(s => s.rss));
    
    return {
      snapshotCount: this.snapshots.length,
      currentHeap: current.heapUsed,
      currentRss: current.rss,
      peakHeap,
      peakRss,
    };
  }
}

// CLI 入口
if (require.main === module) {
  const args = process.argv.slice(2);
  const duration = parseInt(args[0]) || 5;
  
  const detector = new MemoryLeakDetector();
  
  console.log(`\n开始 ${duration} 分钟内存泄漏测试...\n`);
  
  detector.runExtendedTest(duration)
    .then(result => {
      console.log('\n========================================');
      console.log('📊 内存泄漏分析结果');
      console.log('========================================');
      console.log(result.message);
      console.log(`置信度: ${(result.confidence * 100).toFixed(0)}%`);
      if (result.growthPerHour !== undefined) {
        console.log(`每小时增长: ${result.growthPerHour.toFixed(2)} MB/h`);
      }
      console.log('========================================\n');
      
      process.exit(result.hasLeak ? 1 : 0);
    })
    .catch(error => {
      console.error('测试失败:', error);
      process.exit(1);
    });
}
