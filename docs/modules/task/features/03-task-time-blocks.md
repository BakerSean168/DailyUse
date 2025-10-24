# Feature Spec: 任务时间块管理

> **功能编号**: TASK-003  
> **RICE 评分**: 298.7 (Reach: 8, Impact: 7, Confidence: 8, Effort: 1.5)  
> **优先级**: P0  
> **预估时间**: 1-1.5 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

时间盒（Time Boxing）是高效任务管理的核心方法论，但现有任务管理工具普遍存在以下问题：

- ❌ 任务只有截止日期，没有执行时间安排，导致拖延
- ❌ 无法将任务与日历集成，时间规划与执行脱节
- ❌ 预估时间与实际时间无追踪，无法优化时间管理能力
- ❌ 番茄钟、时间块等时间管理技巧无法与任务系统集成
- ❌ 多任务并行时，时间分配混乱

### 目标用户

- **主要用户**: 知识工作者、项目经理、自由职业者
- **次要用户**: 需要严格时间管理的学生、创作者
- **典型画像**: "我有很多任务，但不知道什么时候做，经常低估任务时间"

### 价值主张

**一句话价值**: 为每个任务分配明确的执行时间块，将计划转化为行动，提升时间管理能力

**核心收益**:

- ✅ 为任务分配具体执行时间段（如今天 14:00-15:30）
- ✅ 预估时间 vs 实际时间对比，持续优化时间感知
- ✅ 与日历集成，时间块可视化展示
- ✅ 支持番茄钟模式（25 分钟工作 + 5 分钟休息）
- ✅ 时间块冲突检测与智能调整

---

## 2. 用户价值与场景

### 核心场景 1: 为任务分配时间块

**场景描述**:  
用户为一个任务分配明确的执行时间段，将"要做"转化为"何时做"。

**用户故事**:

```gherkin
As a 任务执行者
I want 为任务分配具体的时间块（如今天 14:00-15:30）
So that 我知道何时执行，避免拖延，提高执行力
```

**操作流程**:

1. 用户打开任务详情页
2. 点击"安排时间"按钮
3. 系统弹出时间块配置面板：

   ```
   ⏰ 安排任务时间
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   任务：撰写项目报告
   预估时间：2 小时

   选择执行时间：
   📅 日期：2025-10-21（今天）
   🕐 开始时间：14:00
   🕑 结束时间：16:00
   ⏱️  时长：2 小时

   时间块模式：
   🔘 连续工作（2 小时不间断）
   ⚪ 番茄钟模式（25分钟 × 4 + 休息）
   ⚪ 自定义分段

   冲突检测：
   ✅ 该时间段无冲突

   同步到日历：
   ☑️ 自动创建日历事件

   [取消]  [安排时间]
   ```

4. 用户选择"番茄钟模式"
5. 系统自动拆分为 4 个番茄钟：
   - 14:00-14:25 (工作)
   - 14:25-14:30 (休息)
   - 14:30-14:55 (工作)
   - 14:55-15:00 (休息)
   - 15:00-15:25 (工作)
   - 15:25-15:30 (休息)
   - 15:30-15:55 (工作)
   - 15:55-16:00 (完成)
6. 点击"安排时间"
7. 系统创建时间块记录并同步到日历

**预期结果**:

- Task 新增字段：
  ```typescript
  readonly timeBlocks?: TimeBlock[];
  readonly estimatedTime?: number;   // 预估时间（分钟）
  readonly actualTime?: number;      // 实际时间（分钟）
  ```
- TimeBlock 结构：
  ```typescript
  {
    uuid: string,
    taskUuid: string,
    startTime: number,          // 开始时间戳
    endTime: number,            // 结束时间戳
    duration: number,           // 时长（分钟）
    mode: 'continuous' | 'pomodoro' | 'custom',
    status: 'scheduled' | 'in-progress' | 'paused' | 'completed' | 'cancelled',
    actualStartTime?: number,   // 实际开始时间
    actualEndTime?: number,     // 实际结束时间
    pomodoroConfig?: {          // 番茄钟配置
      workDuration: number,     // 工作时长（分钟，默认 25）
      breakDuration: number,    // 休息时长（分钟，默认 5）
      longBreakInterval: number,// 长休息间隔（默认 4）
      longBreakDuration: number // 长休息时长（分钟，默认 15）
    },
    createdAt: number,
    updatedAt: number
  }
  ```

