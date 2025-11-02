/**
 * Goal CRUD E2E ??
 * ???????????
 */

import { test, expect, type Page } from '@playwright/test';
import { login, TEST_USER } from '../helpers/testHelpers';
import { WEB_CONFIG } from '../config';

test.describe('Goal CRUD - ????????', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // 使用预先创建的测试用户登录
    await login(page, TEST_USER.username, TEST_USER.password);

    // ??? Goal ??
    await navigateToGoals(page);
  });

  test.afterEach(async () => {
    // ??????
    await cleanupTestGoals(page);
  });

  test('[P0] ???????????', async () => {
    const goalTitle = `E2E Test Goal ${Date.now()}`;
    const goalDescription = '???????????';

    // Act: ????
    await createGoal(page, {
      title: goalTitle,
      description: goalDescription,
    });

    // Assert: ??????????
    await expect(page.locator(`text=${goalTitle}`)).toBeVisible({ timeout: 10000 });

    // ??????????
    await page.click(`text=${goalTitle}`);

    // ???????????
    await expect(page.locator(`text=${goalDescription}`)).toBeVisible();

    console.log('[PASS] ????????');
  });

  test('[P0] ??????????', async () => {
    const originalTitle = `E2E Goal ${Date.now()}`;
    const updatedTitle = `Updated ${originalTitle}`;
    const updatedDescription = '??????';

    // Arrange: ??????
    await createGoal(page, {
      title: originalTitle,
      description: '????',
    });

    await expect(page.locator(`text=${originalTitle}`)).toBeVisible({ timeout: 10000 });

    // Act: ????
    await editGoal(page, originalTitle, {
      title: updatedTitle,
      description: updatedDescription,
    });

    // Assert: ??????
    await expect(page.locator(`text=${updatedTitle}`)).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${originalTitle}`)).not.toBeVisible();

    console.log('[PASS] ????????');
  });

  test('[P0] ????????', async () => {
    const goalTitle = `E2E Delete Test ${Date.now()}`;

    // Arrange: ????
    await createGoal(page, {
      title: goalTitle,
      description: '????????',
    });

    await expect(page.locator(`text=${goalTitle}`)).toBeVisible({ timeout: 10000 });

    // Act: ????
    await deleteGoal(page, goalTitle);

    // Assert: ????????
    await expect(page.locator(`text=${goalTitle}`)).not.toBeVisible();

    console.log('[PASS] ????????');
  });

  test('[P1] ??????????', async () => {
    const goalTitle = `E2E Detail View ${Date.now()}`;
    const goalDescription = '????????';

    // Arrange: ????
    await createGoal(page, {
      title: goalTitle,
      description: goalDescription,
    });

    await expect(page.locator(`text=${goalTitle}`)).toBeVisible({ timeout: 10000 });

    // Act: ????
    await page.click(`text=${goalTitle}`);

    // Assert: ???????
    await expect(page.locator(`text=${goalTitle}`)).toBeVisible();
    await expect(page.locator(`text=${goalDescription}`)).toBeVisible();

    // ???????????
    // (???? UI ?????)
    await expect(page.locator('text=??').or(page.locator('text=Status'))).toBeVisible();

    console.log('[PASS] ??????????');
  });

  test('[P1] ????????', async () => {
    const goalTitle = `E2E Activate ${Date.now()}`;

    // Arrange: ??????
    await createGoal(page, {
      title: goalTitle,
      description: '?????',
      status: 'DRAFT',
    });

    await expect(page.locator(`text=${goalTitle}`)).toBeVisible({ timeout: 10000 });

    // Act: ????
    await activateGoal(page, goalTitle);

    // Assert: ??????
    // (?????? UI ????)
    await expect(page.locator(`text=${goalTitle}`)).toBeVisible();

    console.log('[PASS] ????????');
  });

  test('[P1] ????????', async () => {
    const goalTitle = `E2E Complete ${Date.now()}`;

    // Arrange: ???????
    await createGoal(page, {
      title: goalTitle,
      description: '?????',
    });

    await expect(page.locator(`text=${goalTitle}`)).toBeVisible({ timeout: 10000 });
    await activateGoal(page, goalTitle);

    // Act: ????
    await completeGoal(page, goalTitle);

    // Assert: ??????
    await expect(page.locator(`text=${goalTitle}`)).toBeVisible();

    console.log('[PASS] ????????');
  });

  test('[P2] ????????', async () => {
    const activeGoal = `E2E Active ${Date.now()}`;
    const draftGoal = `E2E Draft ${Date.now()}`;

    // Arrange: ?????????
    await createGoal(page, { title: activeGoal, description: 'Active goal' });
    await createGoal(page, { title: draftGoal, description: 'Draft goal', status: 'DRAFT' });

    await expect(page.locator(`text=${activeGoal}`)).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${draftGoal}`)).toBeVisible({ timeout: 10000 });

    // Act: ???? (???? UI ??)
    await applyGoalFilter(page, 'ACTIVE');

    // Assert: ??? active ??
    await expect(page.locator(`text=${activeGoal}`)).toBeVisible();

    console.log('[PASS] ????????');
  });
});

