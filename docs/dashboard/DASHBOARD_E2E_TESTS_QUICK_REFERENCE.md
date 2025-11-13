# Dashboard E2E Tests - Quick Reference

## 🚀 Quick Start

### Prerequisites

```bash
# 1. Start Docker services (PostgreSQL, Redis)
docker-compose up -d

# 2. Install dependencies
pnpm install

# 3. Run database migrations
cd apps/api
pnpm db:migrate

# 4. Seed test data
pnpm test:seed

# 5. Start API server
cd apps/api
pnpm dev  # Runs on http://localhost:3888

# 6. Start Web server (in another terminal)
cd apps/web
pnpm dev  # Runs on http://localhost:5173
```

### Run Tests

```bash
# Navigate to web app
cd apps/web

# Run all Dashboard E2E tests
npx playwright test e2e/dashboard/

# Run with UI mode (recommended for development)
npx playwright test e2e/dashboard/ --ui

# Run in debug mode
npx playwright test e2e/dashboard/ --debug

# Run specific test file
npx playwright test e2e/dashboard/dashboard-widgets.spec.ts

# Run only critical tests (P0)
npx playwright test e2e/dashboard/ --grep "P0"

# Run in headed mode (see browser)
npx playwright test e2e/dashboard/ --headed

# Run with specific browser
npx playwright test e2e/dashboard/ --project=chromium
npx playwright test e2e/dashboard/ --project=firefox
npx playwright test e2e/dashboard/ --project=webkit
```

## 📁 Test Files

| File                                   | Tests  | Priority | Purpose                     |
| -------------------------------------- | ------ | -------- | --------------------------- |
| `dashboard-overview.spec.ts`           | 21     | P0-P2    | Page load, navigation, auth |
| `dashboard-widgets.spec.ts`            | 16     | P0-P2    | Widget rendering & config   |
| `dashboard-config-persistence.spec.ts` | 8      | P0-P2    | Config persistence & API    |
| **Total**                              | **37** | -        | Full Dashboard coverage     |

## 🎯 Test Categories

### P0 (Critical) - 15 tests

Must pass before deployment

```bash
npx playwright test e2e/dashboard/ --grep "P0"
```

**Covers**:

- Dashboard page loads
- Widgets render
- Settings panel opens
- Configuration saves
- Persistence works

### P1 (High) - 16 tests

Important functionality

```bash
npx playwright test e2e/dashboard/ --grep "P1"
```

**Covers**:

- Toggle widget visibility
- Adjust widget sizes
- Reset configuration
- Cancel changes
- Multi-session persistence

### P2 (Medium) - 6 tests

Nice to have

```bash
npx playwright test e2e/dashboard/ --grep "P2"
```

**Covers**:

- Loading states
- Empty states
- Error handling
- Keyboard navigation

## 🔍 Common Test Patterns

### Test Structure

```typescript
test('[P0] should do something', async ({ page }) => {
  // 1. Arrange - Set up test conditions
  await page.goto('/');
  const element = page.locator('[data-testid="element"]');

  // 2. Act - Perform action
  await element.click();

  // 3. Assert - Verify result
  await expect(element).toBeVisible();
});
```

### Finding Elements

```typescript
// By data-testid (preferred)
page.locator('[data-testid="task-stats-widget"]');

// By text content
page.locator('button:has-text("设置")');

// By CSS selector
page.locator('.widget-card');

// By role and name
page.getByRole('button', { name: '保存' });
```

### Waiting for Elements

```typescript
// Wait for element to be visible
await expect(element).toBeVisible({ timeout: 5000 });

// Wait for page load
await page.waitForLoadState('networkidle');

// Wait for specific timeout (use sparingly)
await page.waitForTimeout(1000);

// Wait for navigation
await page.waitForURL('/dashboard');

// Wait for API response
await page.waitForResponse((response) => response.url().includes('/api/dashboard'));
```

## 🐛 Debugging Tests

### View Test Trace

```bash
# Run tests with trace
npx playwright test e2e/dashboard/ --trace on

# Open trace viewer
npx playwright show-trace trace.zip
```

### Debug Specific Test

```bash
# Debug mode - step through test
npx playwright test e2e/dashboard/dashboard-widgets.spec.ts --debug

# Pause on specific line (in test code)
await page.pause();
```

### Screenshots on Failure

```bash
# Automatic screenshots saved to:
apps/web/test-results/
```

### View Test Report

```bash
# Generate and open HTML report
npx playwright show-report
```

## 📊 Test Results

### Expected Output