---

### 核心场景 2: 开始执行时间块（番茄钟计时）

**场景描述**:  
到达任务时间块的开始时间，用户开始执行任务并启动计时器。

**用户故事**:

```gherkin
As a 任务执行者
I want 在任务时间块开始时启动计时器
So that 我可以专注工作，并记录实际执行时间
```

**操作流程**:

1. 当前时间到达 14:00
2. 系统发送提醒："⏰ 任务时间块即将开始：撰写项目报告（14:00-16:00）"
3. 用户点击"开始"
4. 系统进入番茄钟工作界面：

   ```
   🍅 番茄钟 - 第 1 个
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   任务：撰写项目报告

   ⏱️  24:58
   ████████████████████▒▒▒▒▒▒▒▒▒▒ 1/4

   [暂停]  [完成]  [放弃]

   下一个：休息 5 分钟（14:25）
   ```

5. 计时器倒计时 25 分钟
6. 到达 14:25，系统自动进入休息：

   ```
   ☕ 休息时间
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ⏱️  04:58

   💡 建议：站起来走动、喝水、放松眼睛

   [跳过休息，继续工作]
   ```

7. 休息结束后自动进入下一个番茄钟
8. 完成 4 个番茄钟后任务标记为完成

**预期结果**:

- TimeBlock 状态变化：`scheduled` → `in-progress` → `completed`
- 记录实际开始/结束时间
- 计算实际时长并更新 Task 的 `actualTime`

---

### 核心场景 3: 时间块冲突检测

**场景描述**:  
用户尝试为任务分配时间块，但与已有时间块冲突。

**用户故事**:

```gherkin
As a 任务执行者
I want 系统自动检测时间块冲突
So that 我可以避免时间安排重叠，合理调整计划
```

**操作流程**:

1. 用户为"撰写技术文档"任务分配时间块：14:30-16:30
2. 系统检测到与"撰写项目报告"（14:00-16:00）冲突
3. 显示冲突提示：

   ```
   ⚠️ 时间冲突
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   您选择的时间段：
   📅 2025-10-21 14:30-16:30

   与以下时间块冲突：
   🔴 撰写项目报告
      14:00-16:00（冲突 30 分钟）

   建议调整：
   ✅ 方案1：调整为 16:00-18:00（无冲突）
   ✅ 方案2：调整为明天 14:30-16:30（无冲突）
   ⚠️ 方案3：保持 14:30-16:30，取消"撰写项目报告"

   [选择方案1]  [选择方案2]  [手动调整]
   ```

4. 用户选择"方案1"
5. 系统自动调整时间块为 16:00-18:00

**预期结果**:

- 冲突检测算法检查所有已有时间块
- 提供智能调整方案
- 支持强制覆盖（需确认）

---

### 核心场景 4: 时间块可视化（日历视图）

**场景描述**:  
用户查看日历，直观了解所有任务的时间块分布。

**用户故事**:

```gherkin
As a 任务执行者
I want 在日历视图中查看所有任务的时间块
So that 我可以直观了解时间安排，避免过载
```

**操作流程**:

1. 用户打开日历视图
2. 系统展示时间块分布：
   ```
   📅 2025-10-21（今天）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   08:00 ┌──────────────────┐
         │  晨会 (30分钟)   │ [Schedule]
   08:30 └──────────────────┘
   09:00
   ...
   14:00 ┌──────────────────────────┐
         │ 撰写项目报告 (2小时)     │ [Task]
         │ 🍅🍅🍅🍅 (番茄钟模式)   │
   16:00 └──────────────────────────┘
   16:00 ┌──────────────────────────┐
         │ 撰写技术文档 (2小时)     │ [Task]
   18:00 └──────────────────────────┘
   19:00
   ...
   ```
3. 时间块颜色编码：
   - 🟢 已完成
   - 🟡 进行中
   - 🔵 已安排
   - 🔴 已过期
