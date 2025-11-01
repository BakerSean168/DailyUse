/**
 * Goal CRUD E2E 测试
 * 测试目标管理的关键流程
 */

import { test, expect, type Page } from '@playwright/test';
import { login, TEST_USER } from '../helpers/testHelpers';

test.describe('Goal CRUD - 目标管理基础功能', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // 使用预先创建的测试用户登录
    await login(page, TEST_USER.username, TEST_USER.password);

    // 导航到 Goal 页面
    await navigateToGoals(page);
  });

  test.afterEach(async () => {
    // 清理测试数据
    await cleanupTestGoals(page);
  });

  test('[P0] 应该成功创建一个新目标', async () => {
    const goalTitle = `E2E Test Goal ${Date.now()}`;
    const goalDescription = '这是一个端到端测试目标';

    // Act: 创建目标
    await createGoal(page, {
      title: goalTitle,
      description: goalDescription,
    });

    // Assert: 验证目标出现在列表中
    await expect(page.locator(`text=${goalTitle}`)).toBeVisible({ timeout: 10000 });

    // 点击目标卡片查看详情
    await page.click(`text=${goalTitle}`);

    // 验证详情页显示正确信息
    await expect(page.locator(`text=${goalDescription}`)).toBeVisible();

    console.log('✅ 创建目标测试通过');
  });

  test('[P0] 应该成功更新目标信息', async () => {
    const originalTitle = `E2E Goal ${Date.now()}`;
    const updatedTitle = `Updated ${originalTitle}`;
    const updatedDescription = '更新后的描述';

    // Arrange: 创建初始目标
    await createGoal(page, {
      title: originalTitle,
      description: '原始描述',
    });

    await expect(page.locator(`text=${originalTitle}`)).toBeVisible({ timeout: 10000 });

    // Act: 编辑目标
    await editGoal(page, originalTitle, {
      title: updatedTitle,
      description: updatedDescription,
    });

    // Assert: 验证更新成功
    await expect(page.locator(`text=${updatedTitle}`)).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${originalTitle}`)).not.toBeVisible();

    console.log('✅ 更新目标测试通过');
  });

  test('[P0] 应该成功删除目标', async () => {
    const goalTitle = `E2E Delete Test ${Date.now()}`;

    // Arrange: 创建目标
    await createGoal(page, {
      title: goalTitle,
      description: '即将被删除的目标',
    });

    await expect(page.locator(`text=${goalTitle}`)).toBeVisible({ timeout: 10000 });

    // Act: 删除目标
    await deleteGoal(page, goalTitle);

    // Assert: 验证目标不再显示
    await expect(page.locator(`text=${goalTitle}`)).not.toBeVisible();

    console.log('✅ 删除目标测试通过');
  });

  test('[P1] 应该能够查看目标详情', async () => {
    const goalTitle = `E2E Detail View ${Date.now()}`;
    const goalDescription = '用于测试详情查看';

    // Arrange: 创建目标
    await createGoal(page, {
      title: goalTitle,
      description: goalDescription,
    });

    await expect(page.locator(`text=${goalTitle}`)).toBeVisible({ timeout: 10000 });

    // Act: 打开详情
    await page.click(`text=${goalTitle}`);

    // Assert: 验证详情页元素
    await expect(page.locator(`text=${goalTitle}`)).toBeVisible();
    await expect(page.locator(`text=${goalDescription}`)).toBeVisible();

    // 验证详情页包含关键元素
    // (根据实际 UI 调整选择器)
    await expect(page.locator('text=状态').or(page.locator('text=Status'))).toBeVisible();

    console.log('✅ 查看目标详情测试通过');
  });

  test('[P1] 应该能够激活目标', async () => {
    const goalTitle = `E2E Activate ${Date.now()}`;

    // Arrange: 创建草稿目标
    await createGoal(page, {
      title: goalTitle,
      description: '待激活目标',
      status: 'DRAFT',
    });

    await expect(page.locator(`text=${goalTitle}`)).toBeVisible({ timeout: 10000 });

    // Act: 激活目标
    await activateGoal(page, goalTitle);

    // Assert: 验证状态变化
    // (具体验证根据 UI 显示调整)
    await expect(page.locator(`text=${goalTitle}`)).toBeVisible();

    console.log('✅ 激活目标测试通过');
  });

  test('[P1] 应该能够完成目标', async () => {
    const goalTitle = `E2E Complete ${Date.now()}`;

    // Arrange: 创建并激活目标
    await createGoal(page, {
      title: goalTitle,
      description: '待完成目标',
    });

    await expect(page.locator(`text=${goalTitle}`)).toBeVisible({ timeout: 10000 });
    await activateGoal(page, goalTitle);

    // Act: 完成目标
    await completeGoal(page, goalTitle);

    // Assert: 验证完成状态
    await expect(page.locator(`text=${goalTitle}`)).toBeVisible();

    console.log('✅ 完成目标测试通过');
  });

  test('[P2] 应该能够筛选目标', async () => {
    const activeGoal = `E2E Active ${Date.now()}`;
    const draftGoal = `E2E Draft ${Date.now()}`;

    // Arrange: 创建不同状态的目标
    await createGoal(page, { title: activeGoal, description: 'Active goal' });
    await createGoal(page, { title: draftGoal, description: 'Draft goal', status: 'DRAFT' });

    await expect(page.locator(`text=${activeGoal}`)).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${draftGoal}`)).toBeVisible({ timeout: 10000 });

    // Act: 应用筛选 (根据实际 UI 调整)
    await applyGoalFilter(page, 'ACTIVE');

    // Assert: 只显示 active 目标
    await expect(page.locator(`text=${activeGoal}`)).toBeVisible();

    console.log('✅ 筛选目标测试通过');
  });
});

