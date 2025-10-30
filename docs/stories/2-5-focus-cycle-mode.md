# Story 2-5: 专注周期聚焦模式 (Focus Cycle Mode)

## 📋 Story 信息

- **Story ID**: 2-5
- **Story 名称**: 专注周期聚焦模式
- **Epic**: Epic 2 - Goal Module (目标管理)
- **优先级**: P0 (高优先级)
- **预估工作量**: 8 SP
- **状态**: backlog → in-progress
- **负责人**: Dev Team
- **创建日期**: 2025-10-30
- **完成目标日期**: 2025-11-06 (1-1.5周)

---

## 🎯 业务价值

### 问题陈述
在目标管理中，用户常常面临"目标太多，无法聚焦"的困扰：
- ❌ 同时追踪 10+ 个目标，注意力分散
- ❌ 紧急目标被常规目标干扰，无法聚焦
- ❌ 在冲刺阶段（如季度末、项目关键期）需要临时聚焦少数关键目标
- ❌ 其他非关键目标在 UI 中占据视觉空间，造成干扰

### 解决方案
实现专注周期聚焦模式，让用户可以临时开启聚焦，只显示 1-3 个关键目标，隐藏其他目标，减少视觉干扰。

### 用户价值
- ✅ 一键开启聚焦模式，UI 中只显示选中的关键目标
- ✅ 支持设置聚焦周期（本周、本月、自定义时间段）
- ✅ 聚焦期间其他目标自动隐藏，减少视觉干扰
- ✅ 聚焦结束后自动恢复，无需手动调整

---

## ✅ 验收标准 (Acceptance Criteria)

### AC1: 开启聚焦模式
```gherkin
Given 用户有 5 个活跃目标
When 用户点击"聚焦模式"按钮
And 选择 2 个聚焦目标 (goal-1, goal-2)
And 设置聚焦周期为"本月" (2025-10-01 ~ 2025-10-31)
And 点击"开启聚焦"
Then 系统应创建 FocusMode 记录
And 用户的 activeFocusMode 应设置为此 FocusMode
And 目标列表应只显示 goal-1 和 goal-2
And 顶部应显示聚焦状态栏 "🎯 聚焦模式（剩余 X 天）"
And 其他 3 个目标应被隐藏
```

### AC2: 聚焦模式下的 UI 行为
```gherkin
Given 用户在聚焦模式下（已选择 2 个目标）
When 用户查看目标列表
Then 应只显示 2 个聚焦目标
And 应显示聚焦状态栏
And 应有"查看全部"按钮
When 用户点击"查看全部"
Then 应临时显示所有 5 个目标
And 聚焦目标应高亮或置顶
And 非聚焦目标应灰色显示
```

### AC3: 调整聚焦周期
```gherkin
Given 用户在聚焦模式下
And 聚焦结束时间为 2025-10-31
When 用户点击聚焦状态栏
And 点击"延长聚焦"
And 选择新结束时间 "2025-11-15"
Then FocusMode 的 endTime 应更新为 2025-11-15 23:59:59
And 聚焦状态栏应显示新的剩余天数
```

### AC4: 提前结束聚焦
```gherkin
Given 用户在聚焦模式下
When 用户点击聚焦状态栏
And 点击"提前结束"
And 确认退出聚焦模式
Then FocusMode 的 isActive 应变为 false
And 所有目标应恢复显示
And 聚焦历史应创建一条记录
```

### AC5: 聚焦周期自动结束
```gherkin
Given 用户在聚焦模式下
And 聚焦结束时间为 2025-10-31 23:59:59
When 时间到达 2025-11-01 00:00:00
And 系统执行定时任务
Then FocusMode 的 isActive 应变为 false
And 所有目标应恢复显示
And 应创建聚焦历史记录
And 应发送通知给用户
```

---

## 📐 技术实现

### MVP 范围 (1-1.5 周)

#### 1. Contracts 层
**文件**: `packages/contracts/src/modules/goal/value-objects/FocusMode.ts`

```typescript
/**
 * 聚焦模式配置
 */
export interface FocusModeServerDTO {
  uuid: string;
  accountUuid: string;
  focusedGoalUuids: string[]; // 聚焦的目标 UUID 列表 (1-3个)
  startTime: number; // 聚焦开始时间 (timestamp)
  endTime: number; // 聚焦结束时间 (timestamp)
  hiddenGoalsMode: 'hide' | 'dim' | 'collapse'; // 隐藏模式
  isActive: boolean; // 是否激活
  actualEndTime?: number | null; // 实际结束时间（提前结束时记录）
  createdAt: number;
  updatedAt: number;
}

export interface FocusModeClientDTO {
  uuid: string;
  accountUuid: string;
  focusedGoalUuids: string[];
  startTime: number;
  endTime: number;
  isActive: boolean;
  remainingDays: number; // 计算属性：剩余天数
}

/**
 * 开启聚焦请求
 */
export interface ActivateFocusModeRequest {
  focusedGoalUuids: string[]; // 1-3个目标
  endTime: number; // 结束时间
  hiddenGoalsMode?: 'hide' | 'dim' | 'collapse'; // 默认 hide
}

/**
 * 延长聚焦请求
 */
export interface ExtendFocusModeRequest {
  newEndTime: number;
}
```