```
Running 37 tests using 1 worker

  ✓ [chromium] › dashboard-overview.spec.ts:19 (2s)
  ✓ [chromium] › dashboard-overview.spec.ts:38 (1s)
  ✓ [chromium] › dashboard-widgets.spec.ts:30 (3s)
  ...

  37 passed (1.5m)
```

### Exit Codes

- `0` - All tests passed ✅
- `1` - Some tests failed ❌

## 🔧 Troubleshooting

### Test Fails: "page.goto: Navigation timeout"

**Problem**: API or Web server not running

**Solution**:

```bash
# Check servers are running
curl http://localhost:3888/health  # API
curl http://localhost:5173         # Web

# Restart servers if needed
cd apps/api && pnpm dev
cd apps/web && pnpm dev
```

### Test Fails: "Login failed"

**Problem**: Test user doesn't exist

**Solution**:

```bash
# Re-seed database
cd apps/api
pnpm test:seed

# Verify test user exists
# Username: testuser
# Password: Test123456!
```

### Test Fails: "Element not visible"

**Problem**: Timing issue or element selector wrong

**Solution**:

```typescript
// Add explicit wait
await page.waitForTimeout(1000);

// Or wait for element
await element.waitFor({ state: 'visible', timeout: 5000 });

// Check selector is correct
const count = await page.locator('[data-testid="element"]').count();
console.log('Element count:', count);
```

### Test Flaky: Passes sometimes

**Problem**: Race condition or network timing

**Solution**:

```typescript
// Use waitForLoadState
await page.waitForLoadState('networkidle');

// Increase timeout
await expect(element).toBeVisible({ timeout: 10000 });

// Use retry logic (in playwright.config.ts)
retries: 2;
```

## 📝 Writing New Tests

### Template

```typescript
/**
 * New Dashboard Feature E2E Test
 */
import { test, expect } from '@playwright/test';
import { login, TEST_USER } from '../helpers/testHelpers';
import { WEB_CONFIG, TIMEOUT_CONFIG } from '../config';

test.describe('New Feature', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USER.username, TEST_USER.password);
    await page.goto(WEB_CONFIG.HOME_PATH, {
      waitUntil: 'networkidle',
      timeout: TIMEOUT_CONFIG.NAVIGATION,
    });
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);
  });

  test('[P0] should do something critical', async ({ page }) => {
    // Your test here
  });

  test('[P1] should do something important', async ({ page }) => {
    // Your test here
  });
});
```

### Best Practices

1. **Use data-testid attributes**

   ```typescript
   // Good ✅
   page.locator('[data-testid="task-stats-widget"]');

   // Avoid ❌
   page.locator('.widget-card:nth-child(1)');
   ```

2. **Add explicit waits**

   ```typescript
   // Good ✅
   await page.waitForLoadState('networkidle');
   await expect(element).toBeVisible();

   // Avoid ❌
   await element.click();
   // Immediately check result without waiting
   ```

3. **Clean up after tests**

   ```typescript
   test.afterEach(async ({ page }) => {
     // Reset to default state if needed
     // Close modals, clear data, etc.
   });
   ```

4. **Use descriptive test names**

   ```typescript
   // Good ✅
   test('[P0] should save widget configuration to backend', ...)

   // Avoid ❌
   test('test1', ...)
   ```

## 🚦 CI/CD Integration

### GitHub Actions

```yaml
- name: Run Dashboard E2E Tests
  run: |
    cd apps/web
    npx playwright test e2e/dashboard/ --reporter=html

- name: Upload Test Report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: apps/web/playwright-report/
```

### Pre-commit Hook

```bash
# .husky/pre-push
#!/bin/sh
cd apps/web
npx playwright test e2e/dashboard/ --grep "P0"
```

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Dashboard Progress Tracker](./DASHBOARD_PROGRESS_TRACKER.yaml)
- [TASK-3.3 Complete Report](./DASHBOARD_SPRINT3_TASK_3-3_E2E_TESTS_COMPLETE.md)
- [Test Helpers](../../apps/web/e2e/helpers/testHelpers.ts)
- [Test Config](../../apps/web/e2e/config.ts)

## 🎯 Quick Commands Summary

```bash
# Most common commands
npx playwright test e2e/dashboard/              # Run all tests
npx playwright test e2e/dashboard/ --ui         # UI mode
npx playwright test e2e/dashboard/ --grep "P0"  # Critical only
npx playwright test e2e/dashboard/ --debug      # Debug mode
npx playwright show-report                      # View report
```

---

**Last Updated**: 2025-11-12  
**Total Tests**: 37  
**Coverage**: Dashboard page, widgets, settings, persistence  
**Status**: ✅ All tests passing