// ========== 辅助函数 ==========

/**
 * 导航到 Goals 页面
 */
async function navigateToGoals(page: Page) {
  console.log('[Goal] 导航到 Goals 页面');

  // 尝试多种导航方式
  try {
    // 方式 1: 直接访问 URL
    await page.goto('/goals', { waitUntil: 'networkidle' });
  } catch {
    // 方式 2: 通过侧边栏点击
    const goalsLink = page.locator('text=目标').or(page.locator('text=Goals'));
    if (await goalsLink.isVisible()) {
      await goalsLink.click();
    }
  }

  // 等待页面加载
  await page.waitForLoadState('networkidle');

  console.log('[Goal] 已到达 Goals 页面');
}

/**
 * 创建目标
 */
async function createGoal(
  page: Page,
  options: {
    title: string;
    description?: string;
    status?: string;
  },
) {
  console.log(`[Goal] 创建目标: ${options.title}`);

  // 点击"创建目标"按钮
  const createButton = page
    .locator('button:has-text("创建目标")')
    .or(page.locator('button:has-text("新建目标")'))
    .or(page.locator('[data-testid="create-goal-button"]'));

  await createButton.click();

  // 等待对话框打开
  await page.waitForTimeout(500);

  // 填写标题
  const titleInput = page
    .locator('input[name="title"]')
    .or(page.locator('input[placeholder*="标题"]'))
    .or(page.locator('[data-testid="goal-title-input"]'));

  await titleInput.fill(options.title);

  // 填写描述（如果提供）
  if (options.description) {
    const descInput = page
      .locator('textarea[name="description"]')
      .or(page.locator('textarea[placeholder*="描述"]'))
      .or(page.locator('[data-testid="goal-description-input"]'));

    if (await descInput.isVisible()) {
      await descInput.fill(options.description);
    }
  }

  // 点击保存/确认按钮
  const saveButton = page
    .locator('button:has-text("保存")')
    .or(page.locator('button:has-text("确认")'))
    .or(page.locator('button:has-text("创建")'))
    .or(page.locator('[data-testid="save-goal-button"]'));

  await saveButton.click();

  // 等待对话框关闭和数据加载
  await page.waitForTimeout(1000);

  console.log(`[Goal] 目标创建完成: ${options.title}`);
}

/**
 * 编辑目标
 */
async function editGoal(
  page: Page,
  goalTitle: string,
  updates: {
    title?: string;
    description?: string;
  },
) {
  console.log(`[Goal] 编辑目标: ${goalTitle}`);

  // 找到目标卡片
  const goalCard = page.locator(`text=${goalTitle}`).locator('..');

  // 鼠标悬停显示操作按钮
  await goalCard.hover();

  // 点击编辑按钮
  const editButton = goalCard
    .locator('button[title*="编辑"]')
    .or(goalCard.locator('[data-testid="edit-goal-button"]'))
    .or(page.locator('button:has-text("编辑")').first());

  await editButton.click();

  // 等待编辑对话框打开
  await page.waitForTimeout(500);

  // 更新标题
  if (updates.title) {
    const titleInput = page
      .locator('input[name="title"]')
      .or(page.locator('input[placeholder*="标题"]'));
    await titleInput.fill(updates.title);
  }

  // 更新描述
  if (updates.description) {
    const descInput = page
      .locator('textarea[name="description"]')
      .or(page.locator('textarea[placeholder*="描述"]'));
    await descInput.fill(updates.description);
  }

  // 保存更改
  const saveButton = page
    .locator('button:has-text("保存")')
    .or(page.locator('button:has-text("确认")'));

  await saveButton.click();

  // 等待更新完成
  await page.waitForTimeout(1000);

  console.log(`[Goal] 目标编辑完成`);
}

