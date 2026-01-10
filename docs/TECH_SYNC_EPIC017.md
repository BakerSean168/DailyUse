# Tech Sync 讨论指南：EPIC-017 重构 Utils + 创建 Patterns

> **会议时间：** 待定（建议 1.5 小时）  
> **参加人员：** 技术主管、后端开发、Desktop 开发、前端开发  
> **前置阅读：** [拼项目.md](./拼项目.md) + [EPIC-017](./EPIC-017-refactoring-utils-patterns.md)（可选但推荐）

---

## 📋 会议议程

| 时间 | 内容 | 主持 | 时长 |
|------|------|------|------|
| **5 min** | 欢迎 + 议程概览 | Tech Lead | 5 min |
| **15 min** | 【演讲】架构现状和问题诊断 | Architect | 15 min |
| **15 min** | 【演讲】解决方案：L4.5 Patterns + Utils 清理 | Architect | 15 min |
| **10 min** | 【演讲】重构工作分解（7 个 Story） | Tech Lead | 10 min |
| **25 min** | 【讨论】技术决策和风险评估 | All | 25 min |
| **10 min** | 【讨论】团队分工和时间表 | Tech Lead | 10 min |
| **10 min** | 【总结】决议和后续行动 | Tech Lead | 10 min |
| **5 min** | Q&A | All | 5 min |

**总计：** 95 分钟

---

## 🎯 演讲稿 Part 1：架构现状和问题诊断（15 min）

### 开场（2 min）

---

大家好！今天我想和大家讨论一个重要的架构优化工作：**EPIC-017 - 重构 Utils 包和创建 Patterns 包**。

这个 EPIC 的目标很明确：**让 DailyUse 的容器组装变得更优雅、更高效**。

我们先从现状开始。

---

### 现状回顾（3 min）

DailyUse 采用的是 **五层积木塔架构**：

```
L5: Apps (Desktop / API / Web)
L4: Application Services
L3: Infrastructure
L2: Domain Models
L1: Contracts
```

这个架构的优点很明显：
- ✅ Desktop、API、Web 共享同一套业务逻辑（L2-L4）
- ✅ 数据库实现可快速替换（Prisma ↔ MongoDB）
- ✅ 新应用可快速集成现有积木

**但是，** 我们在实践中遇到了三个问题。

---

### 问题 1：Utils 包混杂（3 min）

**当前 @dailyuse/utils 包含了四类完全不同的代码：**

```
utils/
├── domain/               ✅ DDD 基础（AggregateRoot 等）
├── shared/
│   ├── logger.ts        ✅ 框架工具
│   ├── date-utils.ts    ✅ 通用函数
│   ├── priority-calculator.ts  ❌ 业务逻辑（Schedule 特定）
│   └── recurrence.ts    ❌ 业务逻辑（Schedule 特定）
├── errors/
│   ├── DomainError.ts   ✅ 基类
│   └── ReminderErrors.ts ❌ 业务错误（Reminder 特定）
└── frontend/            ✅ 前端工具
```

**问题在哪？**
- 新开发者不知道什么时候用 utils、什么时候用 domain-server
- Schedule 的优先级计算为什么要放在 utils？Reminder 的错误为什么要放这里？
- 当修改优先级算法时，不清楚会影响哪些模块

**现实中发生过的混乱：**
- A 开发者在 utils 中添加了 priority-calculator
- B 开发者在 domain-server/schedule 中又写了一个优先级计算函数
- 结果：两份代码，各自维护，有时候不一致

---

### 问题 2：通用框架分散（3 min）

**目前，通用框架散落在 application-server 中：**

```
application-server/
└── src/schedule/scheduler/
    ├── MinHeap.ts               ← 通用数据结构
    ├── BaseTaskQueue.ts         ← 通用任务队列框架
    ├── IScheduleTimer.ts        ← 通用计时器接口
    └── ScheduleTaskQueue.ts     ← Schedule 特定实现
```

**问题在哪？**
- MinHeap、BaseTaskQueue 是 **完全通用的**，任何模块都能用
- 但它们被藏在 application-server/schedule/ 下
- 新增模块（Goal、Task、Reminder）如果想复用 BaseTaskQueue，怎么办？
  - 方案 A：copy-paste（代码重复 ❌）
  - 方案 B：反向依赖 application-server（违反依赖规则 ❌）
  - 方案 C：没有好方案（现状 ❌）

