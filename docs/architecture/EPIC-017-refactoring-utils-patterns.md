# EPIC-017: 重构 Utils 包 + 创建 Patterns 包

**EPIC ID:** EPIC-017  
**主题:** 分离通用模式，清理 Utils 包，实现优雅的容器组装  
**优先级:** High  
**预期周期:** 2 sprints (3-4 weeks)  
**相关文档:** 
- [Package Implementation Guide](./package-implementation-guide.md)
- [拼项目.md](./拼项目.md)
- [Desktop Architecture](./desktop-architecture.md)

---

## 问题陈述

### 当前状态

1. **Utils 包混杂**：`@dailyuse/utils` 包含了不相关的概念：
   - ✅ DDD 基础类（应该保留）
   - ✅ 框架工具（应该保留）
   - ❌ 业务计算（priority-calculator、recurrence）
   - ❌ 业务错误（ReminderErrors）

2. **通用模式分散**：优先队列、任务队列基类等通用框架散落在 `application-server` 中，难以被其他模块复用
   - ❌ MinHeap 在 `application-server/schedule/scheduler/`
   - ❌ BaseTaskQueue 在 `application-server/schedule/scheduler/`
   - 其他模块（Goal、Task、Reminder）无法复用

3. **容器组装困难**：由于职责不清，新增应用（如 Mobile、CLI）很难正确组装依赖

### 期望状态

```
@dailyuse/utils        精简化 - 仅包含基础工具
  ├─ domain/           DDD 基础类
  ├─ shared/           通用函数（date、uuid 等）
  ├─ errors/           DomainError 基类
  └─ frontend/         前端工具

@dailyuse/patterns     新建 - 通用框架
  ├─ scheduler/        BaseTaskQueue、MinHeap、IScheduleTimer
  ├─ repository/       BaseRepository、QueryObject
  ├─ cache/            LRUCache、TTLCache
  └─ events/           BaseEventHandler

domain-server/         完整 - 业务特定
  └─ schedule/
      ├─ aggregates/   Schedule 聚合根
      ├─ calculators/  priority-calculator、recurrence ✅ 新移入
      └─ errors/       ScheduleErrors

domain-server/         完整 - 业务特定  
  └─ reminder/
      └─ errors/       ReminderErrors ✅ 新移入

application-server/    清爽 - 仅编排
  └─ schedule/
      ├─ services/     ScheduleApplicationService
      └─ usecases/     CreateSchedule、CompleteSchedule
```

---

## 成功标准

- ✅ `@dailyuse/patterns` 包创建完成，包含所有通用框架
- ✅ Utils 包清理，无业务特定代码
- ✅ 所有导入更新（6 个 packages + 3 个 apps）
- ✅ 类型检查通过（`pnpm nx run-many -t typecheck`）
- ✅ 所有单元测试通过（`pnpm nx run-many -t test:unit`）
- ✅ 文档更新完成（Package 导出清单、迁移指南）
- ✅ 无 Nx 依赖边界违规（`pnpm nx lint`）

---

## 工作分解 (Stories)

### Story 1: 创建 @dailyuse/patterns 包

**描述:** 创建新的 patterns 包，定义所有通用框架的基结构。

**任务:**

1. 使用 Nx 生成库：
   ```bash
   nx generate @nx/js:library patterns --tags scope:patterns
   ```

2. 创建子目录和 index.ts：
   ```
   packages/patterns/
   ├── src/
   │   ├── scheduler/
   │   │   ├── BaseTaskQueue.ts
   │   │   ├── IScheduleTimer.ts
   │   │   ├── IScheduleMonitor.ts
   │   │   ├── priority-queue/
   │   │   │   ├── MinHeap.ts
   │   │   │   ├── HeapNode.ts
   │   │   │   └── index.ts
   │   │   └── index.ts
   │   ├── repository/
   │   │   ├── BaseRepository.ts
   │   │   ├── QueryObject.ts
   │   │   └── index.ts
   │   ├── cache/
   │   │   ├── LRUCache.ts
   │   │   ├── TTLCache.ts
   │   │   └── index.ts
   │   ├── events/
   │   │   ├── BaseEventHandler.ts
   │   │   ├── EventDispatcher.ts
   │   │   └── index.ts
   │   └── index.ts
   └── package.json
   ```