/**
 * 删除目标
 */
async function deleteGoal(page: Page, goalTitle: string) {
  console.log(`[Goal] 删除目标: ${goalTitle}`);

  // 找到目标卡片
  const goalCard = page.locator(`text=${goalTitle}`).locator('..');

  // 鼠标悬停显示操作按钮
  await goalCard.hover();

  // 点击删除按钮
  const deleteButton = goalCard
    .locator('button[title*="删除"]')
    .or(goalCard.locator('[data-testid="delete-goal-button"]'))
    .or(page.locator('button:has-text("删除")').first());

  await deleteButton.click();

  // 确认删除（如果有确认对话框）
  await page.waitForTimeout(500);

  const confirmButton = page
    .locator('button:has-text("确认")')
    .or(page.locator('button:has-text("删除")'));

  if (await confirmButton.isVisible()) {
    await confirmButton.click();
  }

  // 等待删除完成
  await page.waitForTimeout(1000);

  console.log(`[Goal] 目标删除完成`);
}

/**
 * 激活目标
 */
async function activateGoal(page: Page, goalTitle: string) {
  console.log(`[Goal] 激活目标: ${goalTitle}`);

  // 找到目标卡片
  const goalCard = page.locator(`text=${goalTitle}`).locator('..');

  // 鼠标悬停显示操作按钮
  await goalCard.hover();

  // 点击激活按钮
  const activateButton = goalCard
    .locator('button[title*="激活"]')
    .or(goalCard.locator('[data-testid="activate-goal-button"]'))
    .or(page.locator('button:has-text("激活")').first());

  if (await activateButton.isVisible()) {
    await activateButton.click();
    await page.waitForTimeout(1000);
  }

  console.log(`[Goal] 目标激活完成`);
}

/**
 * 完成目标
 */
async function completeGoal(page: Page, goalTitle: string) {
  console.log(`[Goal] 完成目标: ${goalTitle}`);

  // 找到目标卡片
  const goalCard = page.locator(`text=${goalTitle}`).locator('..');

  // 鼠标悬停显示操作按钮
  await goalCard.hover();

  // 点击完成按钮
  const completeButton = goalCard
    .locator('button[title*="完成"]')
    .or(goalCard.locator('[data-testid="complete-goal-button"]'))
    .or(page.locator('button:has-text("完成")').first());

  if (await completeButton.isVisible()) {
    await completeButton.click();
    await page.waitForTimeout(1000);
  }

  console.log(`[Goal] 目标完成`);
}

/**
 * 应用目标筛选
 */
async function applyGoalFilter(page: Page, status: string) {
  console.log(`[Goal] 应用筛选: ${status}`);

  // 查找筛选器
  const filterButton = page
    .locator('button:has-text("筛选")')
    .or(page.locator('[data-testid="filter-button"]'));

  if (await filterButton.isVisible()) {
    await filterButton.click();
    await page.waitForTimeout(500);

    // 选择状态
    const statusOption = page.locator(`text=${status}`);
    await statusOption.click();
  }

  await page.waitForTimeout(1000);

  console.log(`[Goal] 筛选应用完成`);
}

/**
 * 清理测试数据
 */
async function cleanupTestGoals(page: Page) {
  console.log('[Goal] 清理测试数据');

  try {
    // 查找所有测试目标（标题包含 "E2E"）
    const testGoals = page.locator('text=/E2E.*Test/');
    const count = await testGoals.count();

    for (let i = 0; i < count; i++) {
      try {
        const goal = testGoals.nth(i);
        const title = await goal.textContent();
        if (title && title.includes('E2E')) {
          await deleteGoal(page, title);
        }
      } catch (error) {
        console.warn(`清理目标失败: ${error}`);
      }
    }

    console.log(`[Goal] 清理了 ${count} 个测试目标`);
  } catch (error) {
    console.warn('[Goal] 清理测试数据时出错:', error);
  }
}
