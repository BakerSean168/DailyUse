# Dashboard Module - Quick Reference

**Module:** Dashboard Statistics Aggregation  
**Status:** ✅ Sprint 1 - 60% Complete (15/25 SP)  
**Architecture:** DDD (Application/Infrastructure/Interface)  
**Last Updated:** 2025-01-XX

---

## 🚀 Quick Start

### **Start API Server**

```bash
cd /workspaces/DailyUse
pnpm install
npx nx run api:serve
```

### **Test Endpoints**

```bash
# Get statistics (requires auth token)
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/dashboard/statistics

# Invalidate cache
curl -X POST \
  -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/dashboard/statistics/invalidate

# Get cache stats (admin)
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/dashboard/cache/stats
```

---

## 📁 File Locations

### **Core Files**

```
apps/api/src/modules/dashboard/
├── application/services/
│   ├── DashboardStatisticsApplicationService.ts  → Main business logic
│   └── DashboardEventListener.ts                 → Cache invalidation
├── infrastructure/
│   ├── di/DashboardContainer.ts                  → Dependency injection
│   └── services/StatisticsCacheService.ts        → Redis cache
├── interface/
│   ├── controllers/DashboardStatisticsController.ts
│   └── routes.ts                                 → Route definitions
└── initialization/
    └── dashboardInitialization.ts                → Module init
```

### **Integration Points**

```
apps/api/src/
├── app.ts                              → Dashboard router registration
└── shared/initialization/initializer.ts → Event listener registration
```

---

## 🔑 Key Methods

### **DashboardStatisticsApplicationService**

```typescript
// Get dashboard statistics (cache-first)
getDashboardStatistics(accountUuid: string): Promise<DashboardStatisticsClientDTO>

// Manually invalidate cache
invalidateCache(accountUuid: string): Promise<void>

// Internal: Aggregate from all modules
private aggregateStatistics(accountUuid: string): Promise<DashboardStatisticsClientDTO>
```

### **StatisticsCacheService**

```typescript
// Cache operations
get(userId: string): Promise<DashboardStatisticsClientDTO | null>
set(userId: string, data: DashboardStatisticsClientDTO): Promise<void>
invalidate(userId: string): Promise<void>
invalidatePattern(pattern: string): Promise<void>

// Monitoring
getTtl(userId: string): Promise<number>
ping(): Promise<'PONG'>
getStats(): Promise<{ used_memory: string, ... }>
```

### **DashboardEventListener**

```typescript
// Initialize event listeners (called at app startup)
static initialize(): Promise<void>

// Check if initialized
static isReady(): boolean

// Reset for testing
static reset(): void
```

---

## 🎯 API Endpoints

| Method | Path                                   | Auth     | Description                       |
| ------ | -------------------------------------- | -------- | --------------------------------- |
| GET    | `/api/dashboard/statistics`            | Required | Get dashboard statistics (cached) |
| POST   | `/api/dashboard/statistics/invalidate` | Required | Manually invalidate cache         |
| GET    | `/api/dashboard/cache/stats`           | Required | Get cache memory stats (admin)    |

### **Response Format**

```typescript
{
  task: {
    totalTaskTemplates: number,
    completionRate: number,
    ...
  },
  goal: {
    totalGoals: number,
    completionRate: number,
    ...
  },
  reminder: {
    totalReminders: number,
    completionRate: number,
    ...
  },
  schedule: {
    totalTasks: number,
    completionRate: number,
    ...
  },
  overall: {
    completionRate: number  // Weighted average
  }
}
```

---

## 🔄 Event-Driven Cache Invalidation

### **Monitored Events**

```typescript
'task.statistics.updated'             → Task incremental update
'task.statistics.recalculated'        → Task full recalculation
'goal_statistics.recalculated'        → Goal recalculation
'ReminderStatisticsUpdated'           → Reminder update
'ScheduleStatisticsExecutionRecorded' → Schedule execution
```

### **Invalidation Flow**

```
[Source Module] → [Publish Domain Event] → [DashboardEventListener]
                → [Extract accountUuid] → [Cache.invalidate(accountUuid)]
```

---

## 🧪 Testing

### **Run Unit Tests**

```bash
# Test ApplicationService
npx nx test api --testFile=DashboardStatisticsApplicationService.spec.ts

# Test CacheService
npx nx test api --testFile=StatisticsCacheService.spec.ts

# All Dashboard tests
npx nx test api --testPathPattern=dashboard
```

### **Run E2E Tests**

```bash
# All Dashboard E2E tests
npx nx test:e2e api --testPathPattern=dashboard

# Specific endpoint
npx nx test:e2e api --testFile=dashboard-statistics.e2e.spec.ts
```

### **Manual Testing**

```bash
# 1. Start Redis (if not running)
docker run -d -p 6379:6379 redis:7-alpine

# 2. Start API
npx nx run api:serve

# 3. Get auth token
export TOKEN=$(curl -X POST http://localhost:3000/api/authentication/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.token')

# 4. Test dashboard endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/dashboard/statistics | jq
```