3. 设置 package.json exports：
   ```json
   {
     "exports": {
       "./scheduler": "./src/scheduler/index.ts",
       "./repository": "./src/repository/index.ts",
       "./cache": "./src/cache/index.ts",
       "./events": "./src/events/index.ts"
     }
   }
   ```

4. 更新 nx.json 依赖规则：
   - patterns 只依赖 contracts
   - patterns 被 application-server、application-client 依赖

**验收标准:**
- [ ] Package 创建成功
- [ ] 所有子模块的 index.ts 已创建
- [ ] 可成功从其他包导入（即使文件为空）
- [ ] Nx 依赖检查通过

**负责人:** [@assign]  
**预期时间:** 2-3 hours  
**阻碍:** 无

---

### Story 2: 迁移通用框架到 Patterns 包

**描述:** 将通用模式从 application-server 移到 patterns 包。

**文件移动列表:**

```
From                                              To
─────────────────────────────────────────────────────────────
application-server/src/schedule/scheduler/
├─ MinHeap.ts                          →  patterns/src/scheduler/priority-queue/MinHeap.ts
├─ HeapNode.ts                         →  patterns/src/scheduler/priority-queue/HeapNode.ts
├─ BaseTaskQueue.ts                    →  patterns/src/scheduler/BaseTaskQueue.ts
├─ IScheduleTimer.ts                   →  patterns/src/scheduler/IScheduleTimer.ts
└─ IScheduleMonitor.ts                 →  patterns/src/scheduler/IScheduleMonitor.ts
```

**具体步骤:**

1. 复制文件到 patterns 包（不删除原始文件）
2. 在 patterns 的 index.ts 中导出：
   ```typescript
   export * from './scheduler';
   export * from './repository';
   export * from './cache';
   export * from './events';
   ```

3. 验证代码质量：
   - [ ] MinHeap.ts 无业务逻辑，仅是数据结构
   - [ ] BaseTaskQueue.ts 是抽象基类，抽象方法待子类实现
   - [ ] 所有接口（IScheduleTimer 等）与框架无关

4. 编写或迁移单元测试：
   ```bash
   patterns/src/__tests__/
   ├─ scheduler/
   │  ├─ MinHeap.spec.ts
   │  ├─ BaseTaskQueue.spec.ts
   │  └─ ...
   ```

**验收标准:**
- [ ] 所有通用框架代码已复制到 patterns
- [ ] patterns 包的 index.ts 能导出所有文件
- [ ] 类型检查通过：`pnpm nx typecheck patterns`
- [ ] 单元测试全部通过：`pnpm nx test patterns`

**负责人:** [@assign]  
**预期时间:** 4-5 hours  
**阻碍:** 需确保没有业务逻辑混入

---

### Story 3: 迁移业务计算到 Domain-Server

**描述:** 将业务特定的计算代码从 utils 移到各模块的 domain 层。

**文件移动列表:**

```
From                                              To
─────────────────────────────────────────────────────────────
utils/src/shared/
├─ priority-calculator.ts              →  domain-server/src/schedule/calculators/priority-calculator.ts
├─ recurrence.ts                       →  domain-server/src/schedule/calculators/recurrence.ts
└─ ...

utils/src/errors/
└─ ReminderErrors.ts                   →  domain-server/src/reminder/errors/ReminderErrors.ts
```

**具体步骤:**

1. 在 domain-server 中创建新目录结构：
   ```bash
   mkdir -p packages/domain-server/src/schedule/calculators
   mkdir -p packages/domain-server/src/reminder/errors
   ```

