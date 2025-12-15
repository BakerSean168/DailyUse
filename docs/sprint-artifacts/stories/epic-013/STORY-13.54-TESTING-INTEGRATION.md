# Story 13.54: Phase 7 - 集成测试套件

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.54 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 7: 测试与文档 |
| 优先级 | P1 (High) |
| 预估工时 | 8h |
| 前置依赖 | Story 13.53 (E2E 测试基础设施) |
| 关联模块 | Testing |

## 目标

为各模块创建完整的集成测试套件，覆盖主要业务流程。

## 任务列表

### 1. 任务模块测试 (2h)
- [ ] 任务 CRUD 测试
- [ ] 任务状态流转测试
- [ ] 任务搜索和过滤测试

### 2. 目标模块测试 (2h)
- [ ] 目标 CRUD 测试
- [ ] 目标进度更新测试
- [ ] 目标-任务关联测试

### 3. 专注模块测试 (2h)
- [ ] 专注会话测试
- [ ] 计时器功能测试
- [ ] 专注统计测试

### 4. 跨模块测试 (2h)
- [ ] 任务-目标-专注集成
- [ ] 通知触发测试
- [ ] 数据同步测试

## 技术规范

### 任务模块测试
```typescript
// e2e/tests/task.e2e.ts
import { test, expect } from '@playwright/test';
import { launchApp, closeApp, type AppContext } from '../utils/electron-app';
import { TaskPage } from '../pages/task-page';

let context: AppContext;
let taskPage: TaskPage;

test.describe('Task Module', () => {
  test.beforeEach(async () => {
    context = await launchApp();
    taskPage = new TaskPage(context.page);
    await taskPage.goto();
    await taskPage.expectLoaded();
  });

  test.afterEach(async () => {
    if (context?.app) {
      await closeApp(context.app);
    }
  });

  test.describe('Task CRUD', () => {
    test('should create a new task', async () => {
      const taskTitle = 'Test Task ' + Date.now();
      const taskDescription = 'This is a test task description';

      await taskPage.createTask(taskTitle, taskDescription);
      await taskPage.expectTaskExists(taskTitle);
    });

    test('should edit an existing task', async () => {
      const originalTitle = 'Original Task ' + Date.now();
      const updatedTitle = 'Updated Task ' + Date.now();

      // Create task
      await taskPage.createTask(originalTitle);
      await taskPage.expectTaskExists(originalTitle);

      // Edit task
      await taskPage.clickTask(originalTitle);
      await context.page.fill('[data-testid="task-title-input"]', updatedTitle);
      await context.page.click('[data-testid="save-task-button"]');

      // Verify update
      await taskPage.expectTaskExists(updatedTitle);
    });

    test('should delete a task', async () => {
      const taskTitle = 'Task to Delete ' + Date.now();

      // Create task
      await taskPage.createTask(taskTitle);
      await taskPage.expectTaskExists(taskTitle);

      // Delete task
      await taskPage.deleteTask(taskTitle);

      // Verify deletion
      const taskItem = context.page.locator('[data-testid="task-item"]', { hasText: taskTitle });
      await expect(taskItem).not.toBeVisible();
    });

    test('should show empty state when no tasks', async () => {
      // Clear all tasks first (if any)
      // This test assumes a fresh database
      const emptyState = context.page.locator('[data-testid="task-empty-state"]');
      const taskList = context.page.locator('[data-testid="task-item"]');
      
      const taskCount = await taskList.count();
      if (taskCount === 0) {
        await expect(emptyState).toBeVisible();
      }
    });
  });

  test.describe('Task Status', () => {
    test('should toggle task completion', async () => {
      const taskTitle = 'Task to Complete ' + Date.now();

      // Create task
      await taskPage.createTask(taskTitle);

      // Mark as complete
      await taskPage.toggleTaskComplete(taskTitle);

      // Verify completed status
      const taskItem = context.page.locator('[data-testid="task-item"]', { hasText: taskTitle });
      await expect(taskItem).toHaveAttribute('data-completed', 'true');

      // Toggle back to incomplete
      await taskPage.toggleTaskComplete(taskTitle);
      await expect(taskItem).toHaveAttribute('data-completed', 'false');
    });

    test('should move task to different status', async () => {
      const taskTitle = 'Task to Move ' + Date.now();

      await taskPage.createTask(taskTitle);

      // Open task and change status
      await taskPage.clickTask(taskTitle);
      await context.page.click('[data-testid="status-dropdown"]');
      await context.page.click('[data-testid="status-in-progress"]');
      await context.page.click('[data-testid="save-task-button"]');

      // Filter by in-progress
      await context.page.click('[data-testid="task-filter-dropdown"]');
      await context.page.click('[data-testid="filter-in-progress"]');

      await taskPage.expectTaskExists(taskTitle);
    });
  });

  test.describe('Task Search and Filter', () => {
    test('should search tasks by title', async () => {
      const uniquePrefix = 'SearchTest_' + Date.now();
      const task1 = uniquePrefix + '_Task1';
      const task2 = uniquePrefix + '_Task2';
      const otherTask = 'OtherTask_' + Date.now();

      // Create tasks
      await taskPage.createTask(task1);
      await taskPage.createTask(task2);
      await taskPage.createTask(otherTask);

      // Search
      await taskPage.searchTasks(uniquePrefix);

      // Verify results
      await taskPage.expectTaskExists(task1);
      await taskPage.expectTaskExists(task2);

      const otherTaskItem = context.page.locator('[data-testid="task-item"]', {
        hasText: otherTask,
      });
      await expect(otherTaskItem).not.toBeVisible();
    });

    test('should filter tasks by priority', async () => {
      const highPriorityTask = 'High Priority ' + Date.now();
      const lowPriorityTask = 'Low Priority ' + Date.now();

      // Create tasks with different priorities
      await taskPage.openAddTaskModal();
      await taskPage.fillTaskForm(highPriorityTask);
      await context.page.click('[data-testid="priority-high"]');
      await taskPage.saveTask();

      await taskPage.openAddTaskModal();
      await taskPage.fillTaskForm(lowPriorityTask);
      await context.page.click('[data-testid="priority-low"]');
      await taskPage.saveTask();

      // Filter by high priority
      await context.page.click('[data-testid="task-filter-dropdown"]');
      await context.page.click('[data-testid="filter-priority-high"]');

      await taskPage.expectTaskExists(highPriorityTask);

      const lowTaskItem = context.page.locator('[data-testid="task-item"]', {
        hasText: lowPriorityTask,
      });
      await expect(lowTaskItem).not.toBeVisible();
    });

    test('should filter tasks by date', async () => {
      const todayTask = 'Today Task ' + Date.now();
      const futureTask = 'Future Task ' + Date.now();

      // Create today's task
      await taskPage.createTask(todayTask);

      // Create future task
      await taskPage.openAddTaskModal();
      await taskPage.fillTaskForm(futureTask);
      await context.page.click('[data-testid="due-date-picker"]');
      await context.page.click('[data-testid="date-next-week"]');
      await taskPage.saveTask();

      // Filter by today
      await context.page.click('[data-testid="task-filter-dropdown"]');
      await context.page.click('[data-testid="filter-today"]');

      await taskPage.expectTaskExists(todayTask);

      const futureTaskItem = context.page.locator('[data-testid="task-item"]', {
        hasText: futureTask,
      });
      await expect(futureTaskItem).not.toBeVisible();
    });
  });
});
```

