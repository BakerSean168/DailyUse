# Dashboard Frontend Performance Testing Guide

## Overview

This guide covers frontend performance testing for the Dashboard, including Core Web Vitals, Lighthouse CI, component benchmarks, and Playwright performance tests.

## Performance Requirements

### Core Web Vitals

- **FCP (First Contentful Paint)**: ≤ 1.0s
- **LCP (Largest Contentful Paint)**: ≤ 2.0s
- **FID (First Input Delay)**: ≤ 100ms
- **CLS (Cumulative Layout Shift)**: ≤ 0.1
- **TTI (Time to Interactive)**: ≤ 2.5s
- **TTFB (Time to First Byte)**: ≤ 600ms

### Component Performance

- **Widget Render Time**: ≤ 50ms
- **Widget Re-render Time**: ≤ 30ms
- **Batch Rendering (4 widgets)**: ≤ 150ms

### User Interactions

- **Settings Panel Open**: ≤ 300ms
- **Widget Toggle**: ≤ 200ms
- **Configuration Save**: ≤ 500ms
- **Data Refresh**: ≤ 1000ms

### Lighthouse Score

- **Performance**: ≥ 90
- **Accessibility**: ≥ 90
- **Best Practices**: ≥ 90
- **SEO**: ≥ 90

## Test Files

### 1. Core Web Vitals Monitoring

**Location**: `apps/web/src/utils/performance/webVitals.ts`

**Features**:

- Real-time performance monitoring
- FCP, LCP, FID, CLS, TTFB, TTI tracking
- Automatic metric rating (good/needs-improvement/poor)
- sessionStorage persistence for debugging
- Google Analytics integration support

**Usage**:

```typescript
import {
  initWebVitals,
  getWebVitalsMetrics,
  getPerformanceSummary,
} from '@/utils/performance/webVitals';

// Initialize monitoring (automatically in production)
initWebVitals();

// Get current metrics
const metrics = getWebVitalsMetrics();
console.log('FCP:', metrics.fcp);
console.log('LCP:', metrics.lcp);

// Get summary with ratings
const summary = getPerformanceSummary();
console.log('Overall Rating:', summary.overallRating);
```

### 2. Component Benchmarks

**Location**: `apps/web/src/benchmarks/dashboard-widgets.bench.ts`

**Test Categories**:

- TaskStatsWidget (3 sizes + re-render)
- GoalStatsWidget (3 sizes)
- ReminderStatsWidget (2 sizes)
- ScheduleStatsWidget (2 sizes)
- Batch rendering (all 4 widgets)
- Data updates
- Size changes
- Dashboard computations

**Total**: 19 performance benchmarks

### 3. Playwright Performance Tests

**Location**: `apps/web/e2e/performance/dashboard-performance.spec.ts`

**Test Categories**:

- Page load timing
- Core Web Vitals validation
- Widget rendering performance
- User interaction responsiveness
- Memory efficiency
- CPU throttling scenarios
- Network throttling scenarios

**Total**: 13 performance tests

### 4. Lighthouse CI Configuration

**Location**: `apps/web/lighthouserc.json`

**Features**:

- Automated Lighthouse audits
- Performance budget enforcement
- Desktop preset configuration
- Multiple URL testing
- Assertion-based validation

## Running Tests

### Method 1: Core Web Vitals (Production)

Web Vitals are automatically monitored in production builds:

```bash
# Build for production
cd apps/web
pnpm build

# Preview production build
pnpm preview

# Open browser and check console
# Navigate to http://localhost:4173
# Check console for Web Vitals metrics
```

**View Metrics in Browser Console**:

```javascript
// Get metrics from sessionStorage
JSON.parse(sessionStorage.getItem('webVitals'))

// Example output:
{
  "FCP": {"value": 456.7, "rating": "good", "timestamp": 1699876543210},
  "LCP": {"value": 1234.5, "rating": "good", "timestamp": 1699876543890},
  "CLS": {"value": 0.045, "rating": "good", "timestamp": 1699876548765}
}
```

### Method 2: Component Benchmarks

```bash
cd apps/web

# Run all benchmarks
pnpm bench

# Run specific benchmark file
pnpm bench -- dashboard-widgets.bench.ts

# Watch mode (re-run on changes)
pnpm bench:watch
```