2. 复制文件：
   ```bash
   cp utils/src/shared/priority-calculator.ts \
      domain-server/src/schedule/calculators/
   cp utils/src/shared/recurrence.ts \
      domain-server/src/schedule/calculators/
   cp utils/src/errors/ReminderErrors.ts \
      domain-server/src/reminder/errors/
   ```

3. 在对应的 index.ts 中添加导出：
   ```typescript
   // domain-server/src/schedule/calculators/index.ts
   export * from './priority-calculator';
   export * from './recurrence';

   // domain-server/src/schedule/index.ts
   export * from './calculators';
   ```

4. 验证移动后的代码：
   - [ ] 所有导入路径已验证
   - [ ] 代码功能保持不变（通过现有测试）
   - [ ] 与 Domain 层的其他代码兼容

**验收标准:**
- [ ] 所有业务计算代码已移到对应的 domain 模块
- [ ] domain-server 包的类型检查通过
- [ ] 单元测试全部通过
- [ ] 原 utils 中的文件已删除（或标记为 deprecated）

**负责人:** [@assign]  
**预期时间:** 3-4 hours  
**阻碍:** 需确保业务逻辑完全性

---

### Story 4: 更新 Utils 包导出

**描述:** 清理 utils 包，删除已移走的代码，更新导出清单。

**具体步骤:**

1. 删除以下文件（已移走）：
   ```bash
   rm packages/utils/src/shared/priority-calculator.ts
   rm packages/utils/src/shared/recurrence.ts
   rm packages/utils/src/errors/ReminderErrors.ts
   ```

2. 更新 utils/src/index.ts，仅导出保留的模块：
   ```typescript
   // ✅ DDD 基础
   export * from './domain/AggregateRoot';
   export * from './domain/Entity';
   export * from './domain/ValueObject';
   
   // ✅ 框架工具
   export * from './shared/logger';
   export * from './shared/response';
   export * from './shared/event';
   export * from './shared/date-utils';
   export * from './shared/uuid-utils';
   export * from './shared/debounce';
   export * from './shared/throttle';
   
   // ✅ 错误基类
   export * from './errors/DomainError';
   
   // ✅ 前端工具
   export * from './frontend/initialization';
   
   // ❌ 不导出已删除的内容
   // export { priorityCalculator }; // 已移到 domain-server/schedule
   // export { ReminderErrors };     // 已移到 domain-server/reminder
   ```

3. 更新 utils/package.json 的 exports：
   ```json
   {
     "exports": {
       ".": "./src/index.ts",
       "./domain": "./src/domain/index.ts",
       "./shared": "./src/shared/index.ts",
       "./errors": "./src/errors/index.ts",
       "./frontend": "./src/frontend/index.ts"
     }
   }
   ```

4. 验证 utils 包的完整性：
   ```bash
   pnpm nx typecheck utils
   pnpm nx test utils
   ```

**验收标准:**
- [ ] 所有已移走的文件已删除
- [ ] utils 的导出清单已更新
- [ ] 类型检查通过
- [ ] 单元测试全部通过
- [ ] 文档已更新（docs/packages/utils.md）

**负责人:** [@assign]  
**预期时间:** 2-3 hours  
**阻碍:** 无

---

### Story 5: 更新所有导入语句

**描述:** 在整个 monorepo 中更新导入语句，指向新的位置。

**受影响的 packages:**

1. `@dailyuse/application-server`
   ```typescript
   // Before
   import { MinHeap } from '../scheduler/priority-queue/MinHeap';
   import { BaseTaskQueue } from '../scheduler/BaseTaskQueue';
   
   // After
   import { MinHeap, BaseTaskQueue } from '@dailyuse/patterns/scheduler';
   ```

2. `@dailyuse/application-client`
   - 无需改动（不使用 patterns）

3. `@dailyuse/domain-server`
   ```typescript
   // Schedule 模块 - 使用本地计算器
   import { priorityCalculator } from './calculators/priority-calculator';
   
   // Reminder 模块 - 使用本地错误
   import { ReminderNotFoundError } from './errors/ReminderErrors';
   ```

