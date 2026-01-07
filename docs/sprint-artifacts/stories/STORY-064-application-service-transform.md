# STORY-064: ApplicationService 添加 DTO→Entity 转换

**Story ID**: STORY-064  
**Epic**: EPIC-015 Desktop Architecture Alignment  
**Phase**: 1/6  
**Priority**: P0 (Critical)  
**Estimated**: 2 hours  
**Status**: BACKLOG

---

## 📌 Story Overview

重构 `TaskApplicationService`，使其从 IPC 获取的 DTO 数据转换为 Entity 对象后再返回，与 Web 应用的模式保持一致。

## 🎯 Acceptance Criteria

- [ ] 导入 `TaskTemplate`, `TaskInstance` from `@dailyuse/domain-client/task`
- [ ] 所有返回 DTO 的方法添加 `.fromClientDTO()` 转换
- [ ] 返回类型从 `TaskTemplateClientDTO` 改为 `TaskTemplate`
- [ ] 返回类型从 `TaskInstanceClientDTO` 改为 `TaskInstance`
- [ ] 单例实例正常工作
- [ ] TypeScript 编译无错误

## 📁 Files to Modify

```
apps/desktop/src/renderer/modules/task/application/services/
└── TaskApplicationService.ts  ← PRIMARY
```

## 🔧 Technical Details

### Current Implementation (Problem)

```typescript
async listTemplates(): Promise<TaskTemplateClientDTO[]> {
  return listTaskTemplates();  // ❌ 直接返回 DTO
}

async getTemplate(templateId: string): Promise<TaskTemplateClientDTO | null> {
  try {
    return await getTaskTemplate(templateId);  // ❌ 直接返回 DTO
  } catch {
    return null;
  }
}
```

### Target Implementation

```typescript
import { TaskTemplate, TaskInstance } from '@dailyuse/domain-client/task';

async listTemplates(): Promise<TaskTemplate[]> {
  const dtos = await listTaskTemplates();
  return dtos.map(dto => TaskTemplate.fromClientDTO(dto));  // ✅ 转换为 Entity
}

async getTemplate(templateId: string): Promise<TaskTemplate | null> {
  try {
    const dto = await getTaskTemplate(templateId);
    return TaskTemplate.fromClientDTO(dto);  // ✅ 转换为 Entity
  } catch {
    return null;
  }
}
```

### Methods to Update

| Method | Current Return | Target Return |
|--------|---------------|---------------|
| `listTemplates()` | `TaskTemplateClientDTO[]` | `TaskTemplate[]` |
| `getTemplate()` | `TaskTemplateClientDTO \| null` | `TaskTemplate \| null` |
| `createTemplate()` | `TaskTemplateClientDTO` | `TaskTemplate` |
| `updateTemplate()` | `any` | `TaskTemplate` |
| `activateTemplate()` | `any` | `TaskTemplate` |
| `pauseTemplate()` | `TaskTemplateClientDTO` | `TaskTemplate` |
| `archiveTemplate()` | `TaskTemplateClientDTO` | `TaskTemplate` |
| `listInstances()` | `TaskInstanceClientDTO[]` | `TaskInstance[]` |
| `getInstance()` | `TaskInstanceClientDTO \| null` | `TaskInstance \| null` |
| `startInstance()` | `TaskInstanceClientDTO` | `TaskInstance` |
| `completeInstance()` | `any` | `TaskInstance` |
| `skipInstance()` | `any` | `TaskInstance` |
| `getInstancesByDateRange()` | `TaskInstanceClientDTO[]` | `TaskInstance[]` |

## 📚 Reference

**Web 正确实现**: 
- [TaskTemplateApplicationService.ts](../../apps/web/src/modules/task/application/services/TaskTemplateApplicationService.ts)

## ✅ Definition of Done

1. 所有方法返回 Entity 类型
2. TypeScript 编译通过
3. 不破坏现有调用方（Hook 层）
4. 准备好进入 Phase 2

---

## 📝 Notes

- 此 Story 完成后，Hook 层会收到 Entity 而非 DTO
- 下一步 (STORY-065) 将更新 Store 类型
- 确保 `@dailyuse/domain-client/task` 正确导出 `TaskTemplate.fromClientDTO()` 静态方法
