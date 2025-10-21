# Feature Spec: 任务批量操作与依赖图

> **功能编号**: TASK-001  
> **RICE 评分**: 567 (Reach: 9, Impact: 7, Confidence: 9, Effort: 1)  
> **优先级**: P0  
> **预估时间**: 1-1.5 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

在任务管理中，用户经常需要批量处理多个任务，但现状存在以下问题：
- ❌ 只能逐个操作任务，效率低下（如批量标记完成、批量设置标签）
- ❌ 任务间存在依赖关系时，无法可视化依赖链路
- ❌ 不知道哪些任务被阻塞，哪些任务阻塞了其他任务
- ❌ 任务依赖关系复杂时，难以理解整体结构

### 目标用户

- **主要用户**: 项目管理者、多任务协调者
- **次要用户**: 团队成员（查看任务依赖）
- **典型画像**: 管理 20+ 任务，需要批量操作和依赖可视化的用户

### 价值主张

**一句话价值**: 支持任务批量操作和依赖图可视化，提升多任务管理效率和协调能力

**核心收益**:
- ✅ 批量标记完成、批量设置标签、批量调整优先级，节省时间
- ✅ 依赖图可视化，清晰展示任务间的前置/阻塞关系
- ✅ 自动检测循环依赖，避免逻辑错误
- ✅ 识别关键路径，优先处理影响最大的任务

---

## 2. 用户价值与场景

### 核心场景 1: 批量标记任务完成

**场景描述**:  
用户完成一批任务后，批量标记为"已完成"。

**用户故事**:
```gherkin
As a 任务执行者
I want 批量标记多个任务为已完成
So that 我无需逐个点击，节省时间
```

**操作流程**:
1. 用户在任务列表勾选 5 个任务
2. 点击"批量操作"按钮
3. 选择"标记为已完成"
4. 确认操作
5. 系统批量更新任务状态为 `completed`
6. 显示"已完成 5 个任务"
7. 任务列表实时更新

**预期结果**:
- 批量操作支持：标记完成、标记进行中、标记待办、删除任务
- 操作可撤销（30 秒内）
- 批量操作记录到审计日志

---

### 核心场景 2: 批量设置任务标签

**场景描述**:  
用户为一批任务批量添加相同的标签（如"Sprint 3"）。

**用户故事**:
```gherkin
As a 项目管理者
I want 为多个任务批量添加标签
So that 我可以快速分类和组织任务
```

**操作流程**:
1. 用户勾选 8 个任务
2. 点击"批量操作" → "添加标签"
3. 输入标签名："Sprint 3"
4. 点击"应用"
5. 系统为 8 个任务添加标签
6. 显示"已为 8 个任务添加标签 'Sprint 3'"

**预期结果**:
- 支持批量添加/移除标签
- 支持批量设置截止日期
- 支持批量分配负责人
- 批量操作面板显示影响的任务数量

---

### 核心场景 3: 配置任务依赖关系

**场景描述**:  
用户为任务设置前置依赖，明确任务执行顺序。

**用户故事**:
```gherkin
As a 项目管理者
I want 为任务设置前置依赖关系
So that 团队知道任务的执行顺序
```

**操作流程**:
1. 用户打开任务 B 的详情页
2. 点击"设置依赖"
3. 搜索并选择前置任务 A："完成设计稿"
4. 选择依赖类型："完成后开始"（Finish-to-Start）
5. 保存
6. 任务 B 的状态自动变为"被阻塞"（如果任务 A 未完成）
7. 任务 B 显示阻塞提示："等待任务 A 完成"

**预期结果**:
- Task 表新增 `dependencies` 字段：
  ```typescript
  dependencies: Array<{
    dependsOnTaskUuid: string;     // 依赖的任务 UUID
    dependencyType: DependencyType; // 依赖类型
    status: 'active' | 'resolved'   // 依赖状态
  }>
  ```
- 支持 4 种依赖类型：
  - **Finish-to-Start (FS)**: 前置任务完成后才能开始
  - **Start-to-Start (SS)**: 前置任务开始后才能开始
  - **Finish-to-Finish (FF)**: 前置任务完成后才能完成
  - **Start-to-Finish (SF)**: 前置任务开始后才能完成（罕见）

