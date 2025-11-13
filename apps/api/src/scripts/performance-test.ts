#!/usr/bin/env tsx
/**
 * Dashboard API Load Testing Script
 *
 * Runs comprehensive load tests against Dashboard API
 * Usage: tsx src/scripts/performance-test.ts [options]
 *
 * Options:
 *   --url=<url>          API base URL (default: http://localhost:3888)
 *   --token=<token>      Auth token (required)
 *   --concurrent=<n>     Number of concurrent requests (default: 100)
 *   --duration=<sec>     Test duration in seconds (default: 60)
 *   --endpoint=<path>    Endpoint to test (default: /api/dashboard/statistics)
 */

import { createLogger } from '@dailyuse/utils';

const logger = createLogger('PerformanceTest');

interface TestConfig {
  baseUrl: string;
  authToken: string;
  concurrent: number;
  duration: number;
  endpoint: string;
}

interface TestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  durations: number[];
  errors: Array<{ statusCode: number; message: string }>;
}

interface TestReport {
  config: TestConfig;
  result: TestResult;
  metrics: {
    successRate: number;
    avgDuration: number;
    p50: number;
    p95: number;
    p99: number;
    maxDuration: number;
    minDuration: number;
    requestsPerSecond: number;
  };
}

/**
 * Parse command line arguments
 */
function parseArgs(): Partial<TestConfig> {
  const args: Partial<TestConfig> = {};

  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--url=')) {
      args.baseUrl = arg.replace('--url=', '');
    } else if (arg.startsWith('--token=')) {
      args.authToken = arg.replace('--token=', '');
    } else if (arg.startsWith('--concurrent=')) {
      args.concurrent = parseInt(arg.replace('--concurrent=', ''), 10);
    } else if (arg.startsWith('--duration=')) {
      args.duration = parseInt(arg.replace('--duration=', ''), 10);
    } else if (arg.startsWith('--endpoint=')) {
      args.endpoint = arg.replace('--endpoint=', '');
    }
  });

  return args;
}

/**
 * Make HTTP request
 */