---

### 问题 3：容器组装困难（2 min）

**没有清晰的模式，每个应用都在摸索：**

```
apps/desktop/
  ├── 创建 Composition Root
  ├── 初始化 L3 的 Container
  ├── 注入 L4 的 Services
  └── ...很多重复代码

apps/api/
  ├── 创建 Composition Root
  ├── 初始化 L3 的 Container
  ├── 注入 L4 的 Services
  └── ...同样的代码，不同的文件

新增应用（Mobile、CLI）:
  ├── ???（需要从头开始学习）
  └── ???（无法快速复用）
```

---

## 🎯 演讲稿 Part 2：解决方案（15 min）

### 核心思路（2 min）

---

我们的解决方案基于一个简单的想法：

**将五层架构升级为 "五层半" 架构，引入 L4.5 Patterns 层。**

```
L5: Apps
L4: Application Services (业务编排)
L4.5: Generic Patterns (通用框架) ← 新增
L3: Infrastructure
L2: Domain
L1: Contracts
```

**核心逻辑：**
- L4 是 **业务特定** 的：ScheduleApplicationService、GoalApplicationService
- L4.5 是 **完全通用** 的：BaseTaskQueue、MinHeap、BaseRepository
- 分离它们，让所有 L4 都能复用

---

### 方案 1：创建 @dailyuse/patterns 包（4 min）

**新增 patterns 包的完整结构：**

```
@dailyuse/patterns/
├── scheduler/
│   ├── BaseTaskQueue.ts         # 抽象基类，待子类实现 execute() 和 compare()
│   ├── MinHeap.ts               # 优先级队列数据结构
│   ├── IScheduleTimer.ts        # 可插拔的计时器接口
│   └── IScheduleMonitor.ts      # 监控接口（统计、告警）
├── repository/
│   ├── BaseRepository.ts        # 通用仓储基类
│   └── QueryObject.ts           # 查询对象基类
├── cache/
│   ├── LRUCache.ts
│   └── TTLCache.ts
└── events/
    ├── BaseEventHandler.ts
    └── EventDispatcher.ts
```

**关键特性：**
- ✅ **零业务逻辑** - 只有算法和框架
- ✅ **零外部依赖** - 仅依赖 @dailyuse/contracts
- ✅ **高度可复用** - 任何 L4 都能继承 BaseTaskQueue
- ✅ **易于测试** - 通用模式可独立测试

**使用示例：**

```typescript
// 现在（L4 特定实现）
export class ScheduleTaskQueue extends BaseTaskQueue<ScheduleTask> {
  compare(a: ScheduleTask, b: ScheduleTask): number {
    return b.priority - a.priority;  // Schedule 特定的优先级逻辑
  }

  async execute(task: ScheduleTask): Promise<void> {
    // Schedule 特定的执行逻辑
  }
}

// 未来（Goal 模块可复用同样的框架）
export class GoalTaskQueue extends BaseTaskQueue<GoalTask> {
  compare(a: GoalTask, b: GoalTask): number {
    return b.dueDate.getTime() - a.dueDate.getTime();
  }

  async execute(task: GoalTask): Promise<void> {
    // Goal 特定的执行逻辑
  }
}
```

---

### 方案 2：清理 Utils 包（5 min）

**职责重新划分表：**

| 代码 | 当前位置 | 应该去哪 | 理由 |
|------|---------|---------|------|
| AggregateRoot、Entity、ValueObject | utils/domain/ | ✅ 保持 | DDD 基础 |
| logger、response、date-utils | utils/shared/ | ✅ 保持 | 通用工具 |
| priority-calculator | utils/shared/ | domain-server/schedule/calculators/ | Schedule 业务逻辑 |
| recurrence | utils/shared/ | domain-server/schedule/calculators/ | Schedule 业务逻辑 |
| ReminderErrors | utils/errors/ | domain-server/reminder/errors/ | Reminder 业务逻辑 |
| MinHeap | application-server/scheduler/ | patterns/scheduler/ | 通用框架 |
| BaseTaskQueue | application-server/scheduler/ | patterns/scheduler/ | 通用框架 |

