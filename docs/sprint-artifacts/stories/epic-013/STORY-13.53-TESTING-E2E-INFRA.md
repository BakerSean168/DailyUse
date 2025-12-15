# Story 13.53: Phase 7 - E2E 测试基础设施

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.53 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 7: 测试与文档 |
| 优先级 | P1 (High) |
| 预估工时 | 6h |
| 前置依赖 | Story 13.01-13.52 (所有模块完成) |
| 关联模块 | Testing |

## 目标

建立 Electron 应用的端到端测试基础设施，使用 Playwright 进行自动化测试。

## 任务列表

### 1. Playwright 配置 (2h)
- [ ] Playwright 安装和配置
- [ ] Electron 启动配置
- [ ] 测试环境设置

### 2. 测试工具函数 (2h)
- [ ] 应用启动器
- [ ] 页面对象模型
- [ ] 常用断言

### 3. 基础测试用例 (2h)
- [ ] 应用启动测试
- [ ] 基本导航测试
- [ ] 窗口操作测试

## 技术规范

### Playwright 配置
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Electron tests must run serially
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'electron',
      testMatch: '**/*.e2e.ts',
    },
  ],
});
```

### 测试工具函数
```typescript
// e2e/utils/electron-app.ts
import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test';
import path from 'path';

export interface AppContext {
  app: ElectronApplication;
  page: Page;
}

export async function launchApp(): Promise<AppContext> {
  const electronPath = require('electron');
  const appPath = path.join(__dirname, '../../dist-electron/main.js');

  const app = await electron.launch({
    args: [appPath],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      E2E_TEST: 'true',
    },
  });

  // Wait for main window
  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');

  return { app, page };
}

export async function closeApp(app: ElectronApplication): Promise<void> {
  await app.close();
}

// Helper to get window by title
export async function getWindowByTitle(
  app: ElectronApplication,
  title: string
): Promise<Page | undefined> {
  const windows = app.windows();
  for (const window of windows) {
    const windowTitle = await window.title();
    if (windowTitle.includes(title)) {
      return window;
    }
  }
  return undefined;
}

// Helper to wait for IPC response
export async function waitForIPC(
  page: Page,
  channel: string,
  timeout = 5000
): Promise<unknown> {
  return page.evaluate(
    ({ channel, timeout }) => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`IPC timeout: ${channel}`));
        }, timeout);

        window.electron.ipcRenderer.once(channel, (_, data) => {
          clearTimeout(timer);
          resolve(data);
        });
      });
    },
    { channel, timeout }
  );
}
```

### 页面对象模型
```typescript
// e2e/pages/base-page.ts
import { type Page, type Locator, expect } from '@playwright/test';

export abstract class BasePage {
  constructor(protected page: Page) {}

  // Navigation
  async navigateTo(path: string): Promise<void> {
    await this.page.evaluate((path) => {
      window.history.pushState({}, '', `#${path}`);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }, path);
    await this.page.waitForLoadState('networkidle');
  }

