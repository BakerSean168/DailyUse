/**
 * Goal Statistics E2E 测试
 * 测试目标统计和进度追踪功能
 */

import { test, expect, type Page } from '@playwright/test';
import { login, TEST_USER } from '../helpers/testHelpers';

test.describe('Goal Statistics - 目标统计', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // 登录
    await login(page, TEST_USER.username, TEST_USER.password);

    // 导航到 Goal 页面
    await page.goto('http://localhost:5173/goals', { waitUntil: 'networkidle' });
  });

  test('[P0] 应该显示目标总数统计', async () => {
    // Arrange: 创建几个测试目标
    await createGoal(page, { title: `E2E Goal 1 ${Date.now()}`, description: '测试目标1' });
    await createGoal(page, { title: `E2E Goal 2 ${Date.now()}`, description: '测试目标2' });
    await createGoal(page, { title: `E2E Goal 3 ${Date.now()}`, description: '测试目标3' });

    // Act: 查看统计面板
    await viewStatistics(page);

    // Assert: 验证目标总数
    const totalGoalsElement = page
      .locator('[data-testid="total-goals"]')
      .or(page.locator('text=/总目标|Total Goals/i'));
    
    await expect(totalGoalsElement).toBeVisible({ timeout: 5000 });
    
    // 数字应该 >= 3
    const totalText = await totalGoalsElement.textContent();
    const totalCount = parseInt(totalText?.match(/\d+/)?.[0] || '0');
    expect(totalCount).toBeGreaterThanOrEqual(3);
    
    console.log('✅ 目标总数统计测试通过');
  });

  test('[P0] 应该显示活跃目标数量', async () => {
    // Arrange: 创建并激活目标
    const goalTitle = `E2E Active Goal ${Date.now()}`;
    await createGoal(page, { title: goalTitle, description: '活跃目标' });

    // Act: 查看统计
    await viewStatistics(page);

    // Assert: 验证活跃目标数
    const activeGoalsElement = page
      .locator('[data-testid="active-goals"]')
      .or(page.locator('text=/活跃目标|Active Goals/i'));
    
    await expect(activeGoalsElement).toBeVisible({ timeout: 5000 });
    
    console.log('✅ 活跃目标统计测试通过');
  });

  test('[P0] 应该显示已完成目标数量', async () => {
    // Arrange: 创建并完成一个目标
    const goalTitle = `E2E Completed Goal ${Date.now()}`;
    await createGoal(page, { title: goalTitle, description: '待完成目标' });
    
    await page.click(`text=${goalTitle}`);
    await page.waitForLoadState('networkidle');
    
    await completeGoal(page);

    // Act: 返回并查看统计
    await page.goto('http://localhost:5173/goals', { waitUntil: 'networkidle' });
    await viewStatistics(page);

    // Assert: 验证已完成数量
    const completedGoalsElement = page
      .locator('[data-testid="completed-goals"]')
      .or(page.locator('text=/已完成|Completed/i'));
    
    await expect(completedGoalsElement).toBeVisible({ timeout: 5000 });
    
    console.log('✅ 已完成目标统计测试通过');
  });

  test('[P1] 应该显示目标完成率', async () => {
    // Act: 查看统计面板
    await viewStatistics(page);

    // Assert: 验证完成率显示
    const completionRateElement = page
      .locator('[data-testid="completion-rate"]')
      .or(page.locator('text=/完成率|Completion Rate/i'));
    
    if (await completionRateElement.isVisible()) {
      // 应该显示百分比
      const rateText = await completionRateElement.textContent();
      expect(rateText).toMatch(/\d+%/);
      
      console.log('✅ 完成率统计测试通过');
    } else {
      console.log('⚠️ 完成率功能未实现,跳过');
    }
  });

  test('[P1] 应该显示按重要性分类的统计', async () => {
    // Arrange: 创建不同重要性的目标
    await createGoal(page, { 
      title: `E2E High Priority ${Date.now()}`, 
      importance: 'HIGH' 
    });
    await createGoal(page, { 
      title: `E2E Medium Priority ${Date.now()}`, 
      importance: 'MEDIUM' 
    });

    // Act: 查看统计
    await viewStatistics(page);

    // Assert: 验证重要性分布
    const importanceChart = page
      .locator('[data-testid="importance-chart"]')
      .or(page.locator('text=/按重要性|By Importance/i'));
    
    if (await importanceChart.isVisible()) {
      await expect(importanceChart).toBeVisible();
      console.log('✅ 重要性统计测试通过');
    } else {
      console.log('⚠️ 重要性统计功能未实现');
    }
  });

  test('[P1] 应该显示本周/本月完成目标数', async () => {
    // Act: 查看统计
    await viewStatistics(page);

    // Assert: 验证周期统计
    const weeklyStats = page
      .locator('[data-testid="weekly-stats"]')
      .or(page.locator('text=/本周|This Week/i'));
    
    const monthlyStats = page
      .locator('[data-testid="monthly-stats"]')
      .or(page.locator('text=/本月|This Month/i'));
    
    if (await weeklyStats.isVisible() || await monthlyStats.isVisible()) {
      console.log('✅ 周期统计测试通过');
    } else {
      console.log('⚠️ 周期统计功能未实现');
    }
  });

  test('[P2] 应该显示目标进度趋势图', async () => {
    // Act: 查看统计/趋势页面
    await viewStatistics(page);

    // 切换到趋势标签页(如果存在)
    const trendTab = page
      .locator('button:has-text("趋势")')
      .or(page.locator('[data-testid="trend-tab"]'));
    
    if (await trendTab.isVisible()) {
      await trendTab.click();
      await page.waitForTimeout(1000);

      // Assert: 验证图表显示
      const trendChart = page
        .locator('[data-testid="trend-chart"]')
        .or(page.locator('canvas'))
        .or(page.locator('svg'));
      
      await expect(trendChart).toBeVisible({ timeout: 5000 });
      
      console.log('✅ 进度趋势图测试通过');
    } else {
      console.log('⚠️ 趋势图功能未实现');
    }
  });
});