### 目标模块测试
```typescript
// e2e/tests/goal.e2e.ts
import { test, expect } from '@playwright/test';
import { launchApp, closeApp, type AppContext } from '../utils/electron-app';
import { GoalPage } from '../pages/goal-page';
import { TaskPage } from '../pages/task-page';

let context: AppContext;
let goalPage: GoalPage;
let taskPage: TaskPage;

test.describe('Goal Module', () => {
  test.beforeEach(async () => {
    context = await launchApp();
    goalPage = new GoalPage(context.page);
    taskPage = new TaskPage(context.page);
  });

  test.afterEach(async () => {
    if (context?.app) {
      await closeApp(context.app);
    }
  });

  test.describe('Goal CRUD', () => {
    test('should create a new goal', async () => {
      await goalPage.goto();
      await goalPage.expectLoaded();

      const goalTitle = 'Test Goal ' + Date.now();

      await goalPage.createGoal(goalTitle, 'Goal description');
      await goalPage.expectGoalExists(goalTitle);
    });

    test('should edit an existing goal', async () => {
      await goalPage.goto();

      const originalTitle = 'Original Goal ' + Date.now();
      const updatedTitle = 'Updated Goal ' + Date.now();

      // Create goal
      await goalPage.createGoal(originalTitle);
      await goalPage.expectGoalExists(originalTitle);

      // Edit goal
      await goalPage.clickGoal(originalTitle);
      await context.page.fill('[data-testid="goal-title-input"]', updatedTitle);
      await context.page.click('[data-testid="save-goal-button"]');

      await goalPage.expectGoalExists(updatedTitle);
    });

    test('should delete a goal', async () => {
      await goalPage.goto();

      const goalTitle = 'Goal to Delete ' + Date.now();

      await goalPage.createGoal(goalTitle);
      await goalPage.deleteGoal(goalTitle);

      const goalItem = context.page.locator('[data-testid="goal-item"]', { hasText: goalTitle });
      await expect(goalItem).not.toBeVisible();
    });

    test('should set goal deadline', async () => {
      await goalPage.goto();

      const goalTitle = 'Goal with Deadline ' + Date.now();

      await goalPage.openAddGoalModal();
      await goalPage.fillGoalForm(goalTitle);
      await context.page.click('[data-testid="deadline-picker"]');
      await context.page.click('[data-testid="date-next-month"]');
      await goalPage.saveGoal();

      await goalPage.expectGoalExists(goalTitle);

      // Verify deadline is set
      const goalItem = context.page.locator('[data-testid="goal-item"]', { hasText: goalTitle });
      await expect(goalItem.locator('[data-testid="goal-deadline"]')).toBeVisible();
    });
  });

  test.describe('Goal Progress', () => {
    test('should update goal progress manually', async () => {
      await goalPage.goto();

      const goalTitle = 'Progress Goal ' + Date.now();

      await goalPage.createGoal(goalTitle);
      await goalPage.clickGoal(goalTitle);

      // Update progress
      await context.page.fill('[data-testid="progress-input"]', '50');
      await context.page.click('[data-testid="save-goal-button"]');

      // Verify progress
      const goalItem = context.page.locator('[data-testid="goal-item"]', { hasText: goalTitle });
      await expect(goalItem.locator('[data-testid="progress-bar"]')).toHaveAttribute(
        'data-progress',
        '50'
      );
    });

    test('should auto-update progress from linked tasks', async () => {
      await goalPage.goto();

      const goalTitle = 'Auto Progress Goal ' + Date.now();
      const taskTitle = 'Linked Task ' + Date.now();

      // Create goal
      await goalPage.createGoal(goalTitle);

      // Go to tasks and create linked task
      await taskPage.goto();
      await taskPage.openAddTaskModal();
      await taskPage.fillTaskForm(taskTitle);
      await context.page.click('[data-testid="link-goal-dropdown"]');
      await context.page.click(`[data-testid="goal-option-${goalTitle}"]`);
      await taskPage.saveTask();

      // Complete the task
      await taskPage.toggleTaskComplete(taskTitle);

      // Check goal progress updated
      await goalPage.goto();
      const goalItem = context.page.locator('[data-testid="goal-item"]', { hasText: goalTitle });
      await expect(goalItem.locator('[data-testid="progress-bar"]')).toHaveAttribute(
        'data-progress',
        '100'
      );
    });
  });

  test.describe('Goal-Task Association', () => {
    test('should link task to goal', async () => {
      await goalPage.goto();

      const goalTitle = 'Parent Goal ' + Date.now();
      const taskTitle = 'Child Task ' + Date.now();

      // Create goal
      await goalPage.createGoal(goalTitle);

      // Create linked task
      await taskPage.goto();
      await taskPage.openAddTaskModal();
      await taskPage.fillTaskForm(taskTitle);
      await context.page.click('[data-testid="link-goal-dropdown"]');
      await context.page.click(`[data-testid="goal-option"]`, { hasText: goalTitle });
      await taskPage.saveTask();

      // Verify linkage in goal view
      await goalPage.goto();
      await goalPage.clickGoal(goalTitle);

      const linkedTask = context.page.locator('[data-testid="linked-task"]', { hasText: taskTitle });
      await expect(linkedTask).toBeVisible();
    });

    test('should unlink task from goal', async () => {
      // Similar setup as above, then unlink
    });

    test('should show goal in task detail', async () => {
      // Create goal and linked task, verify goal shows in task detail
    });
  });
});
```