4. 点击时间块可查看详情或快速操作（开始/取消/调整）

**预期结果**:

- 日历视图集成任务时间块
- 支持拖拽调整时间块
- 显示时间利用率（如今天安排了 6 小时）

---

### 核心场景 5: 预估时间 vs 实际时间对比

**场景描述**:  
任务完成后，系统对比预估时间与实际时间，帮助用户提升时间感知。

**用户故事**:

```gherkin
As a 任务执行者
I want 查看任务的预估时间与实际时间对比
So that 我可以了解自己的时间估算能力，并持续改进
```

**操作流程**:

1. 用户完成"撰写项目报告"任务
2. 系统记录实际时间：2.5 小时（预估 2 小时）
3. 任务详情页显示时间对比：

   ```
   ⏱️  时间统计
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   预估时间：2 小时
   实际时间：2.5 小时
   偏差：+25% (超出 30 分钟)

   效率分析：
   ⚠️ 您低估了此任务的时间
   💡 建议：类似任务预估时增加 20-30%

   时间分布：
   - 第1个番茄钟：25分钟 ✅
   - 第2个番茄钟：28分钟 ⚠️ (超时3分钟)
   - 第3个番茄钟：25分钟 ✅
   - 第4个番茄钟：32分钟 ⚠️ (超时7分钟)
   ```

4. 用户的时间估算准确率被记录用于后续分析

**预期结果**:

- 每个任务记录 `estimatedTime` 和 `actualTime`
- 计算时间偏差率
- 生成时间管理洞察报告

---

### 核心场景 6: 批量安排时间块

**场景描述**:  
用户一次性为多个任务安排时间块。

**用户故事**:

```gherkin
As a 任务执行者
I want 批量为多个任务安排时间块
So that 我可以快速规划一天或一周的时间
```

**操作流程**:

1. 用户进入"今日任务"视图
2. 勾选 3 个任务：
   - 撰写项目报告（预估 2 小时）
   - 代码审查（预估 1 小时）
   - 回复邮件（预估 30 分钟）
3. 点击"批量安排时间"
4. 系统智能推荐时间安排：

   ```
   📅 智能时间安排
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   基于您的工作习惯，推荐以下安排：

   🌅 上午（高专注度，适合深度工作）
   09:00-11:00  撰写项目报告（2小时）

   🌤️  中午（专注度下降，适合沟通）
   13:00-13:30  回复邮件（30分钟）

   🌆 下午（专注度恢复，适合评审）
   14:00-15:00  代码审查（1小时）

   总时长：3.5 小时
   空闲时间：4.5 小时

   [接受推荐]  [手动调整]  [取消]
   ```

5. 用户点击"接受推荐"
6. 系统批量创建时间块

**预期结果**:

- 智能推荐基于任务优先级、类型、用户习惯
- 自动避开已有时间块
- 支持一键接受或拖拽调整

---

## 3. 设计要点

### 涉及字段（对齐 Contracts）

#### 更新 Task 实体

**位置**: `packages/contracts/src/modules/task/entities/TaskServer.ts`

```typescript
export interface TaskServerDTO {
  // ...existing fields...

  // 时间块相关
  readonly timeBlocks?: TimeBlockServerDTO[];
  readonly estimatedTime?: number; // 预估时间（分钟）
  readonly actualTime?: number; // 实际时间（分钟）
  readonly timeEstimationAccuracy?: number; // 时间估算准确率 (0-1)
}
```

#### 新增实体：TimeBlock

**位置**: `packages/contracts/src/modules/task/entities/TimeBlockServer.ts`

