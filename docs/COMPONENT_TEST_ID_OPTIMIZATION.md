# 组件测试优化文档

## 优化概述

为提高组件可测试性，我们为关键 UI 元素添加了 data-testid 属性。

## 已优化组件

### Task 模块

#### TaskTemplateManagement.vue
- create-task-template-button
- create-first-task-template-button  
- view-dependency-graph-button
- delete-all-templates-button

#### TaskTemplateDialog.vue
- task-dialog-cancel-button
- task-dialog-save-button

#### BasicInfoSection.vue
- task-template-title-input
- task-template-description-input

#### TaskTemplateCard.vue
- task-card-edit-button
- task-card-delete-button
- task-card-pause-button
- task-card-resume-button
- task-card-activate-button

### Reminder 模块

#### ReminderDesktopView.vue
- create-reminder-template-button
- create-reminder-group-button
- refresh-reminders-button

#### TemplateDialog.vue
- reminder-dialog-close-button
- reminder-dialog-save-button

## 使用示例

推荐：
```typescript
await page.locator('[data-testid="create-task-template-button"]').click();
```

不推荐：
```typescript
await page.locator('button:has-text("创建")').click();
```