---

## 🐛 Troubleshooting

### **Issue: "Cannot find module DashboardEventListener"**

**Solution:** TypeScript cache issue, run `npx nx reset` then rebuild.

### **Issue: "Redis connection refused"**

**Solution:** Start Redis: `docker run -d -p 6379:6379 redis:7-alpine`

### **Issue: "401 Unauthorized"**

**Solution:** Ensure JWT token is valid and included in Authorization header.

### **Issue: "Cache not invalidating"**

**Solution:** Check event listener initialization logs: `✓ Dashboard event listeners initialized`

### **Issue: "Build fails with module resolution error"**

**Solution:**

1. Check tsconfig paths
2. Run `pnpm install`
3. Run `npx nx reset`
4. Rebuild: `npx nx run api:build`

---

## 📊 Performance

### **Cache Behavior**

- **Hit Rate (Expected):** 80-90% in production
- **Cache TTL:** 5 minutes (300 seconds)
- **Response Time (Cached):** 1-5ms
- **Response Time (Miss):** 50-100ms (4 parallel queries)

### **Memory Usage**

- **Cache Key Size:** ~50 bytes per user
- **Value Size:** ~2-5 KB per user
- **Expected Cache Size (1000 users):** ~5-10 MB

### **Redis Configuration**

```bash
# In .env or docker-compose.yml
REDIS_URL=redis://localhost:6379
REDIS_MAX_RETRIES=3
REDIS_RETRY_DELAY_MS=50
```

---

## 🔧 Configuration

### **Environment Variables**

```bash
# Redis
REDIS_URL=redis://localhost:6379

# Cache TTL (optional, defaults to 300)
DASHBOARD_CACHE_TTL=300

# Authentication
JWT_SECRET=your-secret-key
```

### **Module Container**

```typescript
// Get container instance
const container = DashboardContainer.getInstance();

// Get services
const appService = container.getDashboardStatisticsApplicationService();
const cacheService = container.getCacheService();

// Test injection
container.setCacheService(mockCacheService);
```

---

## 📈 Monitoring

### **Key Metrics to Track**

```typescript
// Cache performance
const cacheHitRate = cacheHits / totalRequests;
const avgResponseTime = sum(responseTimes) / count;

// Cache stats endpoint
GET /api/dashboard/cache/stats
→ { used_memory, used_memory_human, connected_clients }

// Invalidation frequency
console.log('🗑️ Cache invalidated for account: ${accountUuid}');
```

### **Logs to Watch**

```bash
# Initialization
✓ Dashboard event listeners initialized

# Cache operations
📊 [DashboardEventListener] Task statistics updated for account: xxx
🗑️ [DashboardEventListener] Cache invalidated for account: xxx

# Errors
❌ [DashboardEventListener] Missing accountUuid in event
❌ [StatisticsCacheService] Redis connection error
```

---

## ✅ Completion Checklist

### **Development (60% Complete)**

- [x] DashboardStatisticsApplicationService
- [x] StatisticsCacheService (Redis)
- [x] Cache integration
- [x] API routes + controllers
- [x] Event-driven cache invalidation
- [x] DI container
- [ ] Unit tests (≥90% coverage)
- [ ] E2E tests
- [ ] API documentation (Swagger)

### **Deployment**

- [ ] Redis deployment configured
- [ ] Environment variables set
- [ ] Load testing completed
- [ ] Monitoring/alerting setup
- [ ] Production deployment

---

## 📚 Documentation

### **Implementation Docs**

- [DASHBOARD_SPRINT1_SESSION_SUMMARY.md](./DASHBOARD_SPRINT1_SESSION_SUMMARY.md) - Complete session summary
- [DASHBOARD_EVENT_INVALIDATION_IMPLEMENTATION.md](./DASHBOARD_EVENT_INVALIDATION_IMPLEMENTATION.md) - Event system details

### **Architecture References**

- Goal Module: `apps/api/src/modules/goal/` - Reference implementation
- Event System: `docs/EVENT_NAMING_CONVENTIONS.md`
- DDD Patterns: `docs/packages-domain-client.md`

### **Related Modules**

- Task Module: `apps/api/src/modules/task/`
- Goal Module: `apps/api/src/modules/goal/`
- Reminder Module: `apps/api/src/modules/reminder/`
- Schedule Module: `apps/api/src/modules/schedule/`

---

## 🎯 Next Steps

1. **Unit Tests** (TASK-1.1.3, 2 SP)
   - Test ApplicationService (getDashboardStatistics, aggregateStatistics)
   - Test CacheService (get, set, invalidate)
   - Achieve ≥90% coverage

2. **API Documentation** (TASK-1.3.2, 1 SP)
   - Write Swagger/OpenAPI specs
   - Document request/response formats
   - Add error code documentation

3. **E2E Tests** (TASK-1.3.3, 2 SP)
   - Test authenticated endpoints
   - Test event-driven invalidation
   - Validate performance (≤100ms cached)

---

**Quick Reference Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Status:** Sprint 1 - 60% Complete