---

### 核心场景 4: 查看任务依赖图

**场景描述**:  
用户查看任务间的依赖关系图，识别阻塞链路和关键路径。

**用户故事**:
```gherkin
As a 项目管理者
I want 查看任务依赖关系的可视化图表
So that 我可以理解任务间的复杂依赖结构
```

**操作流程**:
1. 用户点击"依赖图"视图
2. 系统展示有向图（DAG）：
   ```
   任务 A ──→ 任务 B ──→ 任务 D
             ↓
           任务 C ──→ 任务 E
   ```
3. 已完成任务显示为绿色
4. 被阻塞任务显示为红色（边框闪烁）
5. 关键路径高亮显示（最长路径）
6. 用户可点击节点查看任务详情
7. 用户可拖拽节点调整布局

**预期结果**:
- 使用图形库（如 **React Flow** 或 **Cytoscape.js**）渲染依赖图
- 节点颜色编码：
  - 🟢 绿色：已完成
  - 🔵 蓝色：进行中
  - ⚪ 灰色：待办
  - 🔴 红色：被阻塞
- 边类型标注（FS, SS, FF, SF）
- 支持缩放、平移、全屏查看

---

### 核心场景 5: 自动检测循环依赖

**场景描述**:  
用户尝试创建循环依赖时，系统自动检测并阻止。

**用户故事**:
```gherkin
As a 项目管理者
I want 系统自动检测并阻止循环依赖
So that 任务依赖关系保持逻辑一致性
```

**操作流程**:
1. 已有依赖链：任务 A → 任务 B → 任务 C
2. 用户尝试为任务 A 设置前置依赖：任务 C
3. 系统检测到循环：A → B → C → A
4. 显示错误提示："无法创建依赖：检测到循环依赖（A → B → C → A）"
5. 操作被取消

**预期结果**:
- 使用拓扑排序算法检测循环
- 实时校验，避免保存错误数据
- 显示循环路径，帮助用户理解问题

---

### 核心场景 6: 批量删除任务及其依赖

**场景描述**:  
用户批量删除任务时，系统自动处理相关的依赖关系。

**用户故事**:
```gherkin
As a 项目管理者
I want 批量删除任务时自动解除依赖关系
So that 数据保持一致性
```

**操作流程**:
1. 用户勾选 3 个任务：A, B, C
2. 点击"批量删除"
3. 系统检测到任务 D 依赖于任务 B
4. 显示警告："任务 D 依赖于任务 B，删除后 D 将不再被阻塞"
5. 用户确认删除
6. 系统删除 A, B, C，并自动解除 D 对 B 的依赖
7. 任务 D 状态从"被阻塞"变为"待办"

**预期结果**:
- 批量删除前显示影响分析
- 自动清理孤立的依赖记录
- 通知受影响的任务负责人

---

## 3. 设计要点

### 涉及字段（对齐 Contracts）

#### 更新聚合根：Task

**位置**: `packages/contracts/src/modules/task/aggregates/TaskServer.ts`

```typescript
export interface TaskServerDTO {
  // ...existing fields...
  
  // 依赖关系字段
  readonly dependencies?: TaskDependency[];     // 此任务依赖的其他任务
  readonly dependents?: string[];               // 依赖此任务的其他任务 UUID（反向关系）
  readonly isBlocked: boolean;                  // 是否被阻塞
  readonly blockingReason?: string;             // 阻塞原因
  readonly dependencyStatus: DependencyStatus;  // 依赖状态
}

/**
 * 任务依赖关系
 */
export interface TaskDependency {
  readonly dependsOnTaskUuid: string;           // 依赖的任务 UUID
  readonly dependencyType: DependencyType;       // 依赖类型
  readonly status: 'active' | 'resolved';        // 依赖状态
  readonly createdAt: number;
  readonly createdBy: string;
}

/**
 * 依赖类型
 */
export enum DependencyType {
  FINISH_TO_START = 'finish_to_start',  // 完成后开始（最常见）
  START_TO_START = 'start_to_start',    // 开始后开始
  FINISH_TO_FINISH = 'finish_to_finish', // 完成后完成
  START_TO_FINISH = 'start_to_finish'   // 开始后完成（罕见）
}

/**
 * 依赖状态
 */
export enum DependencyStatus {
  NONE = 'none',              // 无依赖
  WAITING = 'waiting',        // 等待前置任务
  READY = 'ready',            // 依赖已解除，可以开始
  BLOCKED = 'blocked'         // 被阻塞（循环依赖或异常）
}
```

