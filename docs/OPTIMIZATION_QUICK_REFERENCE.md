# 模块优化 - 快速参考

## 📋 优化总览

```
✅ 4个模块优化完成
✅ 6个测试套件创建
✅ 32个E2E测试用例
✅ 4份文档撰写完成
```

## 🎯 标准对话框模式

### API 定义
```typescript
// 所有对话框组件必须实现
defineExpose({
  openForCreate(): void,        // 创建模式
  openForEdit(data: DTO): void, // 编辑模式
});
```

### 父组件调用
```vue
<template>
  <MyDialog ref="dialogRef" />
</template>

<script setup>
const dialogRef = ref();
dialogRef.value?.openForCreate();
dialogRef.value?.openForEdit(data);
</script>
```

### 内部实现
```vue
<script setup>
const visible = ref(false);
const editingData = ref(null);
const isEditing = computed(() => !!editingData.value);

function openForCreate() {
  editingData.value = null;
  visible.value = true;
}

function openForEdit(data) {
  editingData.value = { ...data };
  visible.value = true;
}

defineExpose({ openForCreate, openForEdit });
</script>
```

## 🧪 E2E 测试模板

### 基础结构
```typescript
import { test, expect } from '@playwright/test';

test.describe('Module CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // 登录并导航
    await page.goto('/');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.goto('/your-module');
  });

  test('should create', async ({ page }) => {
    const title = `Test ${Date.now()}`;
    await page.click('button:has-text("创建")');
    await page.fill('input[name="title"]', title);
    await page.click('button:has-text("保存")');
    await expect(page.locator(`text=${title}`)).toBeVisible();
  });

  test('should edit', async ({ page }) => {
    // 先创建，再编辑
  });

  test('should delete', async ({ page }) => {
    // 先创建，再删除
  });
});
```

### Helper 函数
```typescript
async function createTestItem(page, data) {
  await page.click('button:has-text("创建")');
  await page.fill('input[name="title"]', data.title);
  await page.click('button:has-text("保存")');
  await page.waitForTimeout(1000);
  return data;
}

async function cleanupTestItem(page, id) {
  try {
    const item = page.locator(`[data-id="${id}"]`);
    if (await item.isVisible({ timeout: 2000 })) {
      await item.locator('button:has-text("删除")').click();
      await page.click('button:has-text("确认")');
    }
  } catch (e) {
    console.log(`Cleanup: Item ${id} not found`);
  }
}
```

## 🚀 运行测试

### 全部测试
```bash
npx playwright test apps/web/e2e/
```

### 特定模块
```bash
npx playwright test apps/web/e2e/goal/
npx playwright test apps/web/e2e/schedule/
npx playwright test apps/web/e2e/task/
npx playwright test apps/web/e2e/reminder/
```

### UI 模式（推荐）
```bash
npx playwright test apps/web/e2e/ --ui
```

### 调试模式
```bash
npx playwright test apps/web/e2e/goal/ --debug
```

## 📊 模块对比

| 模块 | 重构 | 测试 | 评分 |
|------|------|------|------|
| Goal | ✅ | 11用例 | ⭐⭐⭐⭐⭐ |
| Schedule | ✅ | 11用例 | ⭐⭐⭐⭐⭐ |
| Task | ❌ | 5用例 | ⭐⭐⭐⭐⭐ |
| Reminder | ❌ | 5用例 | ⭐⭐⭐⭐ |

## ✅ 检查清单

创建新模块对话框时：

- [ ] 使用 `openForCreate()` 方法
- [ ] 使用 `openForEdit(data)` 方法
- [ ] 使用 `defineExpose()` 暴露方法
- [ ] 内部管理 `visible` 状态
- [ ] 内部管理 `editingData` 状态
- [ ] 提供 `isEditing` 计算属性
- [ ] 创建对应的 E2E 测试

E2E 测试检查：

- [ ] 创建测试用例
- [ ] 列表显示测试
- [ ] 编辑测试用例
- [ ] 删除测试用例
- [ ] 表单验证测试
- [ ] Helper 清理函数

## 📁 文件位置

### 对话框组件
```
apps/web/src/modules/{module}/presentation/components/dialogs/
```

### E2E 测试
```
apps/web/e2e/{module}/
```

### 文档
```
docs/
  ├── SCHEDULE_MODULE_OPTIMIZATION.md
  ├── TASK_REMINDER_MODULE_OPTIMIZATION.md
  ├── MODULE_OPTIMIZATION_SUMMARY.md
  └── OPTIMIZATION_EXECUTIVE_SUMMARY.md
```

## 🔍 常见问题

### Q: 为什么不用 v-model？
A: v-model 会导致状态分散在父子组件之间，难以维护和测试。组件自管理状态更清晰。

### Q: openForCreate 和 openForEdit 有什么区别？
A: `openForCreate` 清空表单数据，`openForEdit` 填充现有数据。语义明确，易于理解。

### Q: 为什么 Task 和 Reminder 不需要重构？
A: 它们已经采用了正确的模式，只需补充测试覆盖即可。

### Q: 测试为什么用 Date.now()？
A: 确保每次测试使用唯一标识符，避免测试数据冲突。

## 🎓 最佳实践

1. **组件自治**: 对话框自己管理状态
2. **方法暴露**: 用 `defineExpose` 明确 API
3. **语义命名**: 方法名清楚表达意图
4. **测试先行**: 新功能先写测试
5. **清理数据**: 测试后清理避免污染

## 🔗 参考链接

- [完整总结](./MODULE_OPTIMIZATION_SUMMARY.md)
- [执行摘要](./OPTIMIZATION_EXECUTIVE_SUMMARY.md)
- [Schedule优化](./SCHEDULE_MODULE_OPTIMIZATION.md)
- [Task&Reminder优化](./TASK_REMINDER_MODULE_OPTIMIZATION.md)

---

**快速开始**: `npx playwright test apps/web/e2e/ --ui`
