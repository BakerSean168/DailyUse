# STORY-027: 智能任务分解

## 📋 Story 概述

**Story ID**: STORY-027  
**Epic**: EPIC-006 (Smart Productivity)  
**优先级**: P1 (核心价值)  
**预估工时**: 3 天  
**状态**: 📋 Ready for Dev  
**前置依赖**: 现有 AI 模块 ✅

---

## 🎯 用户故事

**作为** DailyUse 用户  
**我希望** AI 能将我的目标自动分解为可执行的子任务  
**以便于** 快速开始行动而不用花时间思考如何拆分

---

## 📋 验收标准

### 功能验收 - 任务分解

- [ ] 用户可从目标详情页触发「AI 分解」
- [ ] AI 分析目标描述并生成 3-10 个子任务
- [ ] 子任务包含标题、描述、预估时长
- [ ] 用户可预览、编辑、选择性采纳
- [ ] 批量创建选中的子任务

### 功能验收 - 智能分析

- [ ] 识别任务依赖关系（A 需在 B 之前）
- [ ] 评估任务复杂度（简单/中等/复杂）
- [ ] 建议合理的时间线
- [ ] 检测潜在风险点

### 功能验收 - 用户体验

- [ ] 分解过程显示加载动画
- [ ] 分解结果支持拖拽排序
- [ ] 支持单个任务编辑后再创建
- [ ] 记住用户偏好的分解风格

### 技术验收

- [ ] 响应时间 < 10 秒
- [ ] 支持离线时显示提示
- [ ] Token 使用优化
- [ ] 错误时优雅降级

---

## 🔧 技术方案

### AI Prompt 设计

```typescript
interface TaskDecompositionPrompt {
  goalTitle: string;
  goalDescription: string;
  goalDeadline?: Date;
  existingTasks?: Task[];  // 避免重复
  userContext?: {
    workHoursPerDay: number;
    skillLevel: string;
  };
}

interface DecompositionResult {
  tasks: Array<{
    title: string;
    description: string;
    estimatedMinutes: number;
    complexity: 'simple' | 'medium' | 'complex';
    dependencies: string[];  // 依赖的任务 title
    suggestedOrder: number;
  }>;
  timeline: {
    totalEstimatedHours: number;
    suggestedStartDate: Date;
    suggestedEndDate: Date;
  };
  risks: Array<{
    description: string;
    mitigation: string;
  }>;
}
```

### 服务接口

```typescript
// packages/application-client/src/goal/services/TaskDecompositionService.ts
export class TaskDecompositionService {
  async decomposeGoal(
    goalId: string, 
    options?: DecompositionOptions
  ): Promise<DecompositionResult>;
  
  async createTasksFromDecomposition(
    goalId: string,
    selectedTasks: DecomposedTask[]
  ): Promise<Task[]>;
}
```

### UI 组件

```
┌─────────────────────────────────────────────────────┐
│  Goal: 学习 TypeScript 高级特性                      │
├─────────────────────────────────────────────────────┤
│  [🤖 AI 智能分解]                                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  AI 建议的任务：                                      │
│                                                      │
│  ☑ 1. 学习泛型基础概念 (30分钟) [简单]               │
│     └─ 理解泛型的基本语法和使用场景                   │
│                                                      │
│  ☑ 2. 练习泛型约束和条件类型 (1小时) [中等]          │
│     └─ 依赖: 任务1                                   │
│                                                      │
│  ☐ 3. 学习映射类型和模板字面量 (1小时) [复杂]        │
│     └─ 依赖: 任务2                                   │
│                                                      │
├─────────────────────────────────────────────────────┤
│  预计总时长: 2.5 小时  |  建议完成日期: 12月10日      │
├─────────────────────────────────────────────────────┤
│  [取消]                    [创建选中的 2 个任务]     │
└─────────────────────────────────────────────────────┘
```

---

## 📁 文件变更清单

### 新增文件

```
packages/application-client/src/goal/services/
  └── TaskDecompositionService.ts

packages/contracts/src/modules/goal/
  └── task-decomposition.types.ts

apps/desktop/src/renderer/components/goal/
  └── TaskDecompositionDialog.tsx
  └── DecomposedTaskList.tsx
  └── DecomposedTaskItem.tsx

apps/api/src/modules/ai/application/
  └── TaskDecompositionUseCase.ts
```

### 修改文件

```
apps/desktop/src/renderer/views/goal/GoalDetailView.tsx
  └── 添加「AI 分解」按钮

apps/api/src/modules/ai/interface/http/aiRoutes.ts
  └── POST /ai/decompose-goal
```

---

## 🧪 测试要点

### 单元测试

- TaskDecompositionService.decomposeGoal() 参数验证
- 分解结果解析正确性
- 依赖关系图生成

### 集成测试

- AI API 调用成功/失败场景
- 批量任务创建事务一致性
- 与现有任务的关联

### E2E 测试

- 完整分解流程
- 用户编辑后创建
- 取消操作

---

## 📝 注意事项

1. **Token 优化**：使用结构化输出减少 Token 消耗
2. **缓存策略**：相同目标短时间内重复请求使用缓存
3. **降级方案**：AI 不可用时提供手动拆分模板
4. **隐私保护**：目标内容发送前用户确认