---

### 交互设计

#### 1. 批量操作支持的动作

| 操作 | 描述 | 前置检查 |
|------|------|---------|
| 标记完成 | 批量将状态改为 `completed` | 检查是否有依赖此任务的未完成任务 |
| 标记进行中 | 批量将状态改为 `in_progress` | 检查前置依赖是否已解除 |
| 删除任务 | 批量删除任务 | 检查依赖关系，显示影响分析 |
| 添加标签 | 批量添加标签 | 无 |
| 移除标签 | 批量移除标签 | 无 |
| 设置优先级 | 批量设置 importance/urgency | 无 |
| 分配负责人 | 批量分配 assignee | 无 |
| 设置截止日期 | 批量设置 dueDate | 无 |

#### 2. 依赖关系自动更新规则

- ✅ 前置任务完成时，自动解除依赖任务的阻塞状态
- ✅ 前置任务重新开启时，重新阻塞依赖任务
- ✅ 删除任务时，自动清理相关依赖记录
- ✅ 创建依赖时，立即检测循环依赖

#### 3. 依赖图布局算法

- **分层布局（Hierarchical Layout）**: 自动将任务分层，上层为前置任务
- **力导向布局（Force-Directed Layout）**: 任务节点自然分布，避免重叠
- **手动布局**: 用户可拖拽调整，保存自定义位置

---

## 4. MVP/MMP/Full 路径

### MVP: 基础批量操作（1-1.5 周）

**范围**:
- ✅ 批量标记完成/进行中/待办
- ✅ 批量删除任务
- ✅ 批量添加/移除标签
- ✅ 批量操作撤销功能
- ✅ 基础依赖关系配置（仅支持 Finish-to-Start）
- ✅ 简单依赖列表视图（非图形化）

**技术要点**:
- Contracts: 定义 `TaskDependency`, `DependencyType`
- Domain: Task 聚合根添加 `addDependency()`, `removeDependency()` 方法
- Application: `BatchUpdateTasksService` 应用服务
- Prisma: 添加 `TaskDependency` 表（关联表）
- API: `POST /api/v1/tasks/batch/update`, `POST /api/v1/tasks/:id/dependencies`
- UI: 批量操作面板 + 依赖配置表单

**验收标准**:
```gherkin
Given 用户勾选了 5 个任务
When 用户点击"批量操作" → "标记为已完成"
Then 系统应批量更新 5 个任务状态为 completed
And 显示"已完成 5 个任务"
And 用户可在 30 秒内点击"撤销"恢复
```

---

### MMP: 依赖图可视化（+1-2 周）

**在 MVP 基础上新增**:
- ✅ 依赖图可视化（使用 React Flow）
- ✅ 支持 4 种依赖类型（FS, SS, FF, SF）
- ✅ 自动检测循环依赖
- ✅ 关键路径识别
- ✅ 阻塞任务高亮显示
- ✅ 批量设置优先级、截止日期

**技术要点**:
- 集成 React Flow 或 Cytoscape.js
- 拓扑排序算法（检测循环）
- 关键路径算法（最长路径）
- 依赖图数据结构优化

**验收标准**:
```gherkin
Given 任务列表有依赖关系：A → B → C, A → D
When 用户点击"依赖图"视图
Then 系统应展示有向图
And 任务节点应按层次排列
And 已完成任务应显示为绿色
And 被阻塞任务应显示为红色
And 关键路径（A → B → C）应高亮显示
```

---

### Full Release: 智能依赖管理（+2-3 周）