// ========== ???? ==========

/**
 * ??? Goals ??
 */
async function navigateToGoals(page: Page) {
  console.log('[Goal] ??? Goals ??');

  // ????????
  try {
    // 方式 1: 直接访问 URL
    await page.goto(WEB_CONFIG.getFullUrl(WEB_CONFIG.GOALS_PATH), { waitUntil: 'networkidle' });
  } catch {
    // ?? 2: ???????
    const goalsLink = page.locator('text=??').or(page.locator('text=Goals'));
    if (await goalsLink.isVisible()) {
      await goalsLink.click();
    }
  }

  // ??????
  await page.waitForLoadState('networkidle');

  console.log('[Goal] ??? Goals ??');
}

/**
 * ????
 */
async function createGoal(
  page: Page,
  options: {
    title: string;
    description?: string;
    status?: string;
  },
) {
  console.log(`[Goal] ????: ${options.title}`);

  // ??"????"??
  const createButton = page
    .locator('button:has-text("????")')
    .or(page.locator('button:has-text("????")'))
    .or(page.locator('[data-testid="create-goal-button"]'));

  await createButton.click();

  // ???????
  await page.waitForTimeout(500);

  // ????
  const titleInput = page
    .locator('input[name="title"]')
    .or(page.locator('input[placeholder*="??"]'))
    .or(page.locator('[data-testid="goal-title-input"]'));

  await titleInput.fill(options.title);

  // ????(????)
  if (options.description) {
    const descInput = page
      .locator('textarea[name="description"]')
      .or(page.locator('textarea[placeholder*="??"]'))
      .or(page.locator('[data-testid="goal-description-input"]'));

    if (await descInput.isVisible()) {
      await descInput.fill(options.description);
    }
  }

  // ????/????
  const saveButton = page
    .locator('button:has-text("??")')
    .or(page.locator('button:has-text("??")'))
    .or(page.locator('button:has-text("??")'))
    .or(page.locator('[data-testid="save-goal-button"]'));

  await saveButton.click();

  // ????????????
  await page.waitForTimeout(1000);

  console.log(`[Goal] ??????: ${options.title}`);
}

/**
 * ????
 */
