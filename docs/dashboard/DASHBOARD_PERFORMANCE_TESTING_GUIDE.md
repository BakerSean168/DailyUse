# Dashboard API Performance Testing Guide

## Overview

This guide covers performance testing for the Dashboard API, including benchmarks, load tests, and requirements verification.

## Performance Requirements

### Dashboard Statistics API

- **Cache Hit**: Response time ≤ 100ms
- **Cache Miss**: Response time ≤ 500ms
- **Concurrent Load**: 100 users, success rate ≥ 99%
- **Cache Hit Rate**: ≥ 95%

### Widget Config API

- **GET/PUT/POST**: Response time ≤ 200ms
- **Concurrent Updates**: 50 users, success rate ≥ 95%

## Test Files

### 1. Performance Test Suite

**Location**: `apps/api/src/modules/dashboard/__tests__/performance/dashboard-api.performance.spec.ts`

**Test Categories**:

- Dashboard Statistics API Performance (8 tests)
- Cache Performance (3 tests)
- Widget Config API Performance (4 tests)
- Performance Under Load (2 tests)
- Performance Regression Detection (1 test)

**Total**: 18 comprehensive performance tests

### 2. Load Testing Script

**Location**: `apps/api/src/scripts/performance-test.ts`

**Features**:

- Configurable concurrent requests
- Duration-based load testing
- Real-time progress indicator
- Detailed performance metrics (P50, P95, P99)
- Automatic requirement validation
- Error tracking and reporting

## Running Tests

### Method 1: Automated Test Suite

```bash
# Run all performance tests
cd apps/api
pnpm test dashboard-api.performance.spec.ts

# Run with coverage
pnpm test:coverage dashboard-api.performance.spec.ts

# Run in watch mode
pnpm test:watch dashboard-api.performance.spec.ts
```

### Method 2: Load Testing Script

#### Step 1: Get Auth Token

```bash
# Login and get token
curl -X POST http://localhost:3888/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Extract token from response
export AUTH_TOKEN="<token_from_response>"
```

#### Step 2: Run Load Test

```bash
cd apps/api

# Default test (100 concurrent, 60 seconds)
tsx src/scripts/performance-test.ts --token=$AUTH_TOKEN

# Custom configuration
tsx src/scripts/performance-test.ts \
  --token=$AUTH_TOKEN \
  --url=http://localhost:3888 \
  --concurrent=50 \
  --duration=30 \
  --endpoint=/api/dashboard/statistics

# Test widget config API
tsx src/scripts/performance-test.ts \
  --token=$AUTH_TOKEN \
  --endpoint=/api/dashboard/widget-config \
  --concurrent=25 \
  --duration=30
```

### Method 3: Manual Testing with curl

#### Dashboard Statistics API

```bash
# Single request with timing
time curl -X GET http://localhost:3888/api/dashboard/statistics \
  -H "Authorization: Bearer $AUTH_TOKEN"

# Multiple requests (cache hit test)
for i in {1..10}; do
  time curl -s http://localhost:3888/api/dashboard/statistics \
    -H "Authorization: Bearer $AUTH_TOKEN" > /dev/null
done

# Concurrent requests using GNU parallel
seq 100 | parallel -j 100 "curl -s http://localhost:3888/api/dashboard/statistics \
  -H 'Authorization: Bearer $AUTH_TOKEN' > /dev/null"
```

#### Cache Invalidation

```bash
# Invalidate cache
curl -X POST http://localhost:3888/api/dashboard/statistics/invalidate \
  -H "Authorization: Bearer $AUTH_TOKEN"

# Check cache stats
curl -X GET http://localhost:3888/api/dashboard/cache/stats \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

#### Widget Config API

```bash
# GET widget config
time curl -X GET http://localhost:3888/api/dashboard/widget-config \
  -H "Authorization: Bearer $AUTH_TOKEN"

# PUT widget config
time curl -X PUT http://localhost:3888/api/dashboard/widget-config \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "widgets": {
      "task-stats": {"visible": true, "size": "medium", "order": 1}
    }
  }'

# POST reset config
time curl -X POST http://localhost:3888/api/dashboard/widget-config/reset \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

## Performance Metrics Explained

### Response Time Metrics

- **Average**: Mean response time across all requests
- **P50 (Median)**: 50% of requests faster than this value
- **P95**: 95% of requests faster than this value (most important for SLA)
- **P99**: 99% of requests faster than this value
- **Max**: Slowest request

### Interpreting Results

#### ✅ PASS Criteria

```
Dashboard Statistics API:
- Average ≤ 100ms (cache hit)
- P95 ≤ 500ms (cache miss acceptable)
- Success Rate ≥ 99%

Widget Config API:
- Average ≤ 200ms
- P95 ≤ 300ms
- Success Rate ≥ 95%
```

#### ⚠️ WARNING Indicators

- P95 > 500ms: Cache not working efficiently
- Success Rate < 99%: Server errors under load
- P99 >> P95: Inconsistent performance (investigate outliers)

#### ❌ FAIL Criteria

- Average > 200ms (cache hit): Database queries too slow
- Success Rate < 95%: Critical server issues
- Any 5xx errors: Backend bugs under load

## Troubleshooting Performance Issues

### Issue: High Response Times (> 500ms)

**Diagnosis**:

