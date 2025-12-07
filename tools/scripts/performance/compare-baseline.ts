/**
 * EPIC-003: Compare with Baseline
 * 
 * 比较当前性能测试结果与基准值，检测性能回归
 */
import * as fs from 'fs';
import * as path from 'path';

interface BenchmarkResult {
  testName: string;
  runDate: string;
  gitCommit: string;
  metrics: {
    coldStartup: number;
    hotStartup: number;
    memoryAtIdle: number;
    memoryAtPeak: number;
    firstContentfulPaint: number;
    timeToInteractive: number;
    ipcAvgLatency: number;
    ipcP95Latency: number;
  };
  passed: boolean;
  failures: string[];
}

interface BaselineComparison {
  metric: string;
  baseline: number;
  current: number;
  change: number;
  changePercent: number;
  threshold: number;
  regression: boolean;
}

// 回归阈值：超过这个百分比视为回归
const REGRESSION_THRESHOLDS: Record<string, number> = {
  coldStartup: 0.20,      // 20% 回归
  memoryAtIdle: 0.15,     // 15% 回归
  ipcAvgLatency: 0.25,    // 25% 回归
  ipcP95Latency: 0.30,    // 30% 回归
};

const RESULTS_DIR = path.join(__dirname, 'results');
const BASELINE_PATH = path.join(__dirname, 'baseline.json');
const LATEST_PATH = path.join(RESULTS_DIR, 'latest.json');

function loadJson<T>(filepath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch {
    return null;
  }
}

async function compareWithBaseline(): Promise<void> {
  console.log('\n========================================');
  console.log('📊 性能基准对比分析');
  console.log('========================================\n');
  
  // 加载基准值
  const baseline = loadJson<BenchmarkResult>(BASELINE_PATH);
  if (!baseline) {
    console.log('⚠️ 未找到基准文件，使用当前结果创建基准...');
    
    const current = loadJson<BenchmarkResult>(LATEST_PATH);
    if (current) {
      fs.writeFileSync(BASELINE_PATH, JSON.stringify(current, null, 2));
      console.log('✅ 基准文件已创建');
    } else {
      console.error('❌ 未找到最新测试结果');
      process.exit(1);
    }
    return;
  }
  
  // 加载当前结果
  const current = loadJson<BenchmarkResult>(LATEST_PATH);
  if (!current) {
    console.error('❌ 未找到最新测试结果');
    process.exit(1);
  }
  
  console.log(`基准版本: ${baseline.gitCommit} (${baseline.runDate})`);
  console.log(`当前版本: ${current.gitCommit} (${current.runDate})\n`);
  
  // 比较各项指标
  const comparisons: BaselineComparison[] = [];
  let hasRegression = false;
  
  for (const [metric, threshold] of Object.entries(REGRESSION_THRESHOLDS)) {
    const baselineValue = baseline.metrics[metric as keyof typeof baseline.metrics];
    const currentValue = current.metrics[metric as keyof typeof current.metrics];
    
    if (baselineValue === undefined || currentValue === undefined) continue;
    
    const change = currentValue - baselineValue;
    const changePercent = baselineValue > 0 ? change / baselineValue : 0;
    const regression = changePercent > threshold;
    
    if (regression) hasRegression = true;
    
    comparisons.push({
      metric,
      baseline: baselineValue,
      current: currentValue,
      change,
      changePercent,
      threshold,
      regression,
    });
  }
  
  // 打印比较表格
  console.log('┌────────────────────┬──────────┬──────────┬──────────┬──────────┬────────┐');
  console.log('│ Metric             │ Baseline │ Current  │ Change   │ Change % │ Status │');
  console.log('├────────────────────┼──────────┼──────────┼──────────┼──────────┼────────┤');
  
  for (const c of comparisons) {
    const metricPadded = c.metric.padEnd(18);
    const baselinePadded = c.baseline.toFixed(1).padStart(8);
    const currentPadded = c.current.toFixed(1).padStart(8);
    const changeStr = (c.change >= 0 ? '+' : '') + c.change.toFixed(1);
    const changePadded = changeStr.padStart(8);
    const percentStr = (c.changePercent * 100).toFixed(1) + '%';
    const percentPadded = percentStr.padStart(8);
    const status = c.regression ? '❌ REG' : '✅ OK ';
    
    console.log(`│ ${metricPadded} │${baselinePadded} │${currentPadded} │${changePadded} │${percentPadded} │ ${status} │`);
  }
  
  console.log('└────────────────────┴──────────┴──────────┴──────────┴──────────┴────────┘');
  
  // 总结
  console.log('\n========================================');
  if (hasRegression) {
    console.log('❌ 检测到性能回归！');
    console.log('\n回归项目:');
    comparisons
      .filter(c => c.regression)
      .forEach(c => {
        console.log(`  - ${c.metric}: ${(c.changePercent * 100).toFixed(1)}% (阈值: ${(c.threshold * 100).toFixed(0)}%)`);
      });
  } else {
    console.log('✅ 未检测到性能回归');
  }
  console.log('========================================\n');
  
  // 设置 GitHub Actions 输出
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `regression=${hasRegression}\n`
    );
    
    // 生成 PR 评论内容
    const commentBody = generatePRComment(comparisons, baseline, current, hasRegression);
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `comment<<EOF\n${commentBody}\nEOF\n`
    );
  }
  
  // 返回状态码
  process.exit(hasRegression ? 1 : 0);
}

function generatePRComment(
  comparisons: BaselineComparison[],
  baseline: BenchmarkResult,
  current: BenchmarkResult,
  hasRegression: boolean
): string {
  let comment = `## 📊 Performance Comparison Report

| Metric | Baseline | Current | Change | Status |
|--------|----------|---------|--------|--------|
`;

  for (const c of comparisons) {
    const changeStr = `${c.change >= 0 ? '+' : ''}${c.change.toFixed(1)} (${(c.changePercent * 100).toFixed(1)}%)`;
    const status = c.regression ? '❌ REGRESSION' : '✅ OK';
    comment += `| ${c.metric} | ${c.baseline.toFixed(1)} | ${c.current.toFixed(1)} | ${changeStr} | ${status} |\n`;
  }

  comment += `\n**Baseline**: ${baseline.gitCommit} (${baseline.runDate.split('T')[0]})\n`;
  comment += `**Current**: ${current.gitCommit} (${current.runDate.split('T')[0]})\n\n`;
  comment += hasRegression
    ? '⚠️ **Performance regression detected!** Please investigate before merging.'
    : '✅ **No performance regression detected.**';

  return comment;
}

// 更新基准命令
function updateBaseline(): void {
  const current = loadJson<BenchmarkResult>(LATEST_PATH);
  if (!current) {
    console.error('❌ 未找到最新测试结果');
    process.exit(1);
  }
  
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(current, null, 2));
  console.log('✅ 基准已更新');
  console.log(`   Commit: ${current.gitCommit}`);
  console.log(`   Date: ${current.runDate}`);
}

// CLI
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'update') {
    updateBaseline();
  } else {
    compareWithBaseline().catch(console.error);
  }
}