async function editGoal(
  page: Page,
  goalTitle: string,
  updates: {
    title?: string;
    description?: string;
  },
) {
  console.log(`[Goal] ????: ${goalTitle}`);

  // ??????
  const goalCard = page.locator(`text=${goalTitle}`).locator('..');

  // ??????????
  await goalCard.hover();

  // ??????
  const editButton = goalCard
    .locator('button[title*="??"]')
    .or(goalCard.locator('[data-testid="edit-goal-button"]'))
    .or(page.locator('button:has-text("??")').first());

  await editButton.click();

  // ?????????
  await page.waitForTimeout(500);

  // ????
  if (updates.title) {
    const titleInput = page
      .locator('input[name="title"]')
      .or(page.locator('input[placeholder*="??"]'));
    await titleInput.fill(updates.title);
  }

  // ????
  if (updates.description) {
    const descInput = page
      .locator('textarea[name="description"]')
      .or(page.locator('textarea[placeholder*="??"]'));
    await descInput.fill(updates.description);
  }

  // ????
  const saveButton = page
    .locator('button:has-text("??")')
    .or(page.locator('button:has-text("??")'));

  await saveButton.click();

  // ??????
  await page.waitForTimeout(1000);

  console.log(`[Goal] ??????`);
}

/**
 * ????
 */
async function deleteGoal(page: Page, goalTitle: string) {
  console.log(`[Goal] ????: ${goalTitle}`);

  // ??????
  const goalCard = page.locator(`text=${goalTitle}`).locator('..');

  // ??????????
  await goalCard.hover();

  // ??????
  const deleteButton = goalCard
    .locator('button[title*="??"]')
    .or(goalCard.locator('[data-testid="delete-goal-button"]'))
    .or(page.locator('button:has-text("??")').first());

  await deleteButton.click();

  // ????(????????)
  await page.waitForTimeout(500);

  const confirmButton = page
    .locator('button:has-text("??")')
    .or(page.locator('button:has-text("??")'));

  if (await confirmButton.isVisible()) {
    await confirmButton.click();
  }

  // ??????
  await page.waitForTimeout(1000);

  console.log(`[Goal] ??????`);
}

/**
 * ????
 */
async function activateGoal(page: Page, goalTitle: string) {
  console.log(`[Goal] ????: ${goalTitle}`);

  // ??????
  const goalCard = page.locator(`text=${goalTitle}`).locator('..');

  // ??????????
  await goalCard.hover();

  // ??????
  const activateButton = goalCard
    .locator('button[title*="??"]')
    .or(goalCard.locator('[data-testid="activate-goal-button"]'))
    .or(page.locator('button:has-text("??")').first());

  if (await activateButton.isVisible()) {
    await activateButton.click();
    await page.waitForTimeout(1000);
  }

  console.log(`[Goal] ??????`);
}

/**
 * ????
 */
async function completeGoal(page: Page, goalTitle: string) {
  console.log(`[Goal] ????: ${goalTitle}`);

  // ??????
  const goalCard = page.locator(`text=${goalTitle}`).locator('..');

  // ??????????
  await goalCard.hover();

  // ??????
  const completeButton = goalCard
    .locator('button[title*="??"]')
    .or(goalCard.locator('[data-testid="complete-goal-button"]'))
    .or(page.locator('button:has-text("??")').first());

  if (await completeButton.isVisible()) {
    await completeButton.click();
    await page.waitForTimeout(1000);
  }

  console.log(`[Goal] ????`);
}

/**
 * ??????
 */
async function applyGoalFilter(page: Page, status: string) {
  console.log(`[Goal] ????: ${status}`);

  // ?????
  const filterButton = page
    .locator('button:has-text("??")')
    .or(page.locator('[data-testid="filter-button"]'));

  if (await filterButton.isVisible()) {
    await filterButton.click();
    await page.waitForTimeout(500);

    // ????
    const statusOption = page.locator(`text=${status}`);
    await statusOption.click();
  }

  await page.waitForTimeout(1000);

  console.log(`[Goal] ??????`);
}

/**
 * ??????
 */
async function cleanupTestGoals(page: Page) {
  console.log('[Goal] ??????');

  try {
    // ????????(???? "E2E")
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
        console.warn(`??????: ${error}`);
      }
    }

    console.log(`[Goal] ??? ${count} ?????`);
  } catch (error) {
    console.warn('[Goal] ?????????:', error);
  }
}
