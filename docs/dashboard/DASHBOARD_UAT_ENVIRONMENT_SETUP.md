# UAT Environment Setup - Checklist & Procedures

**Date**: 2025-11-12  
**Task**: TASK-4.2.2 - UAT Execution & Feedback  
**Environment**: Test/Staging  
**Status**: 🚧 In Progress

## Setup Checklist

### Phase 1: Infrastructure Setup ✅

- [x] **Test Environment Available**
  - Environment: Test/Staging
  - URL: `http://localhost:3888` (API) / `http://localhost:5173` (Web)
  - Status: Running in development mode

- [ ] **Database Configured**
  - Database: PostgreSQL (test database)
  - Connection: Verified
  - Migrations: Applied
  - Status: ⏳ Pending verification

- [ ] **Redis Configured**
  - Redis: Running for cache
  - Connection: Verified
  - Cache: Cleared for fresh start
  - Status: ⏳ Pending verification

- [ ] **Services Running**
  - API Server: Running on port 3888
  - Web App: Running on port 5173
  - Background workers: Running (if applicable)
  - Status: ⏳ Pending verification

### Phase 2: Test User Creation ✅

- [x] **Seeding Script Created**
  - File: `apps/api/src/scripts/seed-uat-users.ts`
  - Features:
    - Create 4 test users
    - Seed data for each profile
    - Clean existing data option
    - Statistics generation
  - Status: ✅ Complete

- [ ] **Test Users Created**
  - [ ] test_user_1 (Heavy User) - 100+ tasks, 20+ goals
  - [ ] test_user_2 (Moderate User) - 20 tasks, 5 goals
  - [ ] test_user_3 (New User) - 5 tasks, 2 goals
  - [ ] test_user_4 (Minimal User) - 0 tasks, 0 goals
  - Status: ⏳ Pending execution

- [ ] **Credentials Documented**
  - Username/Email/Password list created
  - Shared with test participants
  - Status: ⏳ Pending

### Phase 3: Data Verification

- [ ] **Test User Authentication**
  - [ ] test_user_1 can log in
  - [ ] test_user_2 can log in
  - [ ] test_user_3 can log in
  - [ ] test_user_4 can log in
  - Status: ⏳ Pending

- [ ] **Data Seeded Correctly**
  - [ ] test_user_1: 100 tasks, 20 goals, 40 reminders, 40 schedules
  - [ ] test_user_2: 20 tasks, 5 goals, 13 reminders, 15 schedules
  - [ ] test_user_3: 5 tasks, 2 goals, 5 reminders, 6 schedules
  - [ ] test_user_4: Empty state (all zeros)
  - Status: ⏳ Pending

- [ ] **Statistics Generated**
  - [ ] TaskStatistics for all users
  - [ ] GoalStatistics for all users
  - [ ] ReminderStatistics for all users
  - [ ] ScheduleStatistics for all users
  - Status: ⏳ Pending

- [ ] **Dashboard Accessible**
  - [ ] Dashboard page loads for all users
  - [ ] All 4 widgets render
  - [ ] Data displays correctly
  - Status: ⏳ Pending

### Phase 4: Test Environment Validation

- [ ] **Cross-Browser Setup**
  - [ ] Chrome installed and updated
  - [ ] Firefox installed and updated
  - [ ] Safari available (macOS)
  - [ ] Edge installed and updated
  - Status: ⏳ Pending

- [ ] **Device Testing Setup**
  - [ ] Desktop browser (1920x1080)
  - [ ] Browser DevTools for mobile emulation
  - [ ] Physical mobile device (optional)
  - [ ] Tablet device or emulation (768x1024)
  - Status: ⏳ Pending

- [ ] **Testing Tools Ready**
  - [ ] Browser DevTools (Performance, Network tabs)
  - [ ] Screen reader software (NVDA, JAWS, or VoiceOver)
  - [ ] Color contrast checker
  - [ ] Network throttling configured
  - Status: ⏳ Pending

### Phase 5: Documentation & Participants

- [ ] **UAT Test Cases Ready**
  - File: `docs/dashboard/DASHBOARD_UAT_TEST_CASES.md`
  - Status: ✅ Complete

- [ ] **Test Participants Confirmed**
  - [ ] Product Owner: Available for sessions
  - [ ] QA Engineer: Ready to coordinate
  - [ ] UX Designer: Available for evaluation
  - [ ] Tech Lead: On standby for support
  - [ ] 3-5 End Users: Scheduled
  - Status: ⏳ Pending scheduling

- [ ] **Test Session Scheduled**
  - [ ] Session 1: 2025-11-14, 2 hours
  - [ ] Session 2: 2025-11-15, 2 hours
  - [ ] Meeting invites sent
  - [ ] Zoom/Teams link ready
  - Status: ⏳ Pending

---

## Setup Procedures

### Procedure 1: Start Development Environment