async function makeRequest(
  url: string,
  authToken: string,
): Promise<{ success: boolean; duration: number; statusCode: number; error?: string }> {
  const start = Date.now();

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const duration = Date.now() - start;

    if (!response.ok) {
      const text = await response.text();
      return {
        success: false,
        duration,
        statusCode: response.status,
        error: `HTTP ${response.status}: ${text}`,
      };
    }

    return {
      success: true,
      duration,
      statusCode: response.status,
    };
  } catch (error) {
    const duration = Date.now() - start;
    return {
      success: false,
      duration,
      statusCode: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Run concurrent load test
 */
async function runLoadTest(config: TestConfig): Promise<TestResult> {
  const result: TestResult = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    durations: [],
    errors: [],
  };

  const url = `${config.baseUrl}${config.endpoint}`;
  const endTime = Date.now() + config.duration * 1000;

  logger.info(`Starting load test...`);
  logger.info(`URL: ${url}`);
  logger.info(`Concurrent requests: ${config.concurrent}`);
  logger.info(`Duration: ${config.duration}s`);

  // Run test until duration expires
  while (Date.now() < endTime) {
    // Fire concurrent requests
    const promises = Array.from({ length: config.concurrent }, () =>
      makeRequest(url, config.authToken),
    );

    const results = await Promise.all(promises);

    // Process results
    results.forEach((res) => {
      result.totalRequests++;
      result.durations.push(res.duration);

      if (res.success) {
        result.successfulRequests++;
      } else {
        result.failedRequests++;
        result.errors.push({
          statusCode: res.statusCode,
          message: res.error || 'Unknown error',
        });
      }
    });

    // Progress indicator
    const elapsed = ((Date.now() - (endTime - config.duration * 1000)) / 1000).toFixed(1);
    process.stdout.write(
      `\r[${elapsed}s] Requests: ${result.totalRequests}, Success: ${result.successfulRequests}, Failed: ${result.failedRequests}`,
    );

    // Small delay to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(''); // New line after progress indicator
  logger.info(`Load test completed`);

  return result;
}

/**
 * Generate test report
 */
function generateReport(config: TestConfig, result: TestResult): TestReport {
  const sorted = [...result.durations].sort((a, b) => a - b);
  const total = result.durations.length;

  const metrics = {
    successRate: (result.successfulRequests / result.totalRequests) * 100,
    avgDuration: result.durations.reduce((a, b) => a + b, 0) / total,
    p50: sorted[Math.floor(total * 0.5)],
    p95: sorted[Math.floor(total * 0.95)],
    p99: sorted[Math.floor(total * 0.99)],
    maxDuration: Math.max(...result.durations),
    minDuration: Math.min(...result.durations),
    requestsPerSecond: result.totalRequests / config.duration,
  };

  return { config, result, metrics };
}

/**
 * Print test report
 */
function printReport(report: TestReport): void {
  console.log('\n' + '='.repeat(80));
  console.log('PERFORMANCE TEST REPORT');
  console.log('='.repeat(80));

  console.log('\nConfiguration:');
  console.log(`  Endpoint: ${report.config.endpoint}`);
  console.log(`  Concurrent Requests: ${report.config.concurrent}`);
  console.log(`  Duration: ${report.config.duration}s`);

  console.log('\nResults:');
  console.log(`  Total Requests: ${report.result.totalRequests}`);
  console.log(`  Successful: ${report.result.successfulRequests}`);
  console.log(`  Failed: ${report.result.failedRequests}`);

  console.log('\nPerformance Metrics:');
  console.log(`  Success Rate: ${report.metrics.successRate.toFixed(2)}%`);
  console.log(`  Requests/Second: ${report.metrics.requestsPerSecond.toFixed(2)}`);
  console.log(`  Average Duration: ${report.metrics.avgDuration.toFixed(2)}ms`);
  console.log(`  P50 (Median): ${report.metrics.p50}ms`);
  console.log(`  P95: ${report.metrics.p95}ms`);
  console.log(`  P99: ${report.metrics.p99}ms`);
  console.log(`  Min: ${report.metrics.minDuration}ms`);
  console.log(`  Max: ${report.metrics.maxDuration}ms`);

  console.log('\nPerformance Requirements:');
  const cacheHitRequirement = report.metrics.avgDuration <= 100 ? '✅ PASS' : '❌ FAIL';
  const cacheMissRequirement = report.metrics.p95 <= 500 ? '✅ PASS' : '❌ FAIL';
  const successRateRequirement = report.metrics.successRate >= 99 ? '✅ PASS' : '❌ FAIL';

  console.log(
    `  Cache Hit (avg ≤ 100ms): ${cacheHitRequirement} (${report.metrics.avgDuration.toFixed(2)}ms)`,
  );
  console.log(`  Cache Miss (P95 ≤ 500ms): ${cacheMissRequirement} (${report.metrics.p95}ms)`);
  console.log(
    `  Success Rate (≥ 99%): ${successRateRequirement} (${report.metrics.successRate.toFixed(2)}%)`,
  );

  if (report.result.errors.length > 0) {
    console.log('\nErrors (first 10):');
    report.result.errors.slice(0, 10).forEach((error, idx) => {
      console.log(`  ${idx + 1}. [${error.statusCode}] ${error.message}`);
    });
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Run simple smoke test
 */
async function runSmokeTest(config: TestConfig): Promise<boolean> {
  logger.info('Running smoke test...');

  const url = `${config.baseUrl}${config.endpoint}`;
  const result = await makeRequest(url, config.authToken);

  if (result.success) {
    logger.info(`✅ Smoke test passed (${result.duration}ms)`);
    return true;
  } else {
    logger.error(`❌ Smoke test failed: ${result.error}`);
    return false;
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const args = parseArgs();

  const config: TestConfig = {
    baseUrl: args.baseUrl || 'http://localhost:3888',
    authToken: args.authToken || '',
    concurrent: args.concurrent || 100,
    duration: args.duration || 60,
    endpoint: args.endpoint || '/api/dashboard/statistics',
  };

  // Validate config
  if (!config.authToken) {
    logger.error('Auth token is required. Use --token=<token>');
    process.exit(1);
  }

  // Run smoke test first
  const smokeTestPassed = await runSmokeTest(config);
  if (!smokeTestPassed) {
    logger.error('Smoke test failed. Aborting load test.');
    process.exit(1);
  }

  // Run load test
  const result = await runLoadTest(config);

  // Generate and print report
  const report = generateReport(config, result);
  printReport(report);

  // Exit with appropriate code
  const allRequirementsMet =
    report.metrics.successRate >= 99 &&
    report.metrics.avgDuration <= 100 &&
    report.metrics.p95 <= 500;

  if (allRequirementsMet) {
    logger.info('✅ All performance requirements met');
    process.exit(0);
  } else {
    logger.warn('⚠️ Some performance requirements not met');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Performance test failed:', error);
    process.exit(1);
  });
}

export { runLoadTest, generateReport, printReport };