```typescript
/**
 * 时间块
 */
export interface TimeBlockServerDTO {
  readonly uuid: string;
  readonly taskUuid: string;
  readonly userUuid: string;
  readonly startTime: number; // 开始时间戳
  readonly endTime: number; // 结束时间戳
  readonly duration: number; // 时长（分钟）
  readonly mode: TimeBlockMode;
  readonly status: TimeBlockStatus;
  readonly actualStartTime?: number; // 实际开始时间
  readonly actualEndTime?: number; // 实际结束时间
  readonly actualDuration?: number; // 实际时长（分钟）
  readonly pomodoroConfig?: PomodoroConfig;
  readonly pomodoroSessions?: PomodoroSession[]; // 番茄钟会话记录
  readonly syncedToCalendar: boolean; // 是否已同步到日历
  readonly calendarEventId?: string; // 日历事件 ID
  readonly createdAt: number;
  readonly updatedAt: number;
}

/**
 * 时间块模式
 */
export enum TimeBlockMode {
  CONTINUOUS = 'continuous', // 连续工作
  POMODORO = 'pomodoro', // 番茄钟
  CUSTOM = 'custom', // 自定义分段
}

/**
 * 时间块状态
 */
export enum TimeBlockStatus {
  SCHEDULED = 'scheduled', // 已安排
  IN_PROGRESS = 'in-progress', // 进行中
  PAUSED = 'paused', // 已暂停
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled', // 已取消
  OVERDUE = 'overdue', // 已过期（未执行）
}

/**
 * 番茄钟配置
 */
export interface PomodoroConfig {
  readonly workDuration: number; // 工作时长（分钟，默认 25）
  readonly breakDuration: number; // 短休息时长（分钟，默认 5）
  readonly longBreakInterval: number; // 长休息间隔（默认 4 个番茄钟）
  readonly longBreakDuration: number; // 长休息时长（分钟，默认 15）
}

/**
 * 番茄钟会话记录
 */
export interface PomodoroSession {
  readonly sessionNumber: number; // 第几个番茄钟
  readonly type: 'work' | 'break' | 'long-break';
  readonly plannedDuration: number; // 计划时长（分钟）
  readonly actualDuration: number; // 实际时长（分钟）
  readonly startTime: number;
  readonly endTime: number;
  readonly completed: boolean; // 是否完整完成（未中断）
}
```

---

### 交互设计

#### 1. 时间块创建流程

```
选择任务 → 点击"安排时间"
    ↓
选择日期和时间范围
    ↓
选择时间块模式（连续/番茄钟/自定义）
    ↓
冲突检测（如有冲突，显示调整建议）
    ↓
确认创建 → 同步到日历（可选）
    ↓
创建成功，到时提醒
```

#### 2. 番茄钟执行流程

```
时间到达 → 发送提醒 → 用户点击"开始"
    ↓
第1个番茄钟（25分钟工作）
    ↓
短休息（5分钟）
    ↓
第2个番茄钟（25分钟工作）
    ↓
短休息（5分钟）
    ↓
第3个番茄钟（25分钟工作）
    ↓
短休息（5分钟）
    ↓
第4个番茄钟（25分钟工作）
    ↓
长休息（15分钟）
    ↓
完成，记录实际时间
```

#### 3. UI 状态指示

| 时间块状态  | 颜色 | 图标 | 操作           |
| ----------- | ---- | ---- | -------------- |
| scheduled   | 蓝色 | 📅   | 开始/取消/调整 |
| in-progress | 绿色 | ▶️   | 暂停/完成      |
| paused      | 黄色 | ⏸️   | 继续/取消      |
| completed   | 灰色 | ✅   | 查看详情       |
| cancelled   | 红色 | ❌   | 重新安排       |
| overdue     | 橙色 | ⚠️   | 重新安排       |

---

## 4. MVP/MMP/Full 路径

### MVP: 基础时间块管理（1-1.5 周）

**范围**:

- ✅ 为单个任务分配时间块（日期 + 开始/结束时间）
- ✅ 连续工作模式（不支持番茄钟）
- ✅ 时间块冲突检测（基础版）
- ✅ 时间块状态管理（scheduled, in-progress, completed）
- ✅ 记录预估时间 vs 实际时间
- ✅ 日历视图显示时间块（只读）

**技术要点**:

- Contracts: 定义 `TimeBlockServerDTO`
- Domain: Task 聚合根添加 `scheduleTimeBlock()` 方法
- Application: `ScheduleTimeBlockService` 应用服务
- API: `POST /api/v1/tasks/:taskUuid/time-blocks`
- UI: 时间块配置面板 + 日历视图集成