**迁移后的效果：**

```
utils/          【精简版】
├── domain/     DDD 基础 ✅
├── shared/     通用工具 ✅
├── errors/     DomainError 基类 ✅
└── frontend/   前端工具 ✅

domain-server/  【完整版】
├── schedule/
│   ├── aggregates/     ScheduleTask 聚合根
│   ├── calculators/    priority-calculator ✅ 新增
│   └── errors/         ScheduleErrors
├── reminder/
│   └── errors/         ReminderErrors ✅ 新增
└── ...

patterns/       【新建】
├── scheduler/
│   ├── BaseTaskQueue   ✅ 从 application-server 移来
│   ├── MinHeap         ✅ 从 application-server 移来
│   └── ...
└── ...
```

**好处：**
- 💡 优先级计算靠近 Schedule 聚合根，更容易理解业务逻辑
- 💡 Reminder 错误在 Reminder 模块，一目了然
- 💡 通用框架集中在 patterns，易于复用和维护
- 💡 Utils 包变小变精，职责清晰

---

### 方案 3：标准化容器组装（2 min）

**定义 Composition Root 的标准模式：**

```typescript
// Step 1: 在 L4 中定义容器工厂
export function createApplicationContainer(prisma: PrismaClient): ApplicationContainer {
  const scheduleRepository = new PrismaScheduleRepository(prisma);
  const createScheduleUseCase = new CreateScheduleUseCase(scheduleRepository);
  
  return {
    scheduleService: new ScheduleApplicationService(createScheduleUseCase, ...),
    scheduleRepository,
  };
}

// Step 2: 在各 L5 应用中复用
// apps/desktop/main/container.ts
export function createDesktopContainer(): DesktopContainer {
  const appContainer = createApplicationContainer(createLocalDb());
  return {
    scheduleService: appContainer.scheduleService,
    scheduler: new DesktopScheduler(appContainer.scheduleRepository),
    ipcBridge: new ElectronIPCBridge(appContainer),
  };
}

// apps/api/container.ts
export function createAPIContainer(): APIContainer {
  const appContainer = createApplicationContainer(createRemoteDb());
  return {
    scheduleService: appContainer.scheduleService,
    // ... API 特定的配置
  };
}
```

**效果：**
- 同一个 ApplicationContainer 被 Desktop、API、Web 复用
- 各应用只需添加自己的框架集成层
- 新应用只需 1-2 小时就能集成，而不是 1-2 天

---

## 🎯 演讲稿 Part 3：工作分解（10 min）

### 高层时间表（2 min）

---

**EPIC-017 分为 7 个 Story，预计 1.5-2 个 sprint 完成：**

```
Week 1
  Story 1: 创建 @dailyuse/patterns 包          (2-3 h)
  Story 2: 迁移通用框架到 patterns             (4-5 h)

Week 2
  Story 3: 迁移业务计算到 domain-server        (3-4 h)
  Story 4: 清理 utils 包                       (2-3 h)
  Story 5: 更新所有导入语句                     (5-6 h)

Week 2-3
  Story 6: 更新依赖声明和 Nx 配置              (2-3 h)
  Story 7: 测试、文档和最终验证                (4-5 h)

Buffer: 4-5 小时
总计: 27-35 小时 ≈ 1.5-2 sprints
```

---

### Story 简要说明（8 min）

**Story 1: 创建 @dailyuse/patterns 包**
- 使用 Nx 生成库
- 创建子目录结构（scheduler、repository、cache、events）
- 设置 package.json 和导出
- 预计时间：2-3 小时

**Story 2: 迁移通用框架到 patterns**
- 复制 MinHeap、BaseTaskQueue、IScheduleTimer 等
- 编写单元测试
- 验证类型检查和测试
- 预计时间：4-5 小时

**Story 3: 迁移业务计算到 domain-server**
- 移动 priority-calculator 到 domain-server/schedule/calculators/
- 移动 recurrence 到 domain-server/schedule/calculators/
- 移动 ReminderErrors 到 domain-server/reminder/errors/
- 预计时间：3-4 小时

**Story 4: 清理 utils 包**
- 删除已移走的文件
- 更新 utils/src/index.ts 导出清单
- 验证 utils 的完整性
- 预计时间：2-3 小时