### 专注模块测试
```typescript
// e2e/tests/focus.e2e.ts
import { test, expect } from '@playwright/test';
import { launchApp, closeApp, type AppContext } from '../utils/electron-app';
import { FocusPage } from '../pages/focus-page';

let context: AppContext;
let focusPage: FocusPage;

test.describe('Focus Module', () => {
  test.beforeEach(async () => {
    context = await launchApp();
    focusPage = new FocusPage(context.page);
  });

  test.afterEach(async () => {
    if (context?.app) {
      await closeApp(context.app);
    }
  });

  test.describe('Focus Session', () => {
    test('should start a focus session', async () => {
      await focusPage.goto();
      await focusPage.expectLoaded();

      await focusPage.startFocus();

      // Verify timer is running
      const timerDisplay = context.page.locator('[data-testid="focus-timer"]');
      await expect(timerDisplay).toBeVisible();
      await expect(context.page.locator('[data-testid="focus-active"]')).toBeVisible();
    });

    test('should pause and resume focus session', async () => {
      await focusPage.goto();

      await focusPage.startFocus();
      await context.page.waitForTimeout(2000); // Let it run for 2 seconds

      // Pause
      await focusPage.pauseFocus();
      const pausedTime = await focusPage.getTimerValue();

      await context.page.waitForTimeout(2000);
      const afterPauseTime = await focusPage.getTimerValue();

      // Time should not change while paused
      expect(pausedTime).toBe(afterPauseTime);

      // Resume
      await focusPage.resumeFocus();
      await context.page.waitForTimeout(2000);

      const afterResumeTime = await focusPage.getTimerValue();
      expect(afterResumeTime).not.toBe(pausedTime);
    });

    test('should stop focus session', async () => {
      await focusPage.goto();

      await focusPage.startFocus();
      await context.page.waitForTimeout(2000);

      await focusPage.stopFocus();

      // Should show completion modal or return to initial state
      await expect(context.page.locator('[data-testid="focus-active"]')).not.toBeVisible();
    });

    test('should complete focus session when timer ends', async () => {
      await focusPage.goto();

      // Start a short focus session (1 minute for testing)
      await focusPage.setDuration(1);
      await focusPage.startFocus();

      // Wait for completion (plus buffer)
      await context.page.waitForTimeout(65000);

      // Should show completion state
      await expect(context.page.locator('[data-testid="focus-completed"]')).toBeVisible();
    });

    test('should link focus session to task', async () => {
      const taskTitle = 'Focus Task ' + Date.now();

      // Create a task first
      await context.page.goto('/#/tasks');
      await context.page.click('[data-testid="add-task-button"]');
      await context.page.fill('[data-testid="task-title-input"]', taskTitle);
      await context.page.click('[data-testid="save-task-button"]');

      // Go to focus and link task
      await focusPage.goto();
      await context.page.click('[data-testid="link-task-dropdown"]');
      await context.page.click(`[data-testid="task-option"]`, { hasText: taskTitle });

      await focusPage.startFocus();

      // Verify task is linked
      const linkedTask = context.page.locator('[data-testid="linked-task-display"]');
      await expect(linkedTask).toContainText(taskTitle);
    });
  });

  test.describe('Focus Settings', () => {
    test('should configure focus duration', async () => {
      await focusPage.goto();

      // Set custom duration
      await context.page.fill('[data-testid="focus-duration-input"]', '45');

      // Start focus
      await focusPage.startFocus();

      // Verify duration
      const timerDisplay = await focusPage.getTimerValue();
      expect(timerDisplay).toContain('45:00');
    });

    test('should configure break duration', async () => {
      await focusPage.goto();

      // Set break duration
      await context.page.click('[data-testid="focus-settings"]');
      await context.page.fill('[data-testid="break-duration-input"]', '10');
      await context.page.click('[data-testid="save-settings"]');

      // Complete a focus session and verify break time
    });

    test('should toggle auto-start breaks', async () => {
      await focusPage.goto();

      await context.page.click('[data-testid="focus-settings"]');
      await context.page.click('[data-testid="auto-start-break-toggle"]');
      await context.page.click('[data-testid="save-settings"]');

      // Verify setting is saved
      await context.page.click('[data-testid="focus-settings"]');
      const toggle = context.page.locator('[data-testid="auto-start-break-toggle"]');
      await expect(toggle).toBeChecked();
    });
  });

  test.describe('Focus Statistics', () => {
    test('should show today focus time', async () => {
      await focusPage.goto();

      // Complete a short focus session
      await focusPage.setDuration(1);
      await focusPage.startFocus();
      await context.page.waitForTimeout(65000);

      // Check stats
      await context.page.click('[data-testid="focus-stats-tab"]');
      const todayTime = context.page.locator('[data-testid="today-focus-time"]');
      await expect(todayTime).toContainText('1');
    });

    test('should show weekly focus chart', async () => {
      await focusPage.goto();
      await context.page.click('[data-testid="focus-stats-tab"]');

      const chart = context.page.locator('[data-testid="weekly-focus-chart"]');
      await expect(chart).toBeVisible();
    });

    test('should show focus history', async () => {
      await focusPage.goto();
      await context.page.click('[data-testid="focus-history-tab"]');

      const historyList = context.page.locator('[data-testid="focus-history-list"]');
      await expect(historyList).toBeVisible();
    });
  });
});
```