**验收标准**:

```gherkin
Given 用户有一个任务"撰写报告"
When 用户为该任务安排时间块：2025-10-21 14:00-16:00
Then 系统应创建时间块记录
And 日历视图应显示该时间块
And 到达 14:00 时应发送提醒
```

---

### MMP: 番茄钟与智能推荐（+1-2 周）

**在 MVP 基础上新增**:

- ✅ 番茄钟模式（25分钟工作 + 5分钟休息）
- ✅ 番茄钟计时器 UI（倒计时 + 进度条）
- ✅ 番茄钟会话记录
- ✅ 智能时间推荐（批量安排）
- ✅ 时间块拖拽调整（日历视图）
- ✅ 同步到系统日历（ICS 格式）

**技术要点**:

- 番茄钟状态机（work → break → work → ...）
- WebWorker 实现精确计时
- 拖拽调整触发冲突检测
- iCalendar 协议集成

**验收标准**:

```gherkin
Given 用户选择番茄钟模式
When 时间块开始执行
Then 系统应自动进入第1个番茄钟（25分钟）
And 倒计时结束后自动进入休息（5分钟）
And 循环直到完成所有番茄钟
And 记录每个番茄钟的实际时长
```

---

### Full Release: 高级时间管理（+2-3 周）

**在 MMP 基础上新增**:

- ✅ 自定义分段模式（如 50分钟工作 + 10分钟休息）
- ✅ 时间块模板（常用时间安排快速应用）
- ✅ 时间利用率分析（每日/每周）
- ✅ 专注度热力图（哪个时间段最高效）
- ✅ 时间估算准确率趋势
- ✅ 与 Schedule 模块深度集成（自动填充空闲时间）
- ✅ 多设备同步（实时更新时间块状态）

**技术要点**:

- 时间利用率算法（工作时间 / 总可用时间）
- 专注度分析（基于实际完成时间与计划时间的偏差）
- WebSocket 实时同步时间块状态

**验收标准**:

```gherkin
Given 用户在桌面端开始一个时间块
When 用户切换到移动端
Then 移动端应实时显示时间块进行中状态
And 倒计时应同步
```

---

## 5. 验收标准（Gherkin）

### Feature: 任务时间块管理

#### Scenario 1: 为任务分配时间块

```gherkin
Feature: 任务时间块管理
  作为任务执行者，我希望为任务分配时间块

  Background:
    Given 用户"郑十"已登录
    And 用户有以下任务：
      | uuid    | title        | estimatedTime |
      | task-1  | 撰写项目报告  | 120（分钟）   |
      | task-2  | 代码审查      | 60（分钟）    |

  Scenario: 成功创建时间块
    When 用户打开任务"task-1"详情页
    And 点击"安排时间"
    And 选择日期："2025-10-21"
    And 选择时间："14:00-16:00"
    And 选择模式："连续工作"
    And 勾选"同步到日历"
    And 点击"安排时间"
    Then 系统应创建 TimeBlock 记录：
      | 字段          | 值                     |
      | taskUuid      | task-1                |
      | startTime     | 2025-10-21 14:00:00   |
      | endTime       | 2025-10-21 16:00:00   |
      | duration      | 120（分钟）            |
      | mode          | continuous            |
      | status        | scheduled             |
    And 日历视图应显示该时间块
    And 系统应在 2025-10-21 13:55 发送提醒

  Scenario: 时间块冲突检测
    Given 任务"task-1"已有时间块：14:00-16:00
    When 用户为任务"task-2"安排时间块：15:00-16:00
    Then 系统应显示冲突警告：
      | 字段          | 值                           |
      | 冲突任务      | task-1 (撰写项目报告)        |
      | 冲突时段      | 15:00-16:00（冲突 1 小时）   |
    And 系统应推荐调整方案：
      | 方案          | 时间                |
      | 方案1         | 16:00-17:00        |
      | 方案2         | 明天 15:00-16:00   |
    And 用户选择方案1后应调整为 16:00-17:00
```

---

#### Scenario 2: 番茄钟模式执行

