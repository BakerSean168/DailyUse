# Story 2.1: Goal CRUD Basics (目标 CRUD 基础)

> **Story ID**: 2.1  
> **Epic**: Epic 2 - Goal Module (目标管理)  
> **状态**: ready-for-dev  
> **优先级**: P0 (Critical)  
> **预估工作量**: 5 Story Points  
> **创建时间**: 2025-10-29  

---

## 📋 Story 概述

实现基于 OKR 的目标管理基础功能，包括目标的创建、查看、更新和删除操作，支持目标层级关系和时间周期管理。

### 用户故事

**作为** 已登录用户  
**我想要** 创建、查看、更新和删除我的目标  
**以便于** 我能够规划和追踪个人目标

---

## ✅ 验收标准 (Acceptance Criteria)

### AC1: 创建目标
```gherkin
Given 我是已登录用户
When 我创建目标 "2025 Q1 技能提升" 并设置:
  - 描述: "学习前端架构和 DDD"
  - 开始日期: 2025-01-01
  - 目标日期: 2025-03-31
  - 重要性: HIGH
  - 紧急度: MEDIUM
  - 标签: ["学习", "技能"]
Then 目标创建成功
And 目标状态为 "pending"
And 返回包含 uuid 的目标对象
```

### AC2: 查看目标列表
```gherkin
Given 我已创建 3 个目标
When 我请求获取我的所有目标
Then 返回 3 个目标的列表
And 每个目标包含基本信息和状态
```

### AC3: 查看目标详情
```gherkin
Given 目标 "技能提升" 已存在
When 我请求该目标详情
Then 返回完整的目标信息
And 包含所有字段（标题、描述、日期、状态等）
```

### AC4: 更新目标
```gherkin
Given 目标 "技能提升" 已存在
When 我更新目标标题为 "2025 Q1 全栈技能提升"
And 更新描述为 "深入学习前后端架构"
Then 更新成功
And updatedAt 时间戳已更新
```

### AC5: 删除目标
```gherkin
Given 目标 "技能提升" 已存在
When 我删除该目标
Then 删除成功
And 该目标不再出现在列表中
```

### AC6: 支持父子目标层级
```gherkin
Given 父目标 "2025 年度规划" 已存在
When 我创建子目标 "Q1 技能提升" 并设置 parentGoalUuid
Then 子目标创建成功
And 子目标正确关联到父目标
```

---

## 🎯 技术实现要点

### 1. 后端实现 (API)

#### 现有代码分析
✅ **已有组件**:
- `Goal` 聚合根 (`packages/domain-server/src/goal/aggregates/Goal.ts`)
- `GoalApplicationService` (`apps/api/src/modules/goal/application/services/GoalApplicationService.ts`)
- `GoalController` (`apps/api/src/modules/goal/interface/http/GoalController.ts`)
- `goalRoutes.ts` 路由配置
- Prisma `goal` 表 schema

#### 需要完善的功能
由于大部分基础 CRUD 已实现，本 Story 主要进行**验证、测试和文档完善**：

**任务列表**:
1. ✅ 验证现有 API 端点是否完整:
   - `POST /api/goals` - 创建目标
   - `GET /api/goals` - 获取当前用户所有目标
   - `GET /api/goals/:uuid` - 获取目标详情
   - `PATCH /api/goals/:uuid` - 更新目标
   - `DELETE /api/goals/:uuid` - 删除目标

2. ⚠️ 检查需要补充的功能:
   - 确保 `authMiddleware` 已应用到所有 Goal 路由
   - 验证目标归属权限（用户只能操作自己的目标）
   - 添加字段验证（Zod schema）

3. 🧪 编写集成测试 (Integration Tests):
   - 创建目标（成功场景）
   - 创建目标（验证失败：缺少必填字段）
   - 获取目标列表（包含分页）
   - 获取目标详情（成功/不存在）
   - 更新目标（成功/权限拒绝）
   - 删除目标（成功/权限拒绝）
   - 父子目标层级关系

### 2. 前端实现 (Web)

#### 需要创建的组件

**路由** (`apps/web/src/router/index.ts`):
```typescript
{
  path: '/goals',
  component: () => import('@/layouts/AppLayout.vue'),
  children: [
    {
      path: '',
      name: 'GoalList',
      component: () => import('@/modules/goal/views/GoalListView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: ':uuid',
      name: 'GoalDetail',
      component: () => import('@/modules/goal/views/GoalDetailView.vue'),
      meta: { requiresAuth: true }
    }
  ]
}
```

**视图组件**:
1. `GoalListView.vue` - 目标列表页
   - 展示所有目标卡片
   - 支持创建新目标按钮
   - 支持状态筛选（pending/completed/archived）
   - 支持搜索

2. `GoalDetailView.vue` - 目标详情页
   - 显示目标完整信息
   - 编辑模式切换
   - 删除确认对话框

3. `GoalFormDialog.vue` - 目标表单对话框
   - 创建/编辑目标表单
   - 字段验证
   - 日期选择器
   - 标签输入