**Expected Output**:

```
✓ src/benchmarks/dashboard-widgets.bench.ts (19)
  ✓ Dashboard Widget Performance Benchmarks (16)
    ✓ TaskStatsWidget (4)
      name                                                 hz       min       max      mean       p75       p99      p995      p999      rme  samples
    · should render TaskStatsWidget (small) within 50ms  2,145  0.3845    1.2456   0.4663    0.5123    0.8901   0.9234    1.1234    ±0.23%    1000
    · should render TaskStatsWidget (medium) within 50ms 2,034  0.4012    1.3234   0.4916    0.5456    0.9345   0.9876    1.2345    ±0.25%    1000
    · should render TaskStatsWidget (large) within 50ms  1,923  0.4234    1.4567   0.5203    0.5789    1.0123   1.0567    1.3456    ±0.27%    1000
    · should re-render TaskStatsWidget within 30ms       3,456  0.2345    0.8901   0.2893    0.3123    0.6789   0.7234    0.8234    ±0.18%    1000

  [... more results ...]
```

**Performance Thresholds**:

- Widget render (any size): Mean ≤ 50ms
- Widget re-render: Mean ≤ 30ms
- Batch rendering (4 widgets): Mean ≤ 150ms

### Method 3: Playwright Performance Tests

```bash
cd apps/web

# Run all performance tests
npx playwright test e2e/performance/

# Run specific test
npx playwright test e2e/performance/dashboard-performance.spec.ts

# Run with headed browser (see what's happening)
npx playwright test e2e/performance/ --headed

# Run in debug mode
npx playwright test e2e/performance/ --debug

# Generate HTML report
npx playwright test e2e/performance/
npx playwright show-report
```

**Expected Output**:

```
Running 13 tests using 1 worker

✓ [chromium] › performance/dashboard-performance.spec.ts:15:3 › [P0] should load Dashboard page within 2.5 seconds (1.2s)
    Dashboard page load time: 1234ms

✓ [chromium] › performance/dashboard-performance.spec.ts:28:3 › [P0] should achieve First Contentful Paint within 1.0s (0.5s)
    First Contentful Paint: 456.78ms

✓ [chromium] › performance/dashboard-performance.spec.ts:50:3 › [P0] should achieve Largest Contentful Paint within 2.0s (1.8s)
    Largest Contentful Paint: 1789.45ms

[... more results ...]

  13 passed (45.2s)
```

### Method 4: Lighthouse CI

#### Prerequisites

```bash
# Install Lighthouse CI globally
npm install -g @lhci/cli

# Or use pnpm
pnpm add -g @lhci/cli
```

#### Run Lighthouse Audits

```bash
cd apps/web

# Build application first
pnpm build

# Run Lighthouse CI
lhci autorun

# Or run individual commands
lhci collect --url=http://localhost:4173
lhci assert
lhci upload
```

**Expected Output**:

```
✅ Lighthouse CI autorun complete

Collecting Lighthouse results...
  ✓ http://localhost:4173/ (run 1 of 3)
  ✓ http://localhost:4173/ (run 2 of 3)
  ✓ http://localhost:4173/ (run 3 of 3)

Asserting against Lighthouse CI policies...
  ✓ categories:performance: ≥ 90 (actual: 94)
  ✓ first-contentful-paint: ≤ 1000ms (actual: 678ms)
  ✓ largest-contentful-paint: ≤ 2000ms (actual: 1456ms)
  ✓ interactive: ≤ 2500ms (actual: 2123ms)
  ✓ cumulative-layout-shift: ≤ 0.1 (actual: 0.032)

Done! All assertions passed.
Reports saved to ./lighthouse-ci-reports
```

## Performance Metrics Explained

### Core Web Vitals

#### First Contentful Paint (FCP)

- **Definition**: Time when first text/image appears
- **Target**: ≤ 1.0s
- **Good**: ≤ 1.8s
- **Poor**: > 3.0s
- **Impact**: User perceives page is loading

#### Largest Contentful Paint (LCP)

- **Definition**: Time when largest element appears
- **Target**: ≤ 2.0s
- **Good**: ≤ 2.5s
- **Poor**: > 4.0s
- **Impact**: Main content visible to user

