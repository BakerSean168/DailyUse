/**
 * Goal Edit E2E Test
 * 测试目标编辑功能
 */

import { test, expect } from '@playwright/test';

test.describe('Goal Edit Functionality', () => {
  const baseUrl = 'http://localhost:3001';
  const testEmail = 'test@example.com';
  const testPassword = 'Test123456!';

  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // 等待跳转到首页
    await page.waitForURL(`${baseUrl}/`);
    
    // 导航到目标列表页面
    await page.goto(`${baseUrl}/goals`);
    await page.waitForTimeout(2000); // 等待数据加载
  });

  test('should open edit dialog from goal card', async ({ page }) => {
    // 1. 查找第一个目标卡片的编辑按钮
    const editButton = page.locator('.goal-card').first().locator('button:has-text("编辑")');
    
    // 2. 点击编辑按钮
    await editButton.click();
    
    // 3. 验证对话框打开
    await expect(page.locator('.goal-dialog')).toBeVisible();
    
    // 4. 验证对话框标题为"编辑目标"
    await expect(page.locator('text=编辑目标')).toBeVisible();
    
    // 5. 验证目标名称已填充
    const titleInput = page.locator('input[label="目标"]').first();
    await expect(titleInput).not.toBeEmpty();
    
    // 6. 验证显示所有标签页（包括"关键结果"）
    await expect(page.locator('.v-tab:has-text("基本信息")')).toBeVisible();
    await expect(page.locator('.v-tab:has-text("关键结果")')).toBeVisible();
    await expect(page.locator('.v-tab:has-text("动机分析")')).toBeVisible();
    await expect(page.locator('.v-tab:has-text("规则设置")')).toBeVisible();
  });

  test('should edit goal title and save', async ({ page }) => {
    // 1. 打开编辑对话框
    const editButton = page.locator('.goal-card').first().locator('button:has-text("编辑")');
    await editButton.click();
    
    // 2. 等待对话框打开
    await expect(page.locator('.goal-dialog')).toBeVisible();
    
    // 3. 获取原始标题
    const titleInput = page.locator('input').filter({ hasText: '目标' }).first();
    const originalTitle = await titleInput.inputValue();
    
    // 4. 修改标题
    const newTitle = `${originalTitle} (已编辑)`;
    await titleInput.clear();
    await titleInput.fill(newTitle);
    
    // 5. 点击完成按钮
    await page.click('button:has-text("完成")');
    
    // 6. 等待对话框关闭
    await expect(page.locator('.goal-dialog')).not.toBeVisible();
    
    // 7. 刷新页面验证持久化
    await page.reload();
    await page.waitForTimeout(2000);
    
    // 8. 验证标题已更新
    await expect(page.locator(`.goal-card:has-text("${newTitle}")`)).toBeVisible();
  });

  test('should open edit dialog from goal detail page', async ({ page }) => {
    // 1. 点击第一个目标卡片查看详情
    await page.locator('.goal-card').first().locator('button:has-text("查看详情")').click();
    
    // 2. 等待详情页加载
    await page.waitForURL(/\/goals\/[a-f0-9-]+/);
    await page.waitForTimeout(1000);
    
    // 3. 点击编辑按钮（工具栏上的铅笔图标）
    await page.locator('button:has(svg.mdi-pencil)').click();
    
    // 4. 验证对话框打开
    await expect(page.locator('.goal-dialog')).toBeVisible();
    await expect(page.locator('text=编辑目标')).toBeVisible();
  });

  test('should cancel edit without saving', async ({ page }) => {
    // 1. 打开编辑对话框
    const editButton = page.locator('.goal-card').first().locator('button:has-text("编辑")');
    await editButton.click();
    
    // 2. 获取原始标题
    const titleInput = page.locator('input').filter({ hasText: '目标' }).first();
    const originalTitle = await titleInput.inputValue();
    
    // 3. 修改标题
    await titleInput.clear();
    await titleInput.fill('这个修改应该被取消');
    
    // 4. 点击取消按钮
    await page.click('button:has-text("取消")');
    
    // 5. 验证对话框关闭
    await expect(page.locator('.goal-dialog')).not.toBeVisible();
    
    // 6. 验证标题未更改
    await expect(page.locator(`.goal-card:has-text("${originalTitle}")`)).toBeVisible();
  });
});
