/**
 * Task Template CRUD E2E Test
 * 测试任务模板的创建、读取、更新、删除功能
 */

import { test, expect } from '@playwright/test';

test.describe('Task Template CRUD Operations', () => {
  const baseUrl = 'http://localhost:3001';
  const testEmail = 'test@example.com';
  const testPassword = 'Test123456!';

  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // 等待跳转
    await page.waitForURL(`${baseUrl}/`);
    await page.waitForTimeout(1000);
    
    // 导航到任务模板页面
    await page.goto(`${baseUrl}/tasks/templates`);
    await page.waitForTimeout(2000);
  });

  test('should create a new task template', async ({ page }) => {
    // 1. 点击创建按钮
    const createButton = page.locator('button:has-text("创建")').or(
      page.locator('button:has-text("新建模板")')
    ).first();
    await createButton.click();
    
    // 2. 等待对话框打开
    await expect(page.locator('text=创建任务模板').or(
      page.locator('text=新建任务模板')
    )).toBeVisible({ timeout: 5000 });
    
    // 3. 填写表单
    const timestamp = Date.now();
    const templateTitle = `E2E Test Template ${timestamp}`;
    
    // 填写标题
    const titleInput = page.locator('input[label="标题"]').or(
      page.locator('input[placeholder*="标题"]')
    ).first();
    await titleInput.fill(templateTitle);
    
    // 填写描述
    const descInput = page.locator('textarea[label="描述"]').or(
      page.locator('textarea[placeholder*="描述"]')
    ).first();
    await descInput.fill('This is an E2E test task template');
    
    // 4. 提交表单
    await page.click('button:has-text("保存")');
    
    // 5. 验证成功提示
    await expect(page.locator('text=创建成功').or(
      page.locator('text=保存成功')
    )).toBeVisible({ timeout: 5000 });
    
    // 6. 验证模板出现在列表中
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${templateTitle}`)).toBeVisible();
    
    // 清理
    await cleanupTestTemplate(page, templateTitle);
  });

  test('should display task template list', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator('text=任务模板').or(
      page.locator('text=模板管理')
    )).toBeVisible();
    
    // 验证有创建按钮
    const createButton = page.locator('button:has-text("创建")').or(
      page.locator('button:has-text("新建")')
    ).first();
    await expect(createButton).toBeVisible();
  });

  test('should edit an existing task template', async ({ page }) => {
    // 1. 创建测试模板
    const timestamp = Date.now();
    const originalTitle = `E2E Edit Test ${timestamp}`;
    await createTestTemplate(page, originalTitle);
    
    // 2. 查找并点击编辑按钮
    const templateCard = page.locator(`text=${originalTitle}`).locator('..').locator('..');
    await templateCard.locator('button:has-text("编辑")').or(
      templateCard.locator('button:has(svg.mdi-pencil)')
    ).first().click();
    
    // 3. 等待编辑对话框打开
    await expect(page.locator('text=编辑任务模板').or(
      page.locator('text=编辑模板')
    )).toBeVisible({ timeout: 5000 });
    
    // 4. 修改标题
    const updatedTitle = `${originalTitle} (Updated)`;
    const titleInput = page.locator('input[label="标题"]').or(
      page.locator('input[placeholder*="标题"]')
    ).first();
    await titleInput.clear();
    await titleInput.fill(updatedTitle);
    
    // 5. 保存
    await page.click('button:has-text("保存")');
    
    // 6. 验证成功提示
    await expect(page.locator('text=更新成功').or(
      page.locator('text=保存成功')
    )).toBeVisible({ timeout: 5000 });
    
    // 7. 验证更新后的标题显示
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${updatedTitle}`)).toBeVisible();
    
    // 清理
    await cleanupTestTemplate(page, updatedTitle);
  });

  test('should delete a task template', async ({ page }) => {
    // 1. 创建测试模板
    const timestamp = Date.now();
    const templateTitle = `E2E Delete Test ${timestamp}`;
    await createTestTemplate(page, templateTitle);
    
    // 2. 查找并点击删除按钮
    const templateCard = page.locator(`text=${templateTitle}`).locator('..').locator('..');
    await templateCard.locator('button:has-text("删除")').or(
      templateCard.locator('button:has(svg.mdi-delete)')
    ).first().click();
    
    // 3. 确认删除
    const confirmButton = page.locator('button:has-text("确认")').or(
      page.locator('button:has-text("删除")')
    ).last();
    await confirmButton.click();
    
    // 4. 验证删除成功
    await expect(page.locator('text=删除成功')).toBeVisible({ timeout: 5000 });
    
    // 5. 验证模板不再显示
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${templateTitle}`)).not.toBeVisible();
  });

  test('should validate form fields', async ({ page }) => {
    // 1. 打开创建对话框
    const createButton = page.locator('button:has-text("创建")').or(
      page.locator('button:has-text("新建模板")')
    ).first();
    await createButton.click();
    
    // 2. 尝试不填写必填项提交
    await page.click('button:has-text("保存")');
    
    // 3. 验证错误提示
    await expect(page.locator('text=标题不能为空').or(
      page.locator('text=必填')
    )).toBeVisible({ timeout: 3000 });
  });
});

// ===== Helper Functions =====

async function createTestTemplate(page: any, title: string) {
  const createButton = page.locator('button:has-text("创建")').or(
    page.locator('button:has-text("新建模板")')
  ).first();
  await createButton.click();
  
  await expect(page.locator('text=创建任务模板').or(
    page.locator('text=新建任务模板')
  )).toBeVisible({ timeout: 5000 });
  
  const titleInput = page.locator('input[label="标题"]').or(
    page.locator('input[placeholder*="标题"]')
  ).first();
  await titleInput.fill(title);
  
  await page.click('button:has-text("保存")');
  await expect(page.locator('text=创建成功').or(
    page.locator('text=保存成功')
  )).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(1000);
}

async function cleanupTestTemplate(page: any, title: string) {
  try {
    const templateCard = page.locator(`text=${title}`).locator('..').locator('..');
    const deleteButton = templateCard.locator('button:has-text("删除")').or(
      templateCard.locator('button:has(svg.mdi-delete)')
    ).first();
    
    if (await deleteButton.isVisible({ timeout: 2000 })) {
      await deleteButton.click();
      const confirmButton = page.locator('button:has-text("确认")').or(
        page.locator('button:has-text("删除")')
      ).last();
      await confirmButton.click();
      await page.waitForTimeout(1000);
    }
  } catch (error) {
    console.log('Cleanup failed, test data may remain:', error);
  }
}