```bash
# Check cache status
curl http://localhost:3888/api/dashboard/cache/stats \
  -H "Authorization: Bearer $AUTH_TOKEN"

# Check if Redis is running
docker ps | grep redis

# Check API logs for slow queries
tail -f apps/api/logs/api.log | grep "PERF"
```

**Possible Causes**:

1. Redis cache not working → Check Redis connection
2. Database queries slow → Add indexes, optimize queries
3. Network latency → Check database connection pool
4. Memory issues → Monitor server resources

**Solutions**:

```bash
# Restart Redis
docker restart dailyuse-redis

# Clear cache and re-test
curl -X POST http://localhost:3888/api/dashboard/statistics/invalidate \
  -H "Authorization: Bearer $AUTH_TOKEN"

# Check database query performance
# (Add EXPLAIN ANALYZE to Prisma queries in logs)
```

### Issue: Low Cache Hit Rate (< 95%)

**Diagnosis**:

```bash
# Check cache stats
curl http://localhost:3888/api/dashboard/cache/stats \
  -H "Authorization: Bearer $AUTH_TOKEN"

# Check cache invalidation events in logs
tail -f apps/api/logs/api.log | grep "Cache invalidated"
```

**Possible Causes**:

1. TTL too short (< 5 minutes)
2. Too many statistics updates (cache invalidated too often)
3. Cache keys not unique per user

**Solutions**:

- Increase TTL in `StatisticsCacheService` (currently 300s)
- Batch statistics updates to reduce invalidations
- Verify cache keys include `accountUuid`

### Issue: Failed Requests (< 99% success rate)

**Diagnosis**:

```bash
# Check error logs
tail -f apps/api/logs/api.log | grep "ERROR"

# Check HTTP error codes
curl -v http://localhost:3888/api/dashboard/statistics \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Possible Causes**:

1. Database connection pool exhausted
2. Memory leak under load
3. Unhandled exceptions in aggregation logic

**Solutions**:

- Increase database connection pool size in Prisma
- Profile memory usage during load test
- Add error handling to all Statistics queries

## Performance Monitoring in Production

### Key Metrics to Track

1. **Response Time Distribution**
   - P50, P95, P99 percentiles
   - Track trends over time

2. **Cache Performance**
   - Hit rate (should stay > 95%)
   - Invalidation frequency

3. **Error Rate**
   - 5xx errors (server issues)
   - 4xx errors (client issues)

4. **Resource Usage**
   - Database connection pool utilization
   - Redis memory usage
   - API server CPU/memory

### Monitoring Setup

```bash
# Add performance middleware metrics endpoint
GET /api/metrics

# Response format:
{
  "dashboard_statistics": {
    "count": 1000,
    "avg": 45,
    "p50": 38,
    "p95": 89,
    "p99": 156,
    "max": 234
  },
  "cache": {
    "hits": 950,
    "misses": 50,
    "hitRate": 95.0
  }
}
```

## Continuous Performance Testing

### CI/CD Integration

Add to `.github/workflows/performance-test.yml`:

```yaml
name: Performance Tests

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *' # Daily at midnight

jobs:
  performance-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2

      - name: Start services
        run: docker-compose up -d

      - name: Run performance tests
        run: |
          cd apps/api
          pnpm test dashboard-api.performance.spec.ts

      - name: Run load test
        run: |
          export AUTH_TOKEN=$(curl -X POST http://localhost:3888/api/auth/login \
            -H "Content-Type: application/json" \
            -d '{"email":"test@example.com","password":"password123"}' \
            | jq -r '.token')

          cd apps/api
          tsx src/scripts/performance-test.ts \
            --token=$AUTH_TOKEN \
            --concurrent=50 \
            --duration=30

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: apps/api/performance-report.json
```

## Performance Testing Checklist

Before deploying to production:

- [ ] All performance tests pass (18/18)
- [ ] Load test with 100 concurrent users: ≥ 99% success rate
- [ ] Dashboard API average response time: ≤ 100ms (cache hit)
- [ ] Dashboard API P95 response time: ≤ 500ms (cache miss)
- [ ] Widget Config API average response time: ≤ 200ms
- [ ] Cache hit rate: ≥ 95%
- [ ] Zero 5xx errors under sustained load (200 requests)
- [ ] Performance monitoring dashboard configured
- [ ] Alerts set up for performance degradation

## Next Steps

After completing API performance testing:

1. **Frontend Performance Testing** (TASK-4.1.2)
   - First Contentful Paint ≤ 1.0s
   - Largest Contentful Paint ≤ 2.0s
   - Time to Interactive ≤ 2.5s
   - Lighthouse Score ≥ 90

2. **User Acceptance Testing** (TASK-4.2)
   - Prepare UAT test cases
   - Execute with stakeholders
   - Document feedback

3. **Production Deployment** (TASK-4.3)
   - Deployment documentation
   - Monitoring setup
   - Feature flags configuration

## References

- [Performance Middleware](/apps/api/src/middleware/performance.middleware.ts)
- [Dashboard Statistics Service](/apps/api/src/modules/dashboard/application/services/DashboardStatisticsApplicationService.ts)
- [Cache Service](/apps/api/src/modules/dashboard/infrastructure/cache/StatisticsCacheService.ts)
- [E2E Tests](/apps/web/e2e/dashboard/)

## Support

For performance issues or questions:

- Check logs: `apps/api/logs/api.log`
- Review metrics: `GET /api/dashboard/cache/stats`
- Contact: Backend Dev Team