**状态管理** (`apps/web/src/modules/goal/stores/goalStore.ts`):
```typescript
import { defineStore } from 'pinia';

export const useGoalStore = defineStore('goal', {
  state: () => ({
    goals: [] as Goal[],
    currentGoal: null as Goal | null,
    loading: false,
  }),
  actions: {
    async fetchGoals() { /* ... */ },
    async fetchGoalDetail(uuid: string) { /* ... */ },
    async createGoal(data: CreateGoalRequest) { /* ... */ },
    async updateGoal(uuid: string, data: UpdateGoalRequest) { /* ... */ },
    async deleteGoal(uuid: string) { /* ... */ },
  },
});
```

**API Client** (`apps/web/src/modules/goal/api/goalApiClient.ts`):
```typescript
export const goalApiClient = {
  getAll: () => apiClient.get<Goal[]>('/goals'),
  getById: (uuid: string) => apiClient.get<Goal>(`/goals/${uuid}`),
  create: (data: CreateGoalRequest) => apiClient.post<Goal>('/goals', data),
  update: (uuid: string, data: UpdateGoalRequest) => 
    apiClient.patch<Goal>(`/goals/${uuid}`, data),
  delete: (uuid: string) => apiClient.delete(`/goals/${uuid}`),
};
```

---

## 🔧 技术栈

### 后端
- **Framework**: Express.js + TypeScript
- **DDD Architecture**: Aggregate Root (Goal), Application Service, Domain Service
- **Database**: PostgreSQL (Prisma ORM)
- **Validation**: Zod
- **Auth**: JWT (authMiddleware)

### 前端
- **Framework**: Vue 3 + TypeScript
- **UI Library**: Vuetify 3
- **State Management**: Pinia
- **Router**: Vue Router
- **API Client**: Axios

---

## 🧪 测试策略

### 后端测试
1. **Integration Tests** (`apps/api/src/modules/goal/tests/goal-crud.integration.test.ts`):
   - 完整的 CRUD 流程测试
   - 权限验证测试
   - 父子目标关联测试

2. **测试场景**:
   - ✅ 创建目标成功
   - ✅ 创建目标失败（缺少必填字段）
   - ✅ 获取目标列表（分页）
   - ✅ 获取目标详情（存在/不存在）
   - ✅ 更新目标成功
   - ✅ 更新他人目标（权限拒绝）
   - ✅ 删除目标成功
   - ✅ 删除他人目标（权限拒绝）
   - ✅ 创建子目标（父子关联）

### 前端测试
1. **Component Tests** (Vitest):
   - 表单组件验证
   - 列表渲染测试

2. **E2E Tests** (Playwright):
   - 创建目标完整流程
   - 编辑目标流程
   - 删除目标流程

---

## 📦 交付清单

### 后端 (Backend)
- [ ] 验证所有 CRUD API 端点功能完整
- [ ] 添加 authMiddleware 到 Goal 路由
- [ ] 添加 Zod 验证 schema
- [ ] 添加权限验证（用户只能操作自己的目标）
- [ ] 编写集成测试（至少 8 个测试用例）
- [ ] API 测试文档（curl 命令示例）

### 前端 (Frontend)
- [ ] 创建 goalApiClient.ts
- [ ] 创建 useGoal composable
- [ ] 创建 goalStore.ts (Pinia)
- [ ] 创建 GoalListView.vue
- [ ] 创建 GoalDetailView.vue
- [ ] 创建 GoalFormDialog.vue
- [ ] 添加路由配置
- [ ] 组件测试

### 文档
- [ ] API 文档（Swagger）
- [ ] 实施报告 (2-1-goal-crud-implementation-report.md)

---

## �� 实施步骤

### Step 1: 后端验证与完善 (2h)
1. 验证现有 Goal CRUD API 功能
2. 添加 authMiddleware（如果未添加）
3. 添加 Zod 验证 schema
4. 添加权限验证逻辑

### Step 2: 后端测试 (2h)
1. 编写集成测试文件
2. 测试所有 CRUD 场景
3. 测试权限验证
4. 测试父子目标关联

### Step 3: 前端 API Client (1h)
1. 创建 goalApiClient.ts
2. 创建 useGoal composable
3. 创建 goalStore.ts

### Step 4: 前端 UI 组件 (3h)
1. 创建 GoalListView.vue
2. 创建 GoalFormDialog.vue
3. 创建 GoalDetailView.vue
4. 添加路由配置

### Step 5: 前端测试与文档 (1h)
1. 组件测试
2. E2E 测试
3. 实施报告

---

## 🎉 完成定义 (Definition of Done)

- [x] 所有验收标准通过
- [ ] 后端集成测试覆盖率 > 80%
- [ ] 前端组件测试通过
- [ ] API 文档完整
- [ ] 代码 Review 通过
- [ ] 实施报告已创建
- [ ] 在 sprint-status.yaml 中标记为 "done"

---

**备注**: 本 Story 基于现有 Goal 模块代码，主要工作是验证、测试和文档完善。大部分 CRUD 逻辑已存在。