**在 MMP 基础上新增**:
- ✅ 智能推荐依赖关系（基于任务描述和标签）
- ✅ 依赖模板（常见项目流程预设）
- ✅ 批量配置依赖关系
- ✅ 依赖影响分析（如果 A 延期，影响哪些任务）
- ✅ 甘特图视图（基于依赖关系生成时间线）
- ✅ 批量导入/导出任务（CSV/JSON）

**技术要点**:
- NLP 分析任务描述，推荐依赖
- 甘特图渲染（如 dhtmlx-gantt）
- CSV/JSON 导入导出服务

**验收标准**:
```gherkin
Given 用户创建任务"前端开发"
When 系统检测到已有任务"UI 设计"
Then 系统应推荐"UI 设计"作为前置依赖
And 用户可一键接受推荐
And 依赖关系自动创建
```

---

## 5. 验收标准（Gherkin）

### Feature: 任务批量操作与依赖图

#### Scenario 1: 批量标记任务完成

```gherkin
Feature: 任务批量操作与依赖图
  作为项目管理者，我希望批量操作任务并可视化依赖关系

  Background:
    Given 用户"孙七"已登录
    And 任务列表有以下任务：
      | uuid    | name        | status      |
      | task-1  | 设计原型    | completed   |
      | task-2  | 开发前端    | in_progress |
      | task-3  | 开发后端    | in_progress |
      | task-4  | 编写测试    | todo        |
      | task-5  | 部署上线    | todo        |

  Scenario: 批量标记为已完成
    When 用户勾选任务：task-2, task-3
    And 点击"批量操作" → "标记为已完成"
    And 确认操作
    Then 任务 task-2 的状态应变为 completed
    And 任务 task-3 的状态应变为 completed
    And 系统应显示"已完成 2 个任务"
    And 批量操作应记录到审计日志：
      | 操作类型   | 影响任务数 | 操作人 | 时间              |
      | 标记完成   | 2          | 孙七   | 2025-10-21 16:00 |

  Scenario: 批量操作撤销
    Given 用户刚完成批量标记操作
    And 撤销按钮可见（30 秒内）
    When 用户点击"撤销"
    Then 任务 task-2, task-3 的状态应恢复为 in_progress
    And 显示"操作已撤销"
```

---

#### Scenario 2: 配置任务依赖关系

```gherkin
  Background:
    Given 任务"开发前端"（task-2）已存在
    And 任务"设计原型"（task-1）状态为 completed

  Scenario: 设置前置依赖
    When 用户打开任务 task-2 的详情页
    And 点击"设置依赖"
    And 搜索并选择前置任务 task-1（设计原型）
    And 选择依赖类型 = "完成后开始"（Finish-to-Start）
    And 保存
    Then 任务 task-2 应新增依赖记录：
      | dependsOnTaskUuid | dependencyType   | status   |
      | task-1            | finish_to_start  | resolved |
    And 任务 task-2 的 isBlocked 应为 false（因为 task-1 已完成）
    And 任务 task-1 的 dependents 应包含 task-2

  Scenario: 依赖未完成时自动阻塞
    Given 任务 task-3（开发后端）依赖任务 task-2（开发前端）
    And 任务 task-2 状态为 in_progress（未完成）
    When 用户查看任务 task-3
    Then 任务 task-3 的 isBlocked 应为 true
    And 任务 task-3 应显示阻塞提示："等待任务'开发前端'完成"
    And 任务 task-3 的状态标签应带红色警告标识
```

---

#### Scenario 3: 查看任务依赖图