#### First Input Delay (FID)

- **Definition**: Time from first click to browser response
- **Target**: ≤ 100ms
- **Good**: ≤ 100ms
- **Poor**: > 300ms
- **Impact**: Page responsiveness

#### Cumulative Layout Shift (CLS)

- **Definition**: Sum of all unexpected layout shifts
- **Target**: ≤ 0.1
- **Good**: ≤ 0.1
- **Poor**: > 0.25
- **Impact**: Visual stability

#### Time to Interactive (TTI)

- **Definition**: Time when page is fully interactive
- **Target**: ≤ 2.5s
- **Good**: ≤ 3.8s
- **Poor**: > 7.3s
- **Impact**: User can interact with page

#### Time to First Byte (TTFB)

- **Definition**: Time from request to first byte of response
- **Target**: ≤ 600ms
- **Good**: ≤ 800ms
- **Poor**: > 1800ms
- **Impact**: Server/network performance

### Interpreting Results

#### ✅ PASS Criteria

```
Core Web Vitals:
- FCP ≤ 1.0s
- LCP ≤ 2.0s
- FID ≤ 100ms
- CLS ≤ 0.1
- TTI ≤ 2.5s

Component Performance:
- Widget render ≤ 50ms (mean)
- Widget re-render ≤ 30ms (mean)
- Batch rendering ≤ 150ms (mean)

Lighthouse:
- Performance Score ≥ 90
```

#### ⚠️ WARNING Indicators

- FCP > 1.0s but ≤ 1.8s
- LCP > 2.0s but ≤ 2.5s
- Widget render > 50ms but ≤ 100ms
- Lighthouse Score 80-89

#### ❌ FAIL Criteria

- FCP > 1.8s
- LCP > 2.5s
- FID > 100ms
- CLS > 0.1
- TTI > 3.8s
- Widget render > 100ms
- Lighthouse Score < 80

## Troubleshooting Performance Issues

### Issue 1: High FCP/LCP (> 2.0s)

**Diagnosis**:

```bash
# Check bundle size
cd apps/web
pnpm build
ls -lh dist/assets/*.js

# Analyze bundle
npx vite-bundle-visualizer
```

**Possible Causes**:

1. Large JavaScript bundles
2. Render-blocking resources
3. Slow server response
4. Missing code splitting

**Solutions**:

```typescript
// 1. Lazy load components
const HeavyComponent = defineAsyncComponent(() =>
  import('./components/HeavyComponent.vue')
);

// 2. Code splitting for routes
{
  path: '/dashboard',
  component: () => import('./views/DashboardView.vue')
}

// 3. Preload critical resources
<link rel="preload" href="/critical.css" as="style">

// 4. Optimize images
// Use WebP format, lazy loading, responsive images
```

### Issue 2: High CLS (> 0.1)

**Diagnosis**:

```javascript
// Monitor layout shifts in browser console
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Layout shift:', entry);
  }
});
observer.observe({ type: 'layout-shift', buffered: true });
```

**Possible Causes**:

1. Images without dimensions
2. Dynamic content insertion
3. Web fonts causing FOIT/FOUT
4. Ads or embeds

**Solutions**:

```vue
<!-- 1. Always specify image dimensions -->
<img src="image.jpg" width="400" height="300" alt="..." />
```

### Issue 3: Slow Widget Rendering (> 50ms)

**Diagnosis**:

```typescript
// Add performance marks
performance.mark('widget-render-start');
// ... widget render logic
performance.mark('widget-render-end');
performance.measure('widget-render', 'widget-render-start', 'widget-render-end');

const measure = performance.getEntriesByName('widget-render')[0];
console.log('Widget render time:', measure.duration);
```

**Possible Causes**:

1. Heavy computations in render
2. Large data sets
3. Inefficient reactivity
4. Too many watchers

**Solutions**:

```typescript
// 1. Use computed properties
const filteredItems = computed(() => {
  return items.value.filter((item) => item.visible);
});

// 2. Memoize expensive computations
const expensiveValue = computed(() => {
  // Cached until dependencies change
  return heavyComputation(data.value);
});

// 3. Use virtual scrolling for large lists
import { useVirtualList } from '@vueuse/core';

// 4. Debounce updates
import { debounce } from 'lodash-es';
const debouncedUpdate = debounce(updateData, 300);
```

