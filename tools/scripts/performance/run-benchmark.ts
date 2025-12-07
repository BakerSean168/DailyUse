/**
 * EPIC-003: Performance Test Runner
 * 
 * 性能测试入口脚本
 */
import { PerformanceBenchmark } from './benchmark';
import { MemoryLeakDetector } from './memory-leak-detector';

interface RunnerOptions {
  mode: 'full' | 'quick' | 'memory' | 'startup' | 'ipc';
  duration?: number;
}

async function parseArgs(): Promise<RunnerOptions> {
  const args = process.argv.slice(2);
  const options: RunnerOptions = {
    mode: 'quick'
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--full':
        options.mode = 'full';
        break;
      case '--quick':
        options.mode = 'quick';
        break;
      case '--memory':
        options.mode = 'memory';
        break;
      case '--startup':
        options.mode = 'startup';
        break;
      case '--ipc':
        options.mode = 'ipc';
        break;
      case '--duration':
        options.duration = parseInt(args[++i]) || 5;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }
  
  return options;
}

function printHelp(): void {
  console.log(`
DailyUse Performance Test Runner

Usage: pnpm tsx tools/scripts/performance/run-benchmark.ts [options]

Options:
  --full        运行完整性能测试套件
  --quick       运行快速测试 (默认)
  --memory      仅运行内存泄漏测试
  --startup     仅运行启动时间测试
  --ipc         仅运行 IPC 延迟测试
  --duration N  内存测试持续时间 (分钟，默认 5)
  --help, -h    显示帮助信息

Examples:
  pnpm tsx tools/scripts/performance/run-benchmark.ts --full
  pnpm tsx tools/scripts/performance/run-benchmark.ts --memory --duration 30
  pnpm tsx tools/scripts/performance/run-benchmark.ts --quick
`);
}

async function runBenchmarks(options: RunnerOptions): Promise<void> {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   DailyUse Performance Test Runner     ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  const startTime = Date.now();
  let passed = true;
  
  try {
    switch (options.mode) {
      case 'full': {
        console.log('🔄 运行完整性能测试套件...\n');
        
        const benchmark = new PerformanceBenchmark();
        const result = await benchmark.runFullBenchmark();
        passed = result.passed;
        
        if (passed) {
          // 如果基准测试通过，也运行一个快速内存测试
          console.log('\n🔄 运行内存泄漏快速检测...\n');
          const detector = new MemoryLeakDetector();
          const leakResult = await detector.runQuickTest();
          if (leakResult.hasLeak) {
            passed = false;
          }
        }
        break;
      }
      
      case 'quick': {
        console.log('🔄 运行快速性能测试...\n');
        const benchmark = new PerformanceBenchmark({
          thresholds: {
            coldStartup: 5000,    // 放宽阈值用于快速测试
            memoryAtIdle: 400,
            ipcAvgLatency: 50,
            ipcP95Latency: 100,
          }
        });
        
        // 简化测试：只测 IPC 和内存快照
        console.log('📊 测量 IPC 延迟...');
        const ipc = await benchmark.measureIpcLatency(20);
        console.log(`   平均: ${ipc.avg.toFixed(1)}ms, P95: ${ipc.p95.toFixed(1)}ms`);
        
        console.log('📊 测量内存占用...');
        const memory = await benchmark.measureMemory();
        console.log(`   空闲: ${memory.idle.toFixed(0)}MB, 峰值: ${memory.peak.toFixed(0)}MB`);
        
        passed = ipc.avg < 50 && memory.idle < 400;
        break;
      }
      
      case 'memory': {
        const duration = options.duration || 5;
        console.log(`🔄 运行 ${duration} 分钟内存泄漏测试...\n`);
        
        const detector = new MemoryLeakDetector();
        const result = await detector.runExtendedTest(duration);
        
        console.log('\n' + result.message);
        passed = !result.hasLeak;
        break;
      }
      
      case 'startup': {
        console.log('🔄 运行启动时间测试...\n');
        const benchmark = new PerformanceBenchmark();
        
        try {
          const coldStartups = await benchmark.measureColdStartup(3);
          const avg = coldStartups.reduce((a, b) => a + b) / coldStartups.length;
          
          console.log(`\n启动时间测试结果:`);
          coldStartups.forEach((t, i) => {
            console.log(`  运行 ${i + 1}: ${t.toFixed(0)}ms`);
          });
          console.log(`  平均: ${avg.toFixed(0)}ms`);
          
          passed = avg < 3000;
        } catch (error) {
          console.log(`⚠️ 启动测试需要构建好的 Electron 应用`);
          console.log(`   请先运行: pnpm nx build desktop`);
          passed = false;
        }
        break;
      }
      
      case 'ipc': {
        console.log('🔄 运行 IPC 延迟测试...\n');
        const benchmark = new PerformanceBenchmark();
        const result = await benchmark.measureIpcLatency(100);
        
        console.log(`\nIPC 延迟测试结果:`);
        console.log(`  平均: ${result.avg.toFixed(2)}ms`);
        console.log(`  P50:  ${result.p50.toFixed(2)}ms`);
        console.log(`  P95:  ${result.p95.toFixed(2)}ms`);
        console.log(`  P99:  ${result.p99.toFixed(2)}ms`);
        
        passed = result.avg < 30 && result.p95 < 50;
        break;
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n╔════════════════════════════════════════╗');
    console.log(`║ 测试完成 - 耗时 ${duration.padStart(6)}s               ║`);
    console.log(`║ 状态: ${passed ? '✅ 通过' : '❌ 失败'}                           ║`);
    console.log('╚════════════════════════════════════════╝\n');
    
    process.exit(passed ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
    process.exit(1);
  }
}

// 主入口
parseArgs().then(runBenchmarks);