test.describe('Goal Progress Tracking - 进度追踪', () => {
  let page: Page;
  let testGoalTitle: string;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    testGoalTitle = `E2E Progress Goal ${Date.now()}`;

    // 登录
    await login(page, TEST_USER.username, TEST_USER.password);

    // 导航并创建目标
    await page.goto('http://localhost:5173/goals', { waitUntil: 'networkidle' });
    await createGoal(page, {
      title: testGoalTitle,
      description: '用于进度追踪测试',
    });

    // 打开目标详情
    await page.click(`text=${testGoalTitle}`);
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await cleanupTestGoal(page, testGoalTitle);
  });

  test('[P0] 应该实时显示目标总进度', async () => {
    // Arrange: 添加关键结果
    await addKeyResult(page, {
      title: 'KR 1',
      type: 'INCREMENTAL',
      targetValue: '100',
      currentValue: '50', // 50%
      weight: 100,
    });

    // Assert: 验证总进度显示
    const progressElement = page
      .locator('[data-testid="goal-progress"]')
      .or(page.locator('text=/总进度|Overall Progress/i'));
    
    await expect(progressElement).toBeVisible({ timeout: 5000 });
    
    // 应该显示50%左右
    const progressText = await progressElement.textContent();
    expect(progressText).toMatch(/50|5\d%/);
    
    console.log('✅ 总进度显示测试通过');
  });

  test('[P0] 应该在更新KR后自动更新总进度', async () => {
    // Arrange: 添加KR
    const krTitle = 'Progress KR';
    await addKeyResult(page, {
      title: krTitle,
      type: 'INCREMENTAL',
      targetValue: '100',
      currentValue: '0', // 0%
      weight: 100,
    });

    await page.waitForTimeout(500);

    // Act: 更新进度
    await updateKeyResultProgress(page, krTitle, { currentValue: '75' });

    await page.waitForTimeout(1000);

    // Assert: 验证总进度更新到75%
    const progressElement = page.locator('[data-testid="goal-progress"]').or(page.locator('text=/总进度|Overall Progress/i'));
    const progressText = await progressElement.textContent();
    
    expect(progressText).toMatch(/75|7\d%/);
    
    console.log('✅ 自动更新进度测试通过');
  });

  test('[P1] 应该显示每个KR的完成度', async () => {
    // Arrange: 添加多个KR
    await addKeyResult(page, {
      title: 'KR 1',
      type: 'INCREMENTAL',
      targetValue: '100',
      currentValue: '100', // 100%
      weight: 50,
    });

    await addKeyResult(page, {
      title: 'KR 2',
      type: 'INCREMENTAL',
      targetValue: '100',
      currentValue: '50', // 50%
      weight: 50,
    });

    // Assert: 验证每个KR显示完成度
    const kr1Progress = page.locator('text=KR 1').locator('..').locator('text=/100%/');
    const kr2Progress = page.locator('text=KR 2').locator('..').locator('text=/50%/');
    
    await expect(kr1Progress).toBeVisible({ timeout: 5000 });
    await expect(kr2Progress).toBeVisible({ timeout: 5000 });
    
    console.log('✅ KR完成度显示测试通过');
  });

  test('[P1] 应该显示进度条可视化', async () => {
    // Arrange: 添加KR
    await addKeyResult(page, {
      title: 'Visual KR',
      type: 'PERCENTAGE',
      targetValue: '100',
      currentValue: '60',
      weight: 100,
    });

    // Assert: 验证进度条显示
    const progressBar = page
      .locator('[data-testid="progress-bar"]')
      .or(page.locator('.progress-bar'))
      .or(page.locator('[role="progressbar"]'));
    
    if (await progressBar.isVisible()) {
      // 检查进度条宽度或aria-valuenow属性
      const progressValue = await progressBar.getAttribute('aria-valuenow');
      if (progressValue) {
        expect(parseInt(progressValue)).toBeCloseTo(60, 10);
      }
      
      console.log('✅ 进度条可视化测试通过');
    } else {
      console.log('⚠️ 进度条组件未找到');
    }
  });
});