### 跨模块集成测试
```typescript
// e2e/tests/integration.e2e.ts
import { test, expect } from '@playwright/test';
import { launchApp, closeApp, type AppContext } from '../utils/electron-app';

let context: AppContext;

test.describe('Cross-Module Integration', () => {
  test.beforeEach(async () => {
    context = await launchApp();
  });

  test.afterEach(async () => {
    if (context?.app) {
      await closeApp(context.app);
    }
  });

  test('should complete full task-goal-focus workflow', async () => {
    const { page } = context;
    const goalTitle = 'Integration Goal ' + Date.now();
    const taskTitle = 'Integration Task ' + Date.now();

    // 1. Create goal
    await page.goto('/#/goals');
    await page.click('[data-testid="add-goal-button"]');
    await page.fill('[data-testid="goal-title-input"]', goalTitle);
    await page.click('[data-testid="save-goal-button"]');

    // 2. Create task linked to goal
    await page.goto('/#/tasks');
    await page.click('[data-testid="add-task-button"]');
    await page.fill('[data-testid="task-title-input"]', taskTitle);
    await page.click('[data-testid="link-goal-dropdown"]');
    await page.click(`text=${goalTitle}`);
    await page.click('[data-testid="save-task-button"]');

    // 3. Start focus session linked to task
    await page.goto('/#/focus');
    await page.click('[data-testid="link-task-dropdown"]');
    await page.click(`text=${taskTitle}`);
    await page.fill('[data-testid="focus-duration-input"]', '1');
    await page.click('[data-testid="start-focus-button"]');

    // 4. Wait for focus to complete
    await page.waitForTimeout(65000);

    // 5. Complete the task
    await page.goto('/#/tasks');
    const taskCheckbox = page.locator('[data-testid="task-item"]', { hasText: taskTitle }).locator('[data-testid="task-checkbox"]');
    await taskCheckbox.click();

    // 6. Verify goal progress updated
    await page.goto('/#/goals');
    const goalProgress = page.locator('[data-testid="goal-item"]', { hasText: goalTitle }).locator('[data-testid="progress-bar"]');
    await expect(goalProgress).toHaveAttribute('data-progress', '100');

    // 7. Verify dashboard shows updates
    await page.goto('/#/dashboard');
    await expect(page.locator('[data-testid="recent-activity"]')).toContainText(taskTitle);
    await expect(page.locator('[data-testid="focus-time-today"]')).toContainText('1');
  });

  test('should trigger notification when task is due', async () => {
    const { page, app } = context;
    const taskTitle = 'Due Task ' + Date.now();

    // Create task due soon
    await page.goto('/#/tasks');
    await page.click('[data-testid="add-task-button"]');
    await page.fill('[data-testid="task-title-input"]', taskTitle);
    
    // Set due time to 1 minute from now
    await page.click('[data-testid="due-date-picker"]');
    await page.click('[data-testid="date-today"]');
    await page.fill('[data-testid="due-time-input"]', '00:01'); // 1 minute
    await page.click('[data-testid="save-task-button"]');

    // Wait for notification
    await page.waitForTimeout(65000);

    // Check notification was triggered
    const notificationBell = page.locator('[data-testid="notification-bell"]');
    await expect(notificationBell).toHaveAttribute('data-has-notifications', 'true');
  });

  test('should sync data across windows', async () => {
    const { page, app } = context;
    const taskTitle = 'Sync Task ' + Date.now();

    // Create task in main window
    await page.goto('/#/tasks');
    await page.click('[data-testid="add-task-button"]');
    await page.fill('[data-testid="task-title-input"]', taskTitle);
    await page.click('[data-testid="save-task-button"]');

    // Open new window
    const newWindow = await app.evaluate(async ({ BrowserWindow }) => {
      const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });
      return win.id;
    });

    // Verify task exists in new window
    const windows = app.windows();
    const secondWindow = windows.find((w) => w !== page);
    if (secondWindow) {
      await secondWindow.goto('/#/tasks');
      await expect(secondWindow.locator('[data-testid="task-item"]', { hasText: taskTitle })).toBeVisible();
    }
  });
});
```

## 验收标准

- [ ] 任务 CRUD 测试全部通过
- [ ] 目标 CRUD 测试全部通过
- [ ] 专注会话测试全部通过
- [ ] 跨模块集成测试通过
- [ ] 测试覆盖主要业务流程
- [ ] 测试报告生成正确
- [ ] CI/CD 集成正常
- [ ] TypeScript 类型检查通过

## 相关文件

- `e2e/tests/task.e2e.ts`
- `e2e/tests/goal.e2e.ts`
- `e2e/tests/focus.e2e.ts`
- `e2e/tests/integration.e2e.ts`
- `e2e/pages/goal-page.ts`
- `e2e/pages/focus-page.ts`