#### 2. Domain 层
**文件**: `packages/domain-server/src/goal/value-objects/FocusMode.ts`

```typescript
/**
 * 聚焦模式值对象
 */
export class FocusMode {
  constructor(
    readonly uuid: string,
    readonly accountUuid: string,
    readonly focusedGoalUuids: string[],
    readonly startTime: number,
    readonly endTime: number,
    readonly hiddenGoalsMode: 'hide' | 'dim' | 'collapse',
    readonly isActive: boolean,
    readonly actualEndTime: number | null,
    readonly createdAt: number,
    readonly updatedAt: number,
  ) {
    this.validate();
  }

  private validate(): void {
    // 验证聚焦目标数量 (1-3个)
    if (this.focusedGoalUuids.length < 1 || this.focusedGoalUuids.length > 3) {
      throw new Error('聚焦目标数量必须在 1-3 个之间');
    }

    // 验证时间范围
    if (this.endTime <= this.startTime) {
      throw new Error('结束时间必须晚于开始时间');
    }
  }

  /**
   * 计算剩余天数
   */
  getRemainingDays(): number {
    const now = Date.now();
    const remaining = this.endTime - now;
    return Math.ceil(remaining / (24 * 60 * 60 * 1000));
  }

  /**
   * 检查是否已过期
   */
  isExpired(): boolean {
    return Date.now() > this.endTime;
  }

  /**
   * 延长聚焦周期
   */
  extend(newEndTime: number): FocusMode {
    if (newEndTime <= this.endTime) {
      throw new Error('新结束时间必须晚于当前结束时间');
    }

    return new FocusMode(
      this.uuid,
      this.accountUuid,
      this.focusedGoalUuids,
      this.startTime,
      newEndTime, // 更新结束时间
      this.hiddenGoalsMode,
      this.isActive,
      this.actualEndTime,
      this.createdAt,
      Date.now(), // updatedAt
    );
  }

  /**
   * 提前结束聚焦
   */
  deactivate(): FocusMode {
    return new FocusMode(
      this.uuid,
      this.accountUuid,
      this.focusedGoalUuids,
      this.startTime,
      this.endTime,
      this.hiddenGoalsMode,
      false, // isActive = false
      Date.now(), // actualEndTime
      this.createdAt,
      Date.now(), // updatedAt
    );
  }

  toServerDTO(): GoalContracts.FocusModeServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      focusedGoalUuids: this.focusedGoalUuids,
      startTime: this.startTime,
      endTime: this.endTime,
      hiddenGoalsMode: this.hiddenGoalsMode,
      isActive: this.isActive,
      actualEndTime: this.actualEndTime,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
```

#### 3. Application 层
**文件**: `apps/api/src/modules/goal/application/services/FocusModeApplicationService.ts`

**方法列表**:
- `activateFocusMode(accountUuid, request)` - 开启聚焦
- `deactivateFocusMode(accountUuid)` - 退出聚焦
- `extendFocusMode(accountUuid, request)` - 延长聚焦
- `getActiveFocusMode(accountUuid)` - 获取当前聚焦状态
- `checkAndDeactivateExpired()` - 定时任务：检查并自动结束过期聚焦

#### 4. Infrastructure 层

**Prisma Schema**:
```prisma
model FocusMode {
  uuid              String   @id
  accountUuid       String
  focusedGoalUuids  String[] // 数组类型
  startTime         BigInt
  endTime           BigInt
  hiddenGoalsMode   String   // 'hide' | 'dim' | 'collapse'
  isActive          Boolean  @default(true)
  actualEndTime     BigInt?
  createdAt         BigInt
  updatedAt         BigInt
  
  account           Account  @relation(fields: [accountUuid], references: [uuid], onDelete: Cascade)
  
  @@index([accountUuid])
  @@index([isActive])
  @@index([endTime])
}
```

**Repository**:
- `PrismaFocusModeRepository.ts` - CRUD + 查询激活的聚焦模式

#### 5. API 层

**端点列表**:
1. `POST /api/focus-mode/activate` - 开启聚焦模式
2. `PUT /api/focus-mode/extend` - 延长聚焦周期
3. `DELETE /api/focus-mode/deactivate` - 提前结束聚焦
4. `GET /api/focus-mode/active` - 获取当前激活的聚焦模式

**Controller**: `FocusModeController.ts`
**Routes**: `focusModeRoutes.ts`

#### 6. 前端实现

**API Client**:
- `focusModeApiClient.ts` - 封装 HTTP 请求

**Application Service**:
- `FocusModeWebApplicationService.ts` - 业务协调层