### Issue 4: Poor Lighthouse Score (< 90)

**Diagnosis**:

```bash
# Run Lighthouse with detailed report
lighthouse http://localhost:4173 \
  --preset=desktop \
  --output=html \
  --output-path=./lighthouse-report.html

# Open report
open ./lighthouse-report.html
```

**Common Issues & Fixes**:

1. **Unused JavaScript/CSS**

   ```bash
   # Enable tree-shaking
   # Check vite.config.ts build.rollupOptions
   ```

2. **Large Images**

   ```bash
   # Optimize images
   npx @squoosh/cli --resize '{width: 800}' image.jpg
   ```

3. **Missing Compression**

   ```typescript
   // Add compression in vite.config.ts
   import viteCompression from 'vite-plugin-compression';

   export default defineConfig({
     plugins: [viteCompression()],
   });
   ```

4. **Long Cache TTL**
   ```typescript
   // Configure cache headers
   // In preview/production server
   res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
   ```

## Performance Monitoring in Production

### 1. Real User Monitoring (RUM)

```typescript
// Send Web Vitals to analytics
import { initWebVitals } from '@/utils/performance/webVitals';

// Automatically sends to Google Analytics if available
initWebVitals();

// Or send to custom endpoint
function reportToAnalytics(metric: WebVitalsMetric) {
  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    body: JSON.stringify(metric),
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### 2. Performance Dashboard

Create a dashboard to track:

- FCP, LCP, FID, CLS, TTI over time
- P50, P75, P95, P99 percentiles
- User agent breakdown
- Geographic distribution
- Network conditions

### 3. Alerts

Set up alerts for:

- LCP > 2.5s for > 10% of users
- CLS > 0.1 for > 5% of users
- Lighthouse score drop > 10 points
- Widget render time > 100ms

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Frontend Performance Tests

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *' # Daily

jobs:
  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2

      - name: Install dependencies
        run: pnpm install

      - name: Build application
        run: |
          cd apps/web
          pnpm build

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          cd apps/web
          lhci autorun

      - name: Run Playwright Performance Tests
        run: |
          cd apps/web
          npx playwright test e2e/performance/

      - name: Upload Lighthouse Reports
        uses: actions/upload-artifact@v3
        with:
          name: lighthouse-reports
          path: apps/web/lighthouse-ci-reports

      - name: Upload Playwright Reports
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: apps/web/playwright-report
```

## Performance Testing Checklist

Before deploying to production:

- [ ] All Core Web Vitals meet targets (FCP, LCP, FID, CLS, TTI)
- [ ] Lighthouse Performance Score ≥ 90
- [ ] All component benchmarks pass (≤ 50ms render time)
- [ ] All Playwright performance tests pass
- [ ] Tested on slow 3G network
- [ ] Tested with 4x CPU throttling
- [ ] Memory usage remains stable
- [ ] No console errors or warnings
- [ ] Images optimized (WebP, lazy loading)
- [ ] Code split appropriately
- [ ] Bundle size < 500KB (gzipped)
- [ ] Performance monitoring configured
- [ ] Alerts set up for regressions

## Next Steps

After completing frontend performance testing:

1. **User Acceptance Testing** (TASK-4.2)
   - Prepare UAT test cases
   - Execute with stakeholders
   - Document feedback

2. **Production Deployment** (TASK-4.3)
   - Deployment documentation
   - Monitoring setup
   - Feature flags configuration

3. **Performance Optimization** (if needed)
   - Address any performance issues found
   - Optimize bundle size
   - Improve Core Web Vitals scores

## References

- [Core Web Vitals Implementation](/apps/web/src/utils/performance/webVitals.ts)
- [Component Benchmarks](/apps/web/src/benchmarks/dashboard-widgets.bench.ts)
- [Playwright Performance Tests](/apps/web/e2e/performance/dashboard-performance.spec.ts)
- [Lighthouse CI Config](/apps/web/lighthouserc.json)
- [Web Vitals Documentation](https://web.dev/vitals/)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)

## Support

For performance issues or questions:

- Check browser DevTools Performance tab
- Review Web Vitals in sessionStorage
- Run Lighthouse audit locally
- Contact: Frontend Dev Team