4. `@dailyuse/infrastructure-server`
   - 无需改动（不直接使用这些)

5. `@dailyuse/desktop` (apps/desktop)
   ```typescript
   // Before
   import { MinHeap } from '@dailyuse/application-server';
   
   // After
   import { MinHeap } from '@dailyuse/patterns/scheduler';
   ```

6. `@dailyuse/api` (apps/api)
   ```typescript
   // 类似 Desktop
   ```

7. `@dailyuse/web` (apps/web)
   - 可能使用来自 domain-client、infrastructure-client

**具体步骤:**

1. 使用全局搜索替换：
   ```bash
   # 在 VS Code 中使用 Find and Replace
   # 搜索: from '@dailyuse/application-server/schedule/scheduler
   # 替换为: from '@dailyuse/patterns/scheduler
   ```

2. 验证每个修改：
   ```bash
   pnpm nx typecheck  # 检查每个包
   ```

3. 更新 patterns 的依赖声明在 application-server 中：
   ```json
   {
     "dependencies": {
       "@dailyuse/patterns": "*"
     }
   }
   ```

**验收标准:**
- [ ] application-server 中所有 scheduler 导入已更新
- [ ] domain-server 中所有本地计算器导入已验证
- [ ] 所有 apps 中的导入已更新
- [ ] 全局类型检查通过：`pnpm nx run-many -t typecheck`
- [ ] 无 "Cannot find module" 错误

**负责人:** [@assign]  
**预期时间:** 5-6 hours  
**阻碍:** 需谨慎，避免遗漏

---

### Story 6: 更新依赖声明和 NX 配置

**描述:** 更新所有包的 package.json 依赖和 Nx 的模块边界规则。

**package.json 更新:**

1. `packages/patterns/package.json`：
   ```json
   {
     "dependencies": {
       "@dailyuse/contracts": "*"
     }
   }
   ```

2. `packages/application-server/package.json`：
   ```json
   {
     "dependencies": {
       "@dailyuse/patterns": "*",
       "@dailyuse/domain-server": "*",
       "@dailyuse/infrastructure-server": "*",
       "@dailyuse/contracts": "*"
     }
   }
   ```

3. `packages/domain-server/package.json`：
   ```json
   {
     "dependencies": {
       "@dailyuse/contracts": "*"
     }
   }
   ```

4. 各 `apps/*/package.json`：
   - 添加 `@dailyuse/patterns` 依赖（如果尚未添加）

**Nx 配置更新 (nx.json):**

```json
{
  "plugins": [
    {
      "plugin": "@nx/enforce-module-boundaries",
      "options": {
        "enforcedBoundaries": [
          {
            "sourceTag": "scope:patterns",
            "onlyDependOnLibsWithTags": ["scope:contracts"]
          },
          {
            "sourceTag": "scope:application",
            "onlyDependOnLibsWithTags": ["scope:patterns", "scope:infrastructure", "scope:domain", "scope:contracts"]
          }
        ]
      }
    }
  ]
}
```

**具体步骤:**

1. 检查并更新各包的 package.json
2. 运行 Nx lint 检查：
   ```bash
   pnpm nx lint
   ```
3. 如有违规，修复导入关系
4. 确保 patterns 包能被正确依赖

**验收标准:**
- [ ] 所有 package.json 已更新
- [ ] Nx 的 enforce-module-boundaries 规则已更新
- [ ] `pnpm nx lint` 通过无违规
- [ ] 依赖图可正确生成：`pnpm nx graph --file=depgraph.html`

**负责人:** [@assign]  
**预期时间:** 2-3 hours  
**阻碍:** 需理解 Nx 的依赖规则

---

### Story 7: 测试、文档和验证

**描述:** 运行完整的测试套件，更新文档，进行最终验证。

**测试步骤:**

1. 单元测试：
   ```bash
   pnpm nx run-many -t test:unit --all
   ```

2. 类型检查：
   ```bash
   pnpm nx run-many -t typecheck --all
   ```