```gherkin
  Background:
    Given 任务列表有以下依赖关系：
      | 任务        | 依赖于         |
      | 开发前端    | 设计原型       |
      | 开发后端    | 设计原型       |
      | 编写测试    | 开发前端, 开发后端 |
      | 部署上线    | 编写测试       |

  Scenario: 展示依赖图
    When 用户点击"依赖图"视图
    Then 系统应展示有向图，包含 5 个节点
    And 依赖关系应显示为有向边：
      | 起点     | 终点     |
      | 设计原型 | 开发前端 |
      | 设计原型 | 开发后端 |
      | 开发前端 | 编写测试 |
      | 开发后端 | 编写测试 |
      | 编写测试 | 部署上线 |
    And 已完成任务（设计原型）应显示为绿色
    And 被阻塞任务（部署上线）应显示为红色
    And 关键路径（设计原型 → 开发前端 → 编写测试 → 部署上线）应高亮

  Scenario: 点击节点查看任务详情
    Given 依赖图已展示
    When 用户点击节点"开发前端"
    Then 系统应弹出任务详情面板
    And 面板应显示任务信息：名称、状态、优先级、负责人
    And 面板应显示依赖关系："依赖于'设计原型'"
    And 面板应显示"被'编写测试'依赖"
```

---

#### Scenario 4: 检测循环依赖

```gherkin
  Background:
    Given 已有依赖链：task-1 → task-2 → task-3

  Scenario: 阻止创建循环依赖
    When 用户尝试为 task-1 设置前置依赖 task-3
    Then 系统应显示错误提示："无法创建依赖：检测到循环依赖"
    And 提示应显示循环路径："task-1 → task-2 → task-3 → task-1"
    And 操作应被取消
    And 依赖关系不应保存

  Scenario: 实时校验循环依赖
    When 用户在依赖配置表单中选择 task-3
    And 尚未点击"保存"
    Then 表单应实时显示警告："此操作将创建循环依赖"
    And "保存"按钮应禁用
```

---

#### Scenario 5: 批量删除任务及依赖处理

```gherkin
  Background:
    Given 任务 task-2 依赖任务 task-1
    And 任务 task-3 依赖任务 task-2

  Scenario: 删除中间任务并处理依赖
    When 用户勾选任务 task-2
    And 点击"批量删除"
    Then 系统应显示警告对话框：
      """
      任务'开发前端'被以下任务依赖：
      - 编写测试（task-3）
      
      删除后，task-3 将不再被阻塞。
      是否继续删除？
      """
    When 用户确认删除
    Then 任务 task-2 应被删除
    And 任务 task-3 的依赖记录应自动删除
    And 任务 task-3 的 isBlocked 应变为 false
    And 系统应发送通知给 task-3 的负责人："前置任务已删除"
```

---

#### Scenario 6: 批量设置标签

```gherkin
  Background:
    Given 用户勾选了 5 个任务

  Scenario: 批量添加标签
    When 用户点击"批量操作" → "添加标签"
    And 输入标签名："Sprint 3"
    And 点击"应用"
    Then 系统应为 5 个任务添加标签"Sprint 3"
    And 显示"已为 5 个任务添加标签"
    And 任务列表应显示标签筛选：Sprint 3 (5)
```

---

## 6. 指标与追踪

### 事件埋点

```typescript
// 批量操作
{
  event: 'tasks_batch_operation',
  properties: {
    operation: 'mark_completed' | 'delete' | 'add_tag' | 'set_priority',
    taskCount: number,
    duration: number  // 操作耗时（ms）
  }
}

// 配置依赖关系
{
  event: 'task_dependency_added',
  properties: {
    taskUuid: string,
    dependsOnTaskUuid: string,
    dependencyType: DependencyType
  }
}

// 查看依赖图
{
  event: 'dependency_graph_viewed',
  properties: {
    taskCount: number,
    dependencyCount: number,
    hasCriticalPath: boolean
  }
}

// 检测循环依赖
{
  event: 'circular_dependency_detected',
  properties: {
    circularPath: string[],
    blockedOperation: string
  }
}
```

---

### 成功指标

**定量指标**:
| 指标 | 目标值 | 测量方式 |
|------|-------|---------|
| 批量操作使用率 | >40% | 使用批量操作的用户数 / 总用户数 |
| 依赖图查看率 | >20% | 查看依赖图的次数 / 任务查看次数 |
| 循环依赖检测成功率 | 100% | 阻止的循环依赖数 / 尝试创建数 |
| 批量操作平均时间节省 | >50% | (单个操作时间 × 数量) vs 批量操作时间 |