```gherkin
  Background:
    Given 用户为任务"task-1"创建了番茄钟时间块
    And 番茄钟配置：
      | 工作时长   | 25分钟 |
      | 休息时长   | 5分钟  |
      | 番茄钟数量 | 2      |
    And 时间块状态为"scheduled"

  Scenario: 启动番茄钟并完成
    When 当前时间到达时间块开始时间
    And 系统发送提醒："任务时间块即将开始"
    And 用户点击"开始"
    Then 时间块状态应变为"in-progress"
    And actualStartTime 应记录为当前时间
    And 系统应显示番茄钟计时器：
      | 字段        | 值               |
      | 会话类型    | work             |
      | 会话编号    | 1                |
      | 剩余时间    | 25:00            |
      | 进度        | 0/2              |

    When 25分钟后计时结束
    Then 系统应自动进入休息模式
    And 显示休息计时器：5:00
    And 记录第1个番茄钟会话：
      | 字段              | 值                |
      | sessionNumber     | 1                 |
      | type              | work              |
      | plannedDuration   | 25                |
      | actualDuration    | 25                |
      | completed         | true              |

    When 5分钟休息结束
    Then 系统应进入第2个番茄钟
    And 显示工作计时器：25:00（会话 2/2）

    When 第2个番茄钟完成
    Then 时间块状态应变为"completed"
    And actualEndTime 应记录为当前时间
    And actualDuration 应为 60分钟（25+5+25+5）
    And 任务的 actualTime 应更新为 60分钟
```

---

#### Scenario 3: 预估时间 vs 实际时间对比

```gherkin
  Background:
    Given 任务"task-1"的预估时间为 120分钟
    And 用户完成了时间块，实际时间为 150分钟

  Scenario: 查看时间对比分析
    When 用户打开任务"task-1"详情页
    And 查看"时间统计"部分
    Then 系统应显示：
      | 字段        | 值                         |
      | 预估时间    | 120分钟（2小时）           |
      | 实际时间    | 150分钟（2.5小时）         |
      | 偏差        | +25% (超出 30分钟)        |
      | 偏差类型    | 低估                       |
    And 系统应提供建议："类似任务预估时增加 20-30%"
    And 用户的 timeEstimationAccuracy 应更新（历史平均值）
```

---

#### Scenario 4: 批量安排时间块

```gherkin
  Background:
    Given 用户有以下任务：
      | uuid    | title        | estimatedTime | priority |
      | task-1  | 撰写项目报告  | 120          | high     |
      | task-2  | 代码审查      | 60           | medium   |
      | task-3  | 回复邮件      | 30           | low      |

  Scenario: 智能批量安排
    When 用户勾选 3 个任务
    And 点击"批量安排时间"
    Then 系统应分析并推荐：
      | 任务          | 推荐时间              | 原因                      |
      | task-1        | 09:00-11:00          | 上午专注度高，适合深度工作  |
      | task-3        | 13:00-13:30          | 中午专注度低，适合沟通     |
      | task-2        | 14:00-15:00          | 下午专注度恢复，适合评审   |
    And 推荐应避开已有时间块

    When 用户点击"接受推荐"
    Then 系统应批量创建 3 个时间块
    And 所有时间块状态应为"scheduled"
    And 日历视图应显示全部时间块
```

---

#### Scenario 5: 时间块拖拽调整

```gherkin
  Background:
    Given 用户在日历视图
    And 任务"task-1"有时间块：14:00-16:00

  Scenario: 拖拽调整时间块
    When 用户拖拽时间块到 15:00-17:00
    And 松开鼠标
    Then 系统应检测新时间段是否冲突
    And 如果无冲突，更新时间块：
      | 字段      | 旧值          | 新值          |
      | startTime | 14:00        | 15:00        |
      | endTime   | 16:00        | 17:00        |
    And 日历视图应实时更新
    And updatedAt 应更新为当前时间
```

---

## 6. 指标与追踪

### 事件埋点