3. Linting：
   ```bash
   pnpm nx lint
   ```

4. 构建验证：
   ```bash
   pnpm nx run-many -t build --all
   ```

**文档更新:**

1. 更新 [Package Implementation Guide](./package-implementation-guide.md)
   - [ ] 新增 patterns 包的详细说明
   - [ ] 更新 application-server 的结构图
   - [ ] 添加 patterns 的使用示例

2. 更新 [拼项目.md](./拼项目.md)
   - [ ] 添加 L4.5 Patterns 层的说明
   - [ ] 更新项目结构图
   - [ ] 更新 utils 清理的内容

3. 创建迁移指南 [Migration Guide: Utils Refactoring](./migration-utils-refactoring.md)
   - 为其他开发者提供快速参考
   - 常见问题解答（FAQ）

4. 更新各包的 README：
   - [ ] packages/patterns/README.md - 新建
   - [ ] packages/utils/README.md - 更新
   - [ ] packages/domain-server/README.md - 更新

**验收标准:**
- [ ] 所有单元测试通过（100% patterns 和相关包）
- [ ] 类型检查无错误
- [ ] Linting 无违规
- [ ] 构建成功
- [ ] 所有文档已更新
- [ ] 迁移指南已发布
- [ ] Team wiki 已同步

**负责人:** [@assign]  
**预期时间:** 4-5 hours  
**阻碍:** 无

---

## 时间表

| Week | Story | 预计时间 | 负责人 |
|------|-------|---------|--------|
| **Week 1** | 1: 创建 patterns 包 | 2-3h | - |
|  | 2: 迁移通用框架 | 4-5h | - |
| **Week 2** | 3: 迁移业务计算 | 3-4h | - |
|  | 4: 清理 utils 包 | 2-3h | - |
|  | 5: 更新导入 | 5-6h | - |
|  | 6: 更新依赖配置 | 2-3h | - |
| **Week 3** | 7: 测试和文档 | 4-5h | - |
| **Buffer** | 突发问题处理 | 4-5h | - |

**总计:** 27-35 小时 ≈ 1.5-2 sprints

---

## 风险与缓解

| 风险 | 影响 | 缓解方案 |
|------|------|---------|
| 导入遗漏导致应用崩溃 | High | 逐个应用构建和测试，自动化搜索替换 |
| 循环依赖引入 | High | 运行 `pnpm nx lint` 验证，在每个 Story 结束时检查 |
| 业务逻辑破坏 | High | 充分的单元测试，迁移前确保测试覆盖率 > 80% |
| 类型兼容性问题 | Medium | 逐个包进行类型检查，修复后再进行下一步 |
| 团队不理解新结构 | Medium | 发布清晰的迁移指南和文档，进行 Tech Sync |

---

## 相关 EPIC/Issues

- EPIC-016: Schedule 模块优化（前置条件完成）
- Nx Module Boundaries 验证
- 文档和架构讨论

---

## 关键决策点

1. **Pattern 包的命名：** `@dailyuse/patterns` vs `@dailyuse/framework` vs `@dailyuse/common`
   - 决议：`@dailyuse/patterns` - 明确指出这是设计模式库，不是通用工具库

2. **业务计算的位置：** Domain layer vs Application layer
   - 决议：Domain layer - 优先级计算是业务规则，不是编排逻辑

3. **迁移的速度：** 一次性 vs 逐步
   - 决议：一次性 - 避免长期共存导致混乱，但分多个 Story 进行

---

## 成功指标

在 EPIC 完成后，团队应该能够：

- ✅ 清晰地说出各包的职责
- ✅ 快速将通用模式应用于新模块（如新的 TaskQueue）
- ✅ 添加新应用时只需组装现有积木，无需新增基础代码
- ✅ 修改业务逻辑时不影响通用框架
- ✅ 所有导入遵循明确的五层架构

---

**文档维护:**  
最后更新：2026-01-08  
下次复查：完成后 1 月内