```bash
# Terminal 1: Start API server
cd /workspaces/DailyUse
pnpm dev:api

# Terminal 2: Start Web app
cd /workspaces/DailyUse
pnpm dev:web

# Verify services are running
curl http://localhost:3888/health
curl http://localhost:5173/
```

**Expected Result**:

- API returns health check response
- Web app loads in browser

### Procedure 2: Verify Database Connection

```bash
cd /workspaces/DailyUse/apps/api

# Check database connection
pnpm prisma db pull

# Verify migrations are applied
pnpm prisma migrate status
```

**Expected Result**:

- Database schema synced
- All migrations applied

### Procedure 3: Seed UAT Test Users

```bash
cd /workspaces/DailyUse/apps/api

# Clean existing test users (if any) and seed new data
tsx src/scripts/seed-uat-users.ts --clean

# Or seed without cleaning
tsx src/scripts/seed-uat-users.ts
```

**Expected Output**:

```
🚀 UAT User Data Seeding Script
==========================================

🧹 Cleaning existing test users...
  ✓ Cleaned test_user_1 (test1@example.com)
  ✓ Cleaned test_user_2 (test2@example.com)
  ✓ Cleaned test_user_3 (test3@example.com)
  ✓ Cleaned test_user_4 (test4@example.com)
✅ Cleanup complete

📝 Creating test users...

👤 Creating test_user_1 (Heavy User)...
  ✓ User created: test1@example.com
  📊 Seeding heavy user data...
    ✓ Created 100 tasks (50 TODO, 30 IN_PROGRESS, 20 COMPLETED)
    ✓ Created 20 goals (8 IN_PROGRESS, 10 COMPLETED, 2 ARCHIVED)
    ✓ Created 40 reminders (15 today, 25 unread)
    ✓ Created 40 schedule records (10 today, 30 this week)
    ✓ Created statistics records

[... similar output for other users ...]

==========================================
✅ UAT user seeding complete!

Test User Credentials:
┌────────────────┬──────────────────────┬──────────────┐
│ Username       │ Email                │ Password     │
├────────────────┼──────────────────────┼──────────────┤
│ test_user_1    │ test1@example.com    │ Test123!@#   │
│ test_user_2    │ test2@example.com    │ Test123!@#   │
│ test_user_3    │ test3@example.com    │ Test123!@#   │
│ test_user_4    │ test4@example.com    │ Test123!@#   │
└────────────────┴──────────────────────┴──────────────┘

Summary:
  • test_user_1: 100 tasks, 20 goals, 40 reminders, 40 schedules
  • test_user_2: 20 tasks, 5 goals, 13 reminders, 15 schedules
  • test_user_3: 5 tasks, 2 goals, 5 reminders, 6 schedules
  • test_user_4: 0 tasks, 0 goals, 0 reminders, 0 schedules
```

### Procedure 4: Verify Test Users

```bash
# Login as each test user to verify authentication
# Use Postman, curl, or browser

# Example with curl:
curl -X POST http://localhost:3888/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test1@example.com","password":"Test123!@#"}'

# Should return JWT token
```

**Expected Result**:

- Successful login for all 4 users
- JWT token returned

### Procedure 5: Verify Dashboard Data

```bash
# Get auth token for test_user_2
TOKEN=$(curl -X POST http://localhost:3888/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","password":"Test123!@#"}' \
  | jq -r '.token')

# Fetch dashboard statistics
curl http://localhost:3888/api/dashboard/statistics \
  -H "Authorization: Bearer $TOKEN" \
  | jq .

# Expected output:
# {
#   "taskStatistics": {
#     "totalCount": 20,
#     "todoCount": 10,
#     "inProgressCount": 5,
#     "completedCount": 5,
#     "completionRate": 0.25
#   },
#   "goalStatistics": {
#     "totalCount": 5,
#     "activeCount": 3,
#     "completedCount": 2,
#     "archivedCount": 0,
#     "completionRate": 0.40
#   },
#   "reminderStatistics": {
#     "totalCount": 13,
#     "todayCount": 5,
#     "unreadCount": 8
#   },
#   "scheduleStatistics": {
#     "totalCount": 15,
#     "todayCount": 3,
#     "thisWeekCount": 12
#   }
# }
```

### Procedure 6: Clear Redis Cache (Fresh Start)

```bash
# Connect to Redis and flush cache
redis-cli

# In Redis CLI:
FLUSHDB
# Or flush specific keys:
KEYS dashboard:statistics:*
DEL dashboard:statistics:uat-user-1
DEL dashboard:statistics:uat-user-2
DEL dashboard:statistics:uat-user-3
DEL dashboard:statistics:uat-user-4
```

### Procedure 7: Test Dashboard in Browser

1. Open browser and navigate to `http://localhost:5173`
2. Log in with `test2@example.com` / `Test123!@#`
3. Navigate to Dashboard page
4. Verify:
   - Page loads within 2.5 seconds
   - All 4 widgets visible
   - TaskStats shows: 10 TODO, 5 IN_PROGRESS, 5 COMPLETED
   - GoalStats shows: 3 IN_PROGRESS, 2 COMPLETED
   - ReminderStats shows: 5 Today, 8 Unread
   - ScheduleStats shows: 3 Today, 12 This Week