**Story 5: 更新所有导入语句**
- 在 6 个 packages + 3 个 apps 中更新导入
- 这是工作量最大的 Story
- 预计时间：5-6 小时

**Story 6: 更新依赖声明和 Nx 配置**
- 更新各 package.json 的依赖
- 更新 nx.json 的模块边界规则
- 运行 pnpm nx lint 验证
- 预计时间：2-3 小时

**Story 7: 测试、文档和验证**
- 运行全套测试：`pnpm nx run-many -t test`
- 运行全套类型检查：`pnpm nx run-many -t typecheck`
- 运行全套 linting：`pnpm nx lint`
- 更新文档
- 预计时间：4-5 小时

---

## 💬 讨论环节要点（25 min）

### 讨论议题 1：技术决策（8 min）

---

**议题 1.1：Patterns 包的命名**

| 选项 | 优点 | 缺点 |
|------|------|------|
| `@dailyuse/patterns` | 明确指出是设计模式库 | - |
| `@dailyuse/framework` | 说明是框架层 | 容易与框架概念混淆 |
| `@dailyuse/common` | 简短好记 | 太通用，不够明确 |

**建议：** `@dailyuse/patterns` ✅

---

**议题 1.2：BaseRepository 的位置**

问题：BaseRepository 应该在 patterns 还是 infrastructure？

答案：**应该在 patterns**
- Infrastructure 是具体实现（PrismaRepository、MongoDB Repository）
- Patterns 是基类模板，与技术无关
- 基类应该独立，被所有 infrastructure 包依赖

---

**议题 1.3：Utils 中的业务计算该不该保留一份**

问题：priority-calculator 移走后，utils 中还需要保留一份吗？

答案：**不需要**
- 完全迁移到 domain-server/schedule/calculators/
- domain-server 就是它的"家"
- 如果其他模块需要，在各自的 domain 中实现

---

### 讨论议题 2：风险评估（10 min）

---

**风险 1：导入遗漏导致应用崩溃（High）**

| 风险 | 缓解方案 |
|------|---------|
| 更新 imports 时遗漏某些地方 | • 自动化搜索替换<br>• 逐个应用构建和测试<br>• Code review 时特别检查 |

---

**风险 2：循环依赖引入（High）**

| 风险 | 缓解方案 |
|------|---------|
| patterns → domain（应该不允许）<br>或 domain → patterns（可以允许） | • 在每个 Story 完成后运行 `pnpm nx lint`<br>• Story 5 末尾的依赖检查<br>• CI pipeline 中加入检查 |

---

**风险 3：业务逻辑破坏（High）**

| 风险 | 缓解方案 |
|------|---------|
| 迁移 priority-calculator 时意外改变行为 | • 迁移前确保有完善的单元测试<br>• 迁移后运行全套测试验证<br>• 在 Schedule 模块中重点测试 |

---

**风险 4：类型兼容性问题（Medium）**

| 风险 | 缓解方案 |
|------|---------|
| BaseTaskQueue 的泛型参数在各模块中类型不兼容 | • 逐个包进行类型检查<br>• 修复后再进行下一步 |

---

**风险 5：团队理解成本（Medium）**

| 风险 | 缓解方案 |
|------|---------|
| 开发者不理解新的架构结构 | • 发布详细的迁移指南<br>• 进行 Tech Sync 演讲（现在进行中！）<br>• 在 Slack 分享文档链接<br>• 设置办公时间答疑 |

---

### 讨论议题 3：预期收益和指标（7 min）

---

**收益 1：代码复用率提升**

| 场景 | 当前 | 完成后 |
|------|------|--------|
| 新模块实现 TaskQueue | Copy-paste MinHeap (40 行) | 继承 BaseTaskQueue (5 行) |
| 新模块实现 Repository | Copy-paste Repository 基类 | 继承 BaseRepository |

**预期指标：** 代码重复度降低 20-30%

---

**收益 2：新模块开发速度**

| 场景 | 当前 | 完成后 |
|------|------|--------|
| 新增 Goal 模块 | 3 天（含框架编写） | 1-2 天（直接用 patterns） |
| 新增 Mobile 应用 | 一周（含 patterns 从零开始） | 2-3 天（直接用现有积木） |