```typescript
// 创建时间块
{
  event: 'time_block_created',
  properties: {
    mode: 'continuous' | 'pomodoro' | 'custom',
    duration: number,  // 分钟
    syncedToCalendar: boolean,
    hasConflict: boolean
  }
}

// 开始时间块
{
  event: 'time_block_started',
  properties: {
    mode: string,
    onTime: boolean,     // 是否准时开始
    delayMinutes: number // 延迟分钟数
  }
}

// 完成番茄钟
{
  event: 'pomodoro_completed',
  properties: {
    sessionNumber: number,
    plannedDuration: number,
    actualDuration: number,
    interrupted: boolean  // 是否被中断
  }
}

// 时间块完成
{
  event: 'time_block_completed',
  properties: {
    estimatedTime: number,
    actualTime: number,
    timeDelta: number,         // 偏差（分钟）
    timeDeltaPercentage: number // 偏差百分比
  }
}

// 批量安排
{
  event: 'time_blocks_batch_scheduled',
  properties: {
    taskCount: number,
    totalDuration: number,
    acceptedRecommendation: boolean
  }
}
```

---

### 成功指标

**定量指标**:
| 指标 | 目标值 | 测量方式 |
|------|-------|---------|
| 时间块使用率 | >50% | 使用时间块的任务数 / 总任务数 |
| 时间估算准确率 | >70% | ±20% 以内的任务比例 |
| 番茄钟完成率 | >80% | 完整完成的番茄钟 / 总番茄钟数 |
| 准时开始率 | >60% | 准时（±5分钟）开始的时间块比例 |

**定性指标**:

- 用户反馈"时间块帮助我更专注执行任务"
- 拖延减少（任务实际开始时间与计划时间的差距缩小）
- 时间管理能力提升（时间估算越来越准确）

---

## 7. 技术实现要点

### Prisma Schema

```prisma
model TimeBlock {
  uuid                String   @id @default(uuid())
  taskUuid            String   @map("task_uuid")
  userUuid            String   @map("user_uuid")
  startTime           BigInt   @map("start_time")
  endTime             BigInt   @map("end_time")
  duration            Int      @map("duration")  // 分钟
  mode                String   @map("mode")
  status              String   @map("status")
  actualStartTime     BigInt?  @map("actual_start_time")
  actualEndTime       BigInt?  @map("actual_end_time")
  actualDuration      Int?     @map("actual_duration")
  pomodoroConfig      Json?    @map("pomodoro_config")
  pomodoroSessions    Json?    @map("pomodoro_sessions")  // Array<PomodoroSession>
  syncedToCalendar    Boolean  @default(false) @map("synced_to_calendar")
  calendarEventId     String?  @map("calendar_event_id")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  task                Task     @relation(fields: [taskUuid], references: [uuid])
  user                Account  @relation(fields: [userUuid], references: [uuid])

  @@index([taskUuid])
  @@index([userUuid, startTime, endTime])
  @@index([userUuid, status])
  @@map("time_blocks")
}

// 更新 Task 模型
model Task {
  // ...existing fields...

  estimatedTime           Int?         @map("estimated_time")  // 分钟
  actualTime              Int?         @map("actual_time")
  timeEstimationAccuracy  Float?       @map("time_estimation_accuracy")

  timeBlocks              TimeBlock[]
}
```

### Application Service

```typescript
// packages/domain-server/src/modules/task/application/ScheduleTimeBlockService.ts

export class ScheduleTimeBlockService {
  async execute(
    taskUuid: string,
    userUuid: string,
    startTime: number,
    endTime: number,
    mode: TimeBlockMode,
    pomodoroConfig?: PomodoroConfig,
  ): Promise<TimeBlock> {
    // 1. 加载任务
    const task = await this.taskRepository.findByUuid(taskUuid);

    // 2. 冲突检测
    const conflicts = await this.detectConflicts(userUuid, startTime, endTime);
    if (conflicts.length > 0) {
      throw new TimeBlockConflictError(conflicts);
    }

    // 3. 创建时间块
    const duration = (endTime - startTime) / 60000; // 转换为分钟
    const timeBlock = new TimeBlock({
      taskUuid,
      userUuid,
      startTime,
      endTime,
      duration,
      mode,
      status: TimeBlockStatus.SCHEDULED,
      pomodoroConfig,
    });

    // 4. 保存
    await this.timeBlockRepository.save(timeBlock);

    // 5. 同步到日历（可选）
    if (syncToCalendar) {
      await this.calendarService.createEvent(timeBlock);
    }

    // 6. 发布事件
    await this.eventBus.publish(
      new TimeBlockScheduledEvent({
        timeBlockUuid: timeBlock.uuid,
        taskUuid,
        startTime,
      }),
    );

    return timeBlock;
  }

  private async detectConflicts(
    userUuid: string,
    startTime: number,
    endTime: number,
  ): Promise<TimeBlock[]> {
    return this.timeBlockRepository.findOverlapping(userUuid, startTime, endTime, [
      TimeBlockStatus.SCHEDULED,
      TimeBlockStatus.IN_PROGRESS,
    ]);
  }
}
```