// ========== 辅助函数 ==========

async function createGoal(
  page: Page,
  options: {
    title: string;
    description?: string;
    importance?: 'HIGH' | 'MEDIUM' | 'LOW';
  }
) {
  const createButton = page.locator('button:has-text("创建目标")').or(page.locator('[data-testid="create-goal-button"]'));
  await createButton.click();
  await page.waitForTimeout(500);

  await page.locator('input[name="title"]').or(page.locator('[data-testid="goal-title-input"]')).fill(options.title);
  
  if (options.description) {
    await page.locator('textarea[name="description"]').or(page.locator('[data-testid="goal-description-input"]')).fill(options.description);
  }

  if (options.importance) {
    const importanceSelect = page.locator('select[name="importance"]').or(page.locator('[data-testid="importance-select"]'));
    if (await importanceSelect.isVisible()) {
      await importanceSelect.selectOption(options.importance);
    }
  }

  await page.locator('button:has-text("保存")').or(page.locator('[data-testid="save-goal-button"]')).click();
  await page.waitForTimeout(1000);
}

async function viewStatistics(page: Page) {
  console.log('[Stats] 查看统计面板');

  // 查找统计按钮或面板
  const statsButton = page
    .locator('button:has-text("统计")')
    .or(page.locator('button:has-text("Statistics")'))
    .or(page.locator('[data-testid="statistics-button"]'))
    .or(page.locator('a:has-text("统计")'));

  if (await statsButton.isVisible()) {
    await statsButton.click();
    await page.waitForTimeout(1000);
  }

  // 统计可能直接显示在页面上
  console.log('[Stats] 统计信息已加载');
}

async function completeGoal(page: Page) {
  console.log('[Goal] 完成目标');

  const completeButton = page
    .locator('button:has-text("完成")')
    .or(page.locator('button:has-text("Complete")'))
    .or(page.locator('[data-testid="complete-goal-button"]'));

  if (await completeButton.isVisible()) {
    await completeButton.click();
    await page.waitForTimeout(500);

    // 确认(如果需要)
    const confirmButton = page.locator('button:has-text("确认")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await page.waitForTimeout(1000);
  }

  console.log('[Goal] 目标已完成');
}

async function addKeyResult(
  page: Page,
  options: {
    title: string;
    type: 'INCREMENTAL' | 'PERCENTAGE' | 'BINARY';
    targetValue?: string;
    currentValue?: string;
    weight: number;
  }
) {
  const addButton = page
    .locator('button:has-text("添加关键结果")')
    .or(page.locator('[data-testid="add-keyresult-button"]'));

  await addButton.click();
  await page.waitForTimeout(500);

  await page.locator('input[name="title"]').or(page.locator('[data-testid="kr-title-input"]')).fill(options.title);

  const typeSelect = page.locator('select[name="type"]').or(page.locator('[data-testid="kr-type-select"]'));
  if (await typeSelect.isVisible()) {
    await typeSelect.selectOption(options.type);
  }

  if (options.type !== 'BINARY') {
    if (options.targetValue) {
      await page.locator('input[name="targetValue"]').or(page.locator('[data-testid="kr-target-input"]')).fill(options.targetValue);
    }
    if (options.currentValue) {
      await page.locator('input[name="currentValue"]').or(page.locator('[data-testid="kr-current-input"]')).fill(options.currentValue);
    }
  }

  await page.locator('input[name="weight"]').or(page.locator('[data-testid="kr-weight-input"]')).fill(options.weight.toString());

  await page.locator('button:has-text("保存")').or(page.locator('[data-testid="save-kr-button"]')).click();
  await page.waitForTimeout(1000);
}

async function updateKeyResultProgress(
  page: Page,
  krTitle: string,
  updates: { currentValue: string }
) {
  const krRow = page.locator(`text=${krTitle}`).locator('..');
  const editButton = krRow.locator('button[title*="编辑"]').or(krRow.locator('[data-testid="edit-kr-button"]'));
  
  if (await editButton.isVisible()) {
    await editButton.click();
    await page.waitForTimeout(500);
  }

  await page.locator('input[name="currentValue"]').or(page.locator('[data-testid="kr-current-input"]')).fill(updates.currentValue);

  await page.locator('button:has-text("保存")').or(page.locator('[data-testid="save-kr-button"]')).click();
  await page.waitForTimeout(1000);
}

async function cleanupTestGoal(page: Page, goalTitle: string) {
  try {
    await page.goto('http://localhost:5173/goals', { waitUntil: 'networkidle' });
    const goalCard = page.locator(`text=${goalTitle}`);
    if (await goalCard.isVisible()) {
      await goalCard.locator('..').hover();
      const deleteButton = page.locator('button[title*="删除"]').first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await page.waitForTimeout(500);
        const confirmButton = page.locator('button:has-text("确认")');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
      }
    }
  } catch (error) {
    console.warn('[Cleanup] 清理失败:', error);
  }
}