**预期指标：** 新模块开发速度提升 30-50%

---

**收益 3：代码质量改善**

- ✅ 业务逻辑集中在 domain 层，容易理解
- ✅ 通用框架独立维护，可专注优化
- ✅ 职责清晰，减少混乱和重复
- ✅ Nx lint 强制执行依赖规则

---

## 🤝 讨论议题 4：团队分工和时间表（10 min）

### 分工建议（5 min）

---

**建议：集中分配给 2-3 个开发者，争取 1.5-2 个 sprint 内完成**

**分配方案 A：2 人分工**

| 开发者 | 负责 Story | 时间 |
|--------|-----------|------|
| 开发者 A（后端） | Story 1, 2, 3, 4 | 1.5 weeks |
| 开发者 B（全栈） | Story 5, 6, 7 | 1.5 weeks |
| 其他团队 | Review & feedback | 整个周期 |

---

**分配方案 B：3 人分工**

| 开发者 | 负责 Story | 时间 |
|--------|-----------|------|
| 开发者 A（后端） | Story 1, 2 | 1 week |
| 开发者 B（后端） | Story 3, 4, 6 | 1 week |
| 开发者 C（全栈） | Story 5, 7 | 1 week |
| 其他团队 | Review & feedback | 整个周期 |

---

### 时间表规划（5 min）

---

**第 1 周：**
```
Monday    Story 1 启动（创建 patterns 包）
Wednesday Story 1 完成，Story 2 启动（迁移通用框架）
Friday    Story 2 完成，Review & Testing
```

**第 2 周：**
```
Monday    Story 3 启动（迁移业务计算）
Tuesday   Story 3 完成，Story 4 启动（清理 utils）
Wednesday Story 4 完成，Story 5 启动（更新导入）
Friday    Story 5 完成，全局 typecheck
```

**第 3 周：**
```
Monday    Story 6 启动（更新依赖）
Tuesday   Story 6 完成，Story 7 启动（测试和文档）
Friday    Story 7 完成，EPIC 验收
```

---

## 📌 总结：决议和后续行动（10 min）

### 核心决议（2 min）

---

**决议 1：批准 EPIC-017 的执行**
- ☐ 同意创建 @dailyuse/patterns 包
- ☐ 同意清理 @dailyuse/utils 包
- ☐ 同意标准化容器组装模式

**投票：** 是否批准？

---

**决议 2：确认分工**
- ☐ 确认负责开发者（2-3 人）
- ☐ 确认开始时间
- ☐ 确认 Review 机制

**提议：** 下周一启动 Story 1，谁可以接受？

---

**决议 3：确认通信计划**
- ☐ 每日站会中汇报进度
- ☐ Story 完成后进行 Review
- ☐ 周五进行 Sprint 回顾

**提议：** 是否同意此通信计划？

---

### 后续行动（3 min）

---

**这周（立即）：**
1. 团队批准 EPIC-017
2. 指定负责开发者
3. 在 Slack 分享文档链接

**周五前：**
1. 负责开发者阅读 EPIC-017 完整版
2. 负责开发者准备 Story 1 的实现计划
3. Tech Lead 准备 GitHub Epic 和 Issues

**下周一：**
1. 开发者正式启动 Story 1
2. 每日站会中汇报进度

---

### 项目管理（2 min）

---

**GitHub 管理：**
```
EPIC: EPIC-017 - Refactor Utils & Create Patterns
├── Story 1: Create @dailyuse/patterns package
├── Story 2: Migrate generic frameworks to patterns
├── Story 3: Migrate business logic to domain-server
├── Story 4: Clean up @dailyuse/utils
├── Story 5: Update all imports across monorepo
├── Story 6: Update dependency declarations
└── Story 7: Testing, documentation, and verification
```

**进度跟踪：**
- 每周更新 Story 的完成度
- 每个 Story 完成后标记为 Done
- 识别阻碍并及时反馈

---

## ❓ Q&A 和常见问题

### Q1: 为什么不现在就重构？

**A:** 
- 当前 application-server 中的框架运行良好
- 但随着新模块增加（Goal、Task、Reminder），重复代码会增多
- **现在重构** 的好处是：
  1. Schedule 模块已基本稳定（EPIC-016 完成）
  2. 其他模块还没有实现 TaskQueue，避免重复改动
  3. 一次性到位，避免多次折腾