5. Open Settings Panel and verify configuration options

---

## Test Credentials

### Production Test Users

| Username    | Email             | Password   | Profile       | Data Volume                                     |
| ----------- | ----------------- | ---------- | ------------- | ----------------------------------------------- |
| test_user_1 | test1@example.com | Test123!@# | Heavy User    | 100 tasks, 20 goals, 40 reminders, 40 schedules |
| test_user_2 | test2@example.com | Test123!@# | Moderate User | 20 tasks, 5 goals, 13 reminders, 15 schedules   |
| test_user_3 | test3@example.com | Test123!@# | New User      | 5 tasks, 2 goals, 5 reminders, 6 schedules      |
| test_user_4 | test4@example.com | Test123!@# | Minimal User  | 0 tasks, 0 goals, 0 reminders, 0 schedules      |

**⚠️ Security Note**: Change these passwords before production deployment!

---

## Environment Variables

Ensure the following environment variables are set:

```bash
# .env file (apps/api/.env)
DATABASE_URL="postgresql://user:password@localhost:5432/dailyuse_test"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-test-jwt-secret"
NODE_ENV="development"

# .env file (apps/web/.env)
VITE_API_BASE_URL="http://localhost:3888"
VITE_ENV="development"
```

---

## Troubleshooting

### Issue 1: Seeding Script Fails

**Symptom**: Script throws database connection error

**Solution**:

```bash
# Check database is running
docker ps | grep postgres

# Verify connection string
cat apps/api/.env | grep DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Issue 2: Test Users Already Exist

**Symptom**: Script fails with "unique constraint violation"

**Solution**:

```bash
# Run with --clean flag to delete existing users
tsx src/scripts/seed-uat-users.ts --clean
```

### Issue 3: Statistics Not Generated

**Symptom**: Dashboard shows empty data despite seeded tasks/goals

**Solution**:

```bash
# Manually trigger statistics recalculation
# (Add endpoint or run via Prisma Studio)
curl -X POST http://localhost:3888/api/dashboard/statistics/invalidate \
  -H "Authorization: Bearer $TOKEN"
```

### Issue 4: Redis Connection Failed

**Symptom**: Cache errors in API logs

**Solution**:

```bash
# Start Redis if not running
docker start redis
# Or
redis-server

# Verify connection
redis-cli ping
# Should return: PONG
```

---

## Pre-UAT Session Checklist

Before each UAT session, verify:

- [ ] All services running (API, Web, Redis, Database)
- [ ] Test users can log in
- [ ] Dashboard loads for all test users
- [ ] Data is accurate (cross-check with seeded values)
- [ ] Cache is working (check cache hit rate)
- [ ] Network is stable
- [ ] Testing tools are ready
- [ ] Screen sharing setup for remote participants
- [ ] Recording software ready (if recording sessions)
- [ ] Test case document printed or accessible

---

## Post-Setup Validation

Run these quick checks to ensure environment is ready:

```bash
# Quick validation script
echo "=== UAT Environment Validation ==="

# 1. Check services
echo "1. Services:"
curl -s http://localhost:3888/health && echo "  ✓ API is running" || echo "  ✗ API is down"
curl -s http://localhost:5173/ > /dev/null && echo "  ✓ Web app is running" || echo "  ✗ Web app is down"

# 2. Check Redis
redis-cli ping > /dev/null && echo "  ✓ Redis is running" || echo "  ✗ Redis is down"

# 3. Check test users (requires jq)
for user in test1@example.com test2@example.com test3@example.com test4@example.com; do
  TOKEN=$(curl -s -X POST http://localhost:3888/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$user\",\"password\":\"Test123!@#\"}" \
    | jq -r '.token')

  if [ "$TOKEN" != "null" ] && [ ! -z "$TOKEN" ]; then
    echo "  ✓ $user can log in"
  else
    echo "  ✗ $user login failed"
  fi
done

echo "=== Validation Complete ==="
```

---

## Next Steps

After environment setup is complete:

1. **Schedule UAT Sessions**
   - Send calendar invites to participants
   - Include Zoom/Teams link
   - Attach test case document
   - Provide test user credentials (securely)

2. **Prepare UAT Execution**
   - Review test cases with QA team
   - Set up screen recording
   - Prepare feedback forms
   - Create issue tracking sheet

3. **Execute UAT Session 1** (2025-11-14)
   - Test Scenarios 1-3
   - Collect feedback
   - Document issues

4. **Execute UAT Session 2** (2025-11-15)
   - Test Scenarios 4-6
   - Collect feedback
   - Prioritize bugs

---

**Setup Status**: 🚧 In Progress  
**Last Updated**: 2025-11-12  
**Next Action**: Run seed script and verify test users