  // Wait helpers
  async waitForElement(selector: string, timeout = 5000): Promise<Locator> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    return element;
  }

  async waitForText(text: string, timeout = 5000): Promise<void> {
    await this.page.waitForSelector(`text=${text}`, { timeout });
  }

  // Click helpers
  async click(selector: string): Promise<void> {
    await this.page.click(selector);
  }

  async clickButton(text: string): Promise<void> {
    await this.page.click(`button:has-text("${text}")`);
  }

  // Input helpers
  async fill(selector: string, value: string): Promise<void> {
    await this.page.fill(selector, value);
  }

  async type(selector: string, value: string): Promise<void> {
    await this.page.type(selector, value);
  }

  // Assertion helpers
  async expectVisible(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async expectText(selector: string, text: string): Promise<void> {
    await expect(this.page.locator(selector)).toContainText(text);
  }

  async expectNotVisible(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).not.toBeVisible();
  }
}
```

### Dashboard Page Object
```typescript
// e2e/pages/dashboard-page.ts
import { type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class DashboardPage extends BasePage {
  // Selectors
  private selectors = {
    overviewCards: '[data-testid="overview-cards"]',
    taskCountCard: '[data-testid="task-count-card"]',
    goalProgressCard: '[data-testid="goal-progress-card"]',
    focusTimeCard: '[data-testid="focus-time-card"]',
    activitySection: '[data-testid="activity-section"]',
    quickActions: '[data-testid="quick-actions"]',
    addTaskButton: '[data-testid="quick-add-task"]',
    startFocusButton: '[data-testid="quick-start-focus"]',
  };

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigateTo('/dashboard');
  }

  async expectLoaded(): Promise<void> {
    await this.waitForElement(this.selectors.overviewCards);
    await this.expectVisible(this.selectors.taskCountCard);
    await this.expectVisible(this.selectors.goalProgressCard);
  }

  async getTaskCount(): Promise<string> {
    const card = this.page.locator(this.selectors.taskCountCard);
    return card.locator('.stat-value').innerText();
  }

  async clickQuickAddTask(): Promise<void> {
    await this.click(this.selectors.addTaskButton);
  }

  async clickStartFocus(): Promise<void> {
    await this.click(this.selectors.startFocusButton);
  }
}
```

### Task Page Object
```typescript
// e2e/pages/task-page.ts
import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class TaskPage extends BasePage {
  private selectors = {
    taskList: '[data-testid="task-list"]',
    taskItem: '[data-testid="task-item"]',
    addTaskButton: '[data-testid="add-task-button"]',
    taskModal: '[data-testid="task-modal"]',
    taskTitleInput: '[data-testid="task-title-input"]',
    taskDescriptionInput: '[data-testid="task-description-input"]',
    saveTaskButton: '[data-testid="save-task-button"]',
    cancelButton: '[data-testid="cancel-button"]',
    searchInput: '[data-testid="task-search-input"]',
    filterDropdown: '[data-testid="task-filter-dropdown"]',
    emptyState: '[data-testid="task-empty-state"]',
  };

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigateTo('/tasks');
  }

  async expectLoaded(): Promise<void> {
    await this.waitForElement(this.selectors.taskList);
  }

  async openAddTaskModal(): Promise<void> {
    await this.click(this.selectors.addTaskButton);
    await this.waitForElement(this.selectors.taskModal);
  }

  async fillTaskForm(title: string, description?: string): Promise<void> {
    await this.fill(this.selectors.taskTitleInput, title);
    if (description) {
      await this.fill(this.selectors.taskDescriptionInput, description);
    }
  }

  async saveTask(): Promise<void> {
    await this.click(this.selectors.saveTaskButton);
    // Wait for modal to close
    await this.expectNotVisible(this.selectors.taskModal);
  }

  async createTask(title: string, description?: string): Promise<void> {
    await this.openAddTaskModal();
    await this.fillTaskForm(title, description);
    await this.saveTask();
  }

  async getTaskItems(): Promise<Locator> {
    return this.page.locator(this.selectors.taskItem);
  }

  async getTaskCount(): Promise<number> {
    const items = await this.getTaskItems();
    return items.count();
  }

  async expectTaskExists(title: string): Promise<void> {
    const task = this.page.locator(this.selectors.taskItem, { hasText: title });
    await expect(task).toBeVisible();
  }

  async searchTasks(query: string): Promise<void> {
    await this.fill(this.selectors.searchInput, query);
    // Wait for debounce
    await this.page.waitForTimeout(300);
  }

  async clickTask(title: string): Promise<void> {
    const task = this.page.locator(this.selectors.taskItem, { hasText: title });
    await task.click();
  }

  async toggleTaskComplete(title: string): Promise<void> {
    const task = this.page.locator(this.selectors.taskItem, { hasText: title });
    await task.locator('[data-testid="task-checkbox"]').click();
  }

  async deleteTask(title: string): Promise<void> {
    const task = this.page.locator(this.selectors.taskItem, { hasText: title });
    await task.hover();
    await task.locator('[data-testid="delete-task-button"]').click();
    // Confirm deletion
    await this.clickButton('确认删除');
  }
}
```

### 基础测试用例
```typescript
// e2e/tests/app-launch.e2e.ts
import { test, expect } from '@playwright/test';
import { launchApp, closeApp, type AppContext } from '../utils/electron-app';

let context: AppContext;