### API 端点

```typescript
// 创建时间块
POST /api/v1/tasks/:taskUuid/time-blocks
Body: {
  startTime: number,
  endTime: number,
  mode: 'continuous' | 'pomodoro' | 'custom',
  pomodoroConfig?: PomodoroConfig,
  syncToCalendar?: boolean
}
Response: TimeBlockClientDTO

// 开始时间块
POST /api/v1/time-blocks/:uuid/start
Response: TimeBlockClientDTO

// 暂停时间块
POST /api/v1/time-blocks/:uuid/pause
Response: TimeBlockClientDTO

// 完成时间块
POST /api/v1/time-blocks/:uuid/complete
Response: TimeBlockClientDTO

// 取消时间块
DELETE /api/v1/time-blocks/:uuid
Response: { success: boolean }

// 获取用户的时间块列表（日历视图）
GET /api/v1/time-blocks?startDate=xxx&endDate=xxx
Response: { timeBlocks: TimeBlockClientDTO[] }

// 批量安排时间块
POST /api/v1/time-blocks/batch-schedule
Body: {
  taskUuids: string[],
  date?: string,  // 可选，默认今天
  acceptRecommendation?: boolean
}
Response: {
  timeBlocks: TimeBlockClientDTO[],
  recommendations?: TimeBlockRecommendation[]
}
```

---

## 8. 风险与缓解

| 风险             | 可能性 | 影响 | 缓解措施                     |
| ---------------- | ------ | ---- | ---------------------------- |
| 用户不遵守时间块 | 高     | 中   | 提供灵活调整，允许延迟开始   |
| 时间块过度刚性   | 中     | 中   | 支持拖拽调整、批量取消       |
| 番茄钟被频繁打断 | 中     | 低   | 记录中断次数，提供专注度分析 |
| 日历同步延迟     | 低     | 中   | 异步队列处理，失败重试       |
| 时间冲突复杂场景 | 中     | 高   | 智能推荐多个调整方案         |

---

## 9. 后续增强方向

### Phase 2 功能

- 🔄 时间块自动调整（当前任务延期时，自动顺延后续时间块）
- 📊 时间利用率分析（每日/每周工作时长统计）
- 🧠 专注度热力图（识别最高效时间段）
- 👥 团队时间块可见性（查看团队成员的忙碌时段）

### Phase 3 功能

- 🤖 AI 时间块推荐（基于历史数据推荐最佳执行时间）
- 🔗 与会议日历深度集成（自动避开会议时间）
- 📱 移动端番茄钟专注模式（屏蔽通知）
- 🎵 专注音乐集成（番茄钟期间播放专注音乐）

---

## 10. 参考资料

- [番茄工作法](https://en.wikipedia.org/wiki/Pomodoro_Technique)
- [时间盒（Time Boxing）](https://en.wikipedia.org/wiki/Timeboxing)
- [Task Contracts](../../../../packages/contracts/src/modules/task/)
- [Schedule 模块文档](../../schedule/features/README.md)

---

**文档状态**: ✅ Ready for PM Review  
**下一步**: PM 生成 Project Flow

---

**文档维护**:

- 创建: 2025-10-21
- 创建者: PO Agent
- 版本: 1.0
- 下次更新: Sprint Planning 前
