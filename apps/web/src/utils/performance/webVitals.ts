/**
 * Core Web Vitals Monitoring
 *
 * Tracks and reports key performance metrics:
 * - FCP (First Contentful Paint): ≤ 1.0s
 * - LCP (Largest Contentful Paint): ≤ 2.0s
 * - FID (First Input Delay): ≤ 100ms
 * - CLS (Cumulative Layout Shift): ≤ 0.1
 * - TTI (Time to Interactive): ≤ 2.5s
 * - TTFB (Time to First Byte): ≤ 600ms
 */

import { createLogger } from '@dailyuse/utils';

const logger = createLogger('WebVitals');

export interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType?: string;
}

export interface PerformanceMetrics {
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
  tti?: number;
}

// Thresholds for rating metrics
const THRESHOLDS = {
  FCP: { good: 1000, needsImprovement: 1800 },
  LCP: { good: 2000, needsImprovement: 2500 },
  FID: { good: 100, needsImprovement: 300 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  TTFB: { good: 600, needsImprovement: 1500 },
  TTI: { good: 2500, needsImprovement: 3800 },
};

/**
 * Get rating based on metric value and thresholds
 */
function getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metricName as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Format metric value for display
 */
function formatValue(name: string, value: number): string {
  if (name === 'CLS') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}ms`;
}

/**
 * Observe First Contentful Paint (FCP)
 */
function observeFCP(callback: (metric: WebVitalsMetric) => void): void {
  if (typeof window === 'undefined') return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        const metric: WebVitalsMetric = {
          name: 'FCP',
          value: entry.startTime,
          rating: getRating('FCP', entry.startTime),
          delta: entry.startTime,
          id: `v1-${Date.now()}-${Math.random()}`,
          navigationType: (performance.getEntriesByType('navigation')[0] as any)?.type,
        };
        callback(metric);
        observer.disconnect();
      }
    }
  });

  try {
    observer.observe({ type: 'paint', buffered: true });
  } catch (error) {
    logger.warn('FCP observation failed:', error);
  }
}

/**
 * Observe Largest Contentful Paint (LCP)
 */
function observeLCP(callback: (metric: WebVitalsMetric) => void): void {
  if (typeof window === 'undefined') return;

  let lcpValue = 0;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as any;

    lcpValue = lastEntry.renderTime || lastEntry.loadTime;

    const metric: WebVitalsMetric = {
      name: 'LCP',
      value: lcpValue,
      rating: getRating('LCP', lcpValue),
      delta: lcpValue,
      id: `v1-${Date.now()}-${Math.random()}`,
      navigationType: (performance.getEntriesByType('navigation')[0] as any)?.type,
    };
    callback(metric);
  });

  try {
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (error) {
    logger.warn('LCP observation failed:', error);
  }

  // Stop observing after page is hidden
  const onHidden = () => {
    if (document.visibilityState === 'hidden') {
      observer.disconnect();
    }
  };
  document.addEventListener('visibilitychange', onHidden, { once: true });
}

/**
 * Observe First Input Delay (FID)
 */
function observeFID(callback: (metric: WebVitalsMetric) => void): void {
  if (typeof window === 'undefined') return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const fidEntry = entry as any;
      const fidValue = fidEntry.processingStart - fidEntry.startTime;

      const metric: WebVitalsMetric = {
        name: 'FID',
        value: fidValue,
        rating: getRating('FID', fidValue),
        delta: fidValue,
        id: `v1-${Date.now()}-${Math.random()}`,
        navigationType: (performance.getEntriesByType('navigation')[0] as any)?.type,
      };
      callback(metric);
      observer.disconnect();
    }
  });

  try {
    observer.observe({ type: 'first-input', buffered: true });
  } catch (error) {
    logger.warn('FID observation failed:', error);
  }
}

/**
 * Observe Cumulative Layout Shift (CLS)
 */
function observeCLS(callback: (metric: WebVitalsMetric) => void): void {
  if (typeof window === 'undefined') return;

  let clsValue = 0;
  let sessionValue = 0;
  let sessionEntries: any[] = [];

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const layoutShift = entry as any;

      // Only count layout shifts without recent user input
      if (!layoutShift.hadRecentInput) {
        const firstSessionEntry = sessionEntries[0];
        const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

        // If the entry occurred less than 1 second after the previous entry
        // and less than 5 seconds after the first entry in the session,
        // include the entry in the current session. Otherwise, start a new session.
        if (
          sessionValue &&
          layoutShift.startTime - lastSessionEntry.startTime < 1000 &&
          layoutShift.startTime - firstSessionEntry.startTime < 5000
        ) {
          sessionValue += layoutShift.value;
          sessionEntries.push(layoutShift);
        } else {
          sessionValue = layoutShift.value;
          sessionEntries = [layoutShift];
        }

        // Update CLS if current session value is larger
        if (sessionValue > clsValue) {
          clsValue = sessionValue;

          const metric: WebVitalsMetric = {
            name: 'CLS',
            value: clsValue,
            rating: getRating('CLS', clsValue),
            delta: clsValue,
            id: `v1-${Date.now()}-${Math.random()}`,
            navigationType: (performance.getEntriesByType('navigation')[0] as any)?.type,
          };
          callback(metric);
        }
      }
    }
  });

  try {
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (error) {
    logger.warn('CLS observation failed:', error);
  }

  // Report final CLS when page is hidden
  const onHidden = () => {
    if (document.visibilityState === 'hidden' && clsValue > 0) {
      const metric: WebVitalsMetric = {
        name: 'CLS',
        value: clsValue,
        rating: getRating('CLS', clsValue),
        delta: clsValue,
        id: `v1-${Date.now()}-${Math.random()}`,
        navigationType: (performance.getEntriesByType('navigation')[0] as any)?.type,
      };
      callback(metric);
      observer.disconnect();
    }
  };
  document.addEventListener('visibilitychange', onHidden, { once: true });
}

/**
 * Observe Time to First Byte (TTFB)
 */
function observeTTFB(callback: (metric: WebVitalsMetric) => void): void {
  if (typeof window === 'undefined') return;

  try {
    const navigationEntry = performance.getEntriesByType(
      'navigation',
    )[0] as PerformanceNavigationTiming;
    if (!navigationEntry) return;

    const ttfbValue = navigationEntry.responseStart - navigationEntry.requestStart;

    const metric: WebVitalsMetric = {
      name: 'TTFB',
      value: ttfbValue,
      rating: getRating('TTFB', ttfbValue),
      delta: ttfbValue,
      id: `v1-${Date.now()}-${Math.random()}`,
      navigationType: navigationEntry.type,
    };
    callback(metric);
  } catch (error) {
    logger.warn('TTFB observation failed:', error);
  }
}

/**
 * Estimate Time to Interactive (TTI)
 * Note: This is a simplified estimation. For accurate TTI, use Lighthouse.
 */
function observeTTI(callback: (metric: WebVitalsMetric) => void): void {
  if (typeof window === 'undefined') return;

  // Wait for page to be fully loaded
  window.addEventListener('load', () => {
    // Use a simple heuristic: wait for no long tasks for 5 seconds
    let ttiValue = performance.now();

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      // If there are long tasks, update TTI estimate
      if (entries.length > 0) {
        const lastEntry = entries[entries.length - 1];
        ttiValue = lastEntry.startTime + lastEntry.duration;
      }
    });

    try {
      observer.observe({ type: 'longtask', buffered: true });
    } catch (error) {
      // Long task API not supported
    }

    // Report TTI after 5 seconds of no long tasks
    setTimeout(() => {
      observer.disconnect();

      const metric: WebVitalsMetric = {
        name: 'TTI',
        value: ttiValue,
        rating: getRating('TTI', ttiValue),
        delta: ttiValue,
        id: `v1-${Date.now()}-${Math.random()}`,
        navigationType: (performance.getEntriesByType('navigation')[0] as any)?.type,
      };
      callback(metric);
    }, 5000);
  });
}

/**
 * Report metric to console and analytics
 */
function reportMetric(metric: WebVitalsMetric): void {
  const emoji =
    metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
  const message = `${emoji} ${metric.name}: ${formatValue(metric.name, metric.value)} (${metric.rating})`;

  logger.info(message);

  // Send to analytics (if available)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_rating: metric.rating,
      metric_delta: Math.round(metric.delta),
      metric_id: metric.id,
    });
  }

  // Store in sessionStorage for debugging
  try {
    const metrics = JSON.parse(sessionStorage.getItem('webVitals') || '{}');
    metrics[metric.name] = {
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
    };
    sessionStorage.setItem('webVitals', JSON.stringify(metrics));
  } catch (error) {
    // Ignore storage errors
  }
}

/**
 * Initialize Web Vitals monitoring
 */
export function initWebVitals(): void {
  if (typeof window === 'undefined') return;

  logger.info('Initializing Web Vitals monitoring...');

  observeFCP(reportMetric);
  observeLCP(reportMetric);
  observeFID(reportMetric);
  observeCLS(reportMetric);
  observeTTFB(reportMetric);
  observeTTI(reportMetric);
}

/**
 * Get current Web Vitals metrics from sessionStorage
 */
export function getWebVitalsMetrics(): PerformanceMetrics {
  if (typeof window === 'undefined') return {};

  try {
    const metrics = JSON.parse(sessionStorage.getItem('webVitals') || '{}');
    return {
      fcp: metrics.FCP?.value,
      lcp: metrics.LCP?.value,
      fid: metrics.FID?.value,
      cls: metrics.CLS?.value,
      ttfb: metrics.TTFB?.value,
      tti: metrics.TTI?.value,
    };
  } catch (error) {
    return {};
  }
}

/**
 * Clear Web Vitals metrics from sessionStorage
 */
export function clearWebVitalsMetrics(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem('webVitals');
  } catch (error) {
    // Ignore storage errors
  }
}

/**
 * Get performance summary with ratings
 */
export function getPerformanceSummary(): {
  metrics: PerformanceMetrics;
  ratings: Record<string, string>;
  overallRating: 'good' | 'needs-improvement' | 'poor';
} {
  const metrics = getWebVitalsMetrics();
  const ratings: Record<string, string> = {};

  let goodCount = 0;
  let poorCount = 0;
  let totalCount = 0;

  Object.entries(metrics).forEach(([name, value]) => {
    if (value !== undefined) {
      const rating = getRating(name.toUpperCase(), value);
      ratings[name] = rating;
      totalCount++;

      if (rating === 'good') goodCount++;
      if (rating === 'poor') poorCount++;
    }
  });

  // Overall rating: good if most metrics are good, poor if any are poor
  let overallRating: 'good' | 'needs-improvement' | 'poor' = 'good';
  if (poorCount > 0) overallRating = 'poor';
  else if (goodCount < totalCount * 0.7) overallRating = 'needs-improvement';

  return { metrics, ratings, overallRating };
}