**Composable**:
- `useFocusMode.ts` - Vue 3 Composition API
  - `activeFocusMode` ref - 当前聚焦状态
  - `activateFocusMode()` - 开启聚焦
  - `deactivateFocusMode()` - 退出聚焦
  - `extendFocusMode()` - 延长聚焦
  - `fetchActiveFocusMode()` - 获取当前聚焦状态

**UI 组件**:
- `FocusModePanel.vue` - 聚焦配置面板（对话框）
- `FocusModeStatusBar.vue` - 聚焦状态栏（顶部）
- `GoalListView.vue` - 修改目标列表，支持聚焦过滤

**Store 集成** (Pinia):
```typescript
// goalStore.ts
export const useGoalStore = defineStore('goal', () => {
  const activeFocusMode = ref<FocusModeClientDTO | null>(null);
  
  // 计算属性：过滤聚焦目标
  const visibleGoals = computed(() => {
    if (!activeFocusMode.value?.isActive) {
      return goals.value; // 显示所有目标
    }
    return goals.value.filter(goal => 
      activeFocusMode.value!.focusedGoalUuids.includes(goal.uuid)
    );
  });

  return { activeFocusMode, visibleGoals };
});
```

#### 7. 定时任务
**文件**: `apps/api/src/modules/goal/infrastructure/jobs/FocusModeExpirationJob.ts`

```typescript
/**
 * 聚焦模式过期检查定时任务
 * 每小时执行一次，检查并自动结束过期的聚焦模式
 */
export class FocusModeExpirationJob {
  async execute(): Promise<void> {
    const service = await FocusModeApplicationService.getInstance();
    await service.checkAndDeactivateExpired();
  }
}

// Cron 配置: '0 * * * *' (每小时执行一次)
```

---

## 📦 Implementation Phases

### Phase 1: 后端基础 ✅
- [ ] 创建 Contracts (FocusMode DTO)
- [ ] 创建 Domain 层 (FocusMode 值对象)
- [ ] 创建 Application Service
- [ ] 创建 Repository (Prisma)
- [ ] Prisma Schema Migration
- [ ] 单元测试

### Phase 2: API 层 ✅
- [ ] 创建 Controller
- [ ] 创建 Routes
- [ ] 集成测试
- [ ] Swagger 文档

### Phase 3: 前端基础 ✅
- [ ] 创建 API Client
- [ ] 创建 Application Service
- [ ] 创建 Composable (useFocusMode)
- [ ] 集成 Pinia Store

### Phase 4: UI 组件 ✅
- [ ] FocusModePanel.vue (聚焦配置对话框)
- [ ] FocusModeStatusBar.vue (顶部状态栏)
- [ ] 修改 GoalListView.vue (支持聚焦过滤)
- [ ] 样式和动画

### Phase 5: 定时任务 ✅
- [ ] 创建 FocusModeExpirationJob
- [ ] 注册 Cron 任务
- [ ] 测试自动过期功能

### Phase 6: 测试 & 验收 ✅
- [ ] 后端单元测试 (>=80% 覆盖率)
- [ ] 后端集成测试
- [ ] 前端单元测试
- [ ] E2E 测试 (5 个验收场景)
- [ ] 手动功能测试
- [ ] 性能测试

---

## 📊 Definition of Done

- [ ] 所有 5 个验收标准通过
- [ ] 后端单元测试覆盖率 >=80%
- [ ] 后端集成测试通过
- [ ] API 端点全部正常工作
- [ ] 前端 UI 功能完整
- [ ] E2E 测试通过
- [ ] 定时任务正常运行
- [ ] 代码审查通过
- [ ] 文档更新完成
- [ ] 无 Critical/High 级别 Bug
- [ ] Sprint Status 更新为 `done`

---

## 📝 Notes

### 技术要点
1. **聚焦目标限制**: 1-3 个目标，超过则显示警告
2. **时间选择**: 支持本周/本月/自定义（DatePicker）
3. **隐藏模式**: MVP 只实现 `hide`，MMP 可扩展 `dim` / `collapse`
4. **定时任务**: Cron 每小时检查一次过期
5. **状态同步**: 前端需要定期轮询或使用 WebSocket 实时更新

### 依赖关系
- ✅ Story 2-1 (Goal CRUD) - 已完成
- ✅ Story 2-2 (Key Result Management) - 已完成

### MMP 扩展功能 (延后)
- ⏸️ 聚焦历史记录查看
- ⏸️ 聚焦效果分析报告
- ⏸️ 多种隐藏模式 (dim, collapse)
- ⏸️ 聚焦提醒通知

### 参考文档
- Feature Spec: `/docs/modules/goal/features/03-focus-mode.md`
- Epic Context: `/docs/epic-2-context.md`
- Flow Document: `/docs/modules/goal/project-flows/FOCUS_CYCLE_REVIEW_FLOW.md`

---

**Story 创建者**: Dev Agent  
**创建日期**: 2025-10-30  
**最后更新**: 2025-10-30  
**Story Points**: 8 SP  
**预计完成时间**: 1-1.5 周