---

### Q2: 这个重构会影响现有功能吗？

**A:** 
- ❌ **不会** - 完全后向兼容
- 我们不改变任何业务逻辑
- 只是移动代码、更新导入
- 迁移完成后所有测试应该 100% 通过

---

### Q3: 如果重构中途出了问题怎么办？

**A:**
- 每个 Story 都有明确的验收标准
- Story 完成后会进行全面的 typecheck 和测试
- 如果发现问题，可以暂停并修复
- 我们有 buffer time（4-5 小时）用于处理突发问题

---

### Q4: 新开发者会不会因为架构变化而困惑？

**A:**
- 我们已经准备了详细的文档：
  1. [拼项目.md](./拼项目.md) - 五层架构完整讲解
  2. [Package Implementation Guide](./package-implementation-guide.md) - 实现细节
  3. [EPIC-017](./EPIC-017-refactoring-utils-patterns.md) - 迁移指南
- 这些文档不仅讲现状，还讲为什么这样做
- 新开发者可以快速上手

---

### Q5: BaseTaskQueue 是否会破坏现有的 ScheduleTaskQueue？

**A:**
- 不会 - ScheduleTaskQueue 将继承 BaseTaskQueue
- 公共接口保持不变（start, stop, pause, resume 等）
- 内部实现会更清晰（compare() 和 execute() 抽象方法）
- 迁移后需要一个小的 PR 来更新继承关系，但功能完全一致

---

### Q6: Utils 清理后，为什么不干脆删除 utils 包？

**A:**
- Utils 包虽然变小，但仍然很重要：
  1. DDD 基础类（AggregateRoot 等）必须存在
  2. 通用工具（logger、date-utils）被所有应用依赖
  3. 删除 utils 会影响大量代码
- 更好的方式是清理它，让它更精、更小、更专注

---

### Q7: 如果有其他开发者同时在修改相关代码会怎样？

**A:**
- 这是个真实的风险
- **建议：** 
  1. 暂停其他涉及 utils、application-server 的 PR
  2. EPIC-017 的 Story 4 和 5 是关键期（会修改大量导入）
  3. Story 5 期间尽量不要有其他并行 PR
- **预计时间：** Story 4-5 共 7-9 小时，应该可以在 1-2 天内完成

---

## 📚 附件：参考文档

### 前置阅读（推荐）

| 文档 | 时间 | 内容 |
|------|------|------|
| [拼项目.md](./拼项目.md) | 60 min | 五层架构、案例分析、utils 清理 |
| [Package Implementation Guide](./package-implementation-guide.md) | 45 min | 每层的实现规范、容器组装 |

### 详细参考

| 文档 | 用途 |
|------|------|
| [EPIC-017 完整版](./EPIC-017-refactoring-utils-patterns.md) | Story 详细说明、验收标准、风险分析 |
| [Desktop Architecture](./desktop-architecture.md) | 了解 Desktop 如何使用 patterns |
| [ARCHITECTURE_SUMMARY.md](./ARCHITECTURE_SUMMARY.md) | 快速参考和总结 |

---

## 📝 会议后的行动清单

### 主持人（Tech Lead）

- [ ] 记录会议决议
- [ ] 更新 GitHub Epic 和 Issues
- [ ] 发送会议总结到 Slack
- [ ] 设置 Daily Standup 的讨论话题

### 负责开发者（Story Implementers）

- [ ] 完整阅读 [EPIC-017](./EPIC-017-refactoring-utils-patterns.md)
- [ ] 制定每个 Story 的实现计划
- [ ] 准备开发环境（branching strategy 等）
- [ ] 下周一正式启动

### 全体开发者

- [ ] 阅读 [拼项目.md](./拼项目.md) 了解新架构
- [ ] 在 EPIC-017 期间，避免修改相关代码
- [ ] 准备在 Code Review 中特别关注导入和依赖

---

**会议主持人签署：** ________________  
**记录人：** ________________  
**日期：** 2026-01-08  

---

**下一步：** 
如无异议，EPIC-017 将于下周一启动。祝大家重构顺利！🚀