**定性指标**:
- 用户反馈"多任务管理效率提升"
- 任务依赖关系更清晰
- 阻塞任务识别更及时

---

## 7. 技术实现要点

### Prisma Schema

```prisma
model Task {
  // ...existing fields...
  
  isBlocked            Boolean  @default(false) @map("is_blocked")
  blockingReason       String?  @map("blocking_reason")
  dependencyStatus     String   @default("none") @map("dependency_status")
  
  dependencies         TaskDependency[] @relation("TaskDependencies")
  dependents           TaskDependency[] @relation("DependentTasks")
}

model TaskDependency {
  uuid                 String   @id @default(uuid())
  taskUuid             String   @map("task_uuid")
  dependsOnTaskUuid    String   @map("depends_on_task_uuid")
  dependencyType       String   @map("dependency_type")
  status               String   @default("active")
  createdAt            DateTime @default(now()) @map("created_at")
  createdBy            String   @map("created_by")
  
  task                 Task     @relation("TaskDependencies", fields: [taskUuid], references: [uuid])
  dependsOnTask        Task     @relation("DependentTasks", fields: [dependsOnTaskUuid], references: [uuid])
  
  @@unique([taskUuid, dependsOnTaskUuid])
  @@index([taskUuid])
  @@index([dependsOnTaskUuid])
  @@map("task_dependencies")
}
```

### 循环依赖检测算法

```typescript
// packages/domain-server/src/modules/task/services/DependencyGraphService.ts

export class DependencyGraphService {
  /**
   * 检测循环依赖（拓扑排序）
   */
  detectCircularDependency(
    taskUuid: string,
    newDependencyUuid: string,
    allDependencies: TaskDependency[]
  ): string[] | null {
    // 构建邻接表
    const graph = this.buildAdjacencyList(allDependencies);
    graph[taskUuid] = graph[taskUuid] || [];
    graph[taskUuid].push(newDependencyUuid);
    
    // DFS 检测循环
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const path: string[] = [];
    
    const dfs = (node: string): boolean => {
      visited.add(node);
      recStack.add(node);
      path.push(node);
      
      for (const neighbor of (graph[node] || [])) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          path.push(neighbor);
          return true; // 找到循环
        }
      }
      
      recStack.delete(node);
      path.pop();
      return false;
    };
    
    if (dfs(taskUuid)) {
      return path; // 返回循环路径
    }
    return null;
  }
}
```

### API 端点

```typescript
// 批量操作
POST /api/v1/tasks/batch/update
Body: { taskUuids: string[], updates: Partial<TaskServerDTO> }
Response: { updatedCount: number }

// 添加依赖
POST /api/v1/tasks/:id/dependencies
Body: { dependsOnTaskUuid: string, dependencyType: DependencyType }
Response: TaskClientDTO

// 获取依赖图数据
GET /api/v1/tasks/dependency-graph
Query: taskUuids?: string[]
Response: { nodes: TaskNode[], edges: TaskEdge[] }

// 检测循环依赖
POST /api/v1/tasks/dependency-graph/validate
Body: { taskUuid: string, newDependencyUuid: string }
Response: { isValid: boolean, circularPath?: string[] }
```

---

## 8. 风险与缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|-------|------|---------|
| 批量操作误删任务 | 中 | 高 | 二次确认 + 30 秒撤销 + 软删除 |
| 依赖图渲染性能问题 | 中 | 中 | 虚拟化渲染 + 分页加载 + 缓存 |
| 循环依赖检测失败 | 低 | 高 | 单元测试 + 前后端双重校验 |
| 依赖关系复杂时用户困惑 | 中 | 中 | 关键路径高亮 + 分层布局 + 教程 |

---

## 9. 参考资料

- [Task Contracts](../../../../packages/contracts/src/modules/task/)
- [React Flow 文档](https://reactflow.dev/)
- [拓扑排序算法](https://en.wikipedia.org/wiki/Topological_sorting)
- [关键路径法（CPM）](https://en.wikipedia.org/wiki/Critical_path_method)

---

**文档状态**: ✅ Ready for PM Review  
**下一步**: PM 生成 Project Flow