test.describe('Application Launch', () => {
  test.beforeEach(async () => {
    context = await launchApp();
  });

  test.afterEach(async () => {
    if (context?.app) {
      await closeApp(context.app);
    }
  });

  test('should launch successfully', async () => {
    const { app, page } = context;
    
    // Check app is running
    expect(app).toBeDefined();
    expect(page).toBeDefined();
    
    // Check window title
    const title = await page.title();
    expect(title).toContain('DailyUse');
  });

  test('should show main window', async () => {
    const { app } = context;
    
    // Check window count
    const windows = app.windows();
    expect(windows.length).toBeGreaterThanOrEqual(1);
  });

  test('should render app content', async () => {
    const { page } = context;
    
    // Wait for app to load
    await page.waitForSelector('#app', { state: 'visible' });
    
    // Check for navigation
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should have correct window dimensions', async () => {
    const { app, page } = context;
    
    const windowState = await app.evaluate(async ({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return {
        width: win.getBounds().width,
        height: win.getBounds().height,
        isMaximized: win.isMaximized(),
      };
    });

    expect(windowState.width).toBeGreaterThanOrEqual(800);
    expect(windowState.height).toBeGreaterThanOrEqual(600);
  });
});
```

### 导航测试
```typescript
// e2e/tests/navigation.e2e.ts
import { test, expect } from '@playwright/test';
import { launchApp, closeApp, type AppContext } from '../utils/electron-app';
import { DashboardPage } from '../pages/dashboard-page';
import { TaskPage } from '../pages/task-page';

let context: AppContext;

test.describe('Navigation', () => {
  test.beforeEach(async () => {
    context = await launchApp();
  });

  test.afterEach(async () => {
    if (context?.app) {
      await closeApp(context.app);
    }
  });

  test('should navigate to dashboard', async () => {
    const dashboard = new DashboardPage(context.page);
    await dashboard.goto();
    await dashboard.expectLoaded();
  });

  test('should navigate to tasks', async () => {
    const tasks = new TaskPage(context.page);
    await tasks.goto();
    await tasks.expectLoaded();
  });

  test('should navigate via sidebar', async () => {
    const { page } = context;

    // Click tasks in sidebar
    await page.click('[data-testid="nav-tasks"]');
    await page.waitForURL(/#\/tasks/);

    // Click goals in sidebar
    await page.click('[data-testid="nav-goals"]');
    await page.waitForURL(/#\/goals/);

    // Click dashboard in sidebar
    await page.click('[data-testid="nav-dashboard"]');
    await page.waitForURL(/#\/dashboard/);
  });

  test('should navigate via keyboard shortcuts', async () => {
    const { page } = context;

    // Navigate with Cmd/Ctrl+1 to dashboard
    await page.keyboard.press('Control+1');
    await page.waitForURL(/#\/dashboard/);

    // Navigate with Cmd/Ctrl+2 to tasks
    await page.keyboard.press('Control+2');
    await page.waitForURL(/#\/tasks/);

    // Navigate with Cmd/Ctrl+3 to goals
    await page.keyboard.press('Control+3');
    await page.waitForURL(/#\/goals/);
  });
});
```

### 窗口操作测试
```typescript
// e2e/tests/window.e2e.ts
import { test, expect } from '@playwright/test';
import { launchApp, closeApp, type AppContext } from '../utils/electron-app';

let context: AppContext;

test.describe('Window Operations', () => {
  test.beforeEach(async () => {
    context = await launchApp();
  });

  test.afterEach(async () => {
    if (context?.app) {
      await closeApp(context.app);
    }
  });

  test('should minimize and restore window', async () => {
    const { app } = context;

    // Minimize
    await app.evaluate(async ({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.minimize();
    });

    // Check minimized
    const isMinimized = await app.evaluate(async ({ BrowserWindow }) => {
      return BrowserWindow.getAllWindows()[0].isMinimized();
    });
    expect(isMinimized).toBe(true);

    // Restore
    await app.evaluate(async ({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.restore();
    });

    // Check restored
    const isRestoredMinimized = await app.evaluate(async ({ BrowserWindow }) => {
      return BrowserWindow.getAllWindows()[0].isMinimized();
    });
    expect(isRestoredMinimized).toBe(false);
  });

  test('should maximize and unmaximize window', async () => {
    const { app } = context;

    // Maximize
    await app.evaluate(async ({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.maximize();
    });

    const isMaximized = await app.evaluate(async ({ BrowserWindow }) => {
      return BrowserWindow.getAllWindows()[0].isMaximized();
    });
    expect(isMaximized).toBe(true);

    // Unmaximize
    await app.evaluate(async ({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.unmaximize();
    });

    const isStillMaximized = await app.evaluate(async ({ BrowserWindow }) => {
      return BrowserWindow.getAllWindows()[0].isMaximized();
    });
    expect(isStillMaximized).toBe(false);
  });

  test('should toggle fullscreen', async () => {
    const { app } = context;

    // Enter fullscreen
    await app.evaluate(async ({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.setFullScreen(true);
    });

    await context.page.waitForTimeout(500); // Wait for animation

    const isFullScreen = await app.evaluate(async ({ BrowserWindow }) => {
      return BrowserWindow.getAllWindows()[0].isFullScreen();
    });
    expect(isFullScreen).toBe(true);

    // Exit fullscreen
    await app.evaluate(async ({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.setFullScreen(false);
    });

    await context.page.waitForTimeout(500);

    const isStillFullScreen = await app.evaluate(async ({ BrowserWindow }) => {
      return BrowserWindow.getAllWindows()[0].isFullScreen();
    });
    expect(isStillFullScreen).toBe(false);
  });

  test('should resize window', async () => {
    const { app } = context;

    const newWidth = 1000;
    const newHeight = 700;

    await app.evaluate(
      async ({ BrowserWindow }, { width, height }) => {
        const win = BrowserWindow.getAllWindows()[0];
        win.setSize(width, height);
      },
      { width: newWidth, height: newHeight }
    );

    const bounds = await app.evaluate(async ({ BrowserWindow }) => {
      return BrowserWindow.getAllWindows()[0].getBounds();
    });

    expect(bounds.width).toBe(newWidth);
    expect(bounds.height).toBe(newHeight);
  });
});
```

### 测试命令配置
```json
// package.json (scripts)
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

## 验收标准

- [ ] Playwright 正确配置
- [ ] Electron 应用可正常启动
- [ ] 页面对象模型可复用
- [ ] 基础测试用例通过
- [ ] 测试报告正确生成
- [ ] CI/CD 可运行测试
- [ ] 截图和视频记录正常
- [ ] TypeScript 类型检查通过

## 相关文件

- `playwright.config.ts`
- `e2e/utils/electron-app.ts`
- `e2e/pages/base-page.ts`
- `e2e/pages/dashboard-page.ts`
- `e2e/pages/task-page.ts`
- `e2e/tests/app-launch.e2e.ts`
- `e2e/tests/navigation.e2e.ts`
- `e2e/tests/window.e2e.ts`
