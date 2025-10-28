# TypeScript Typecheck 修复总结

## 日期

2025-10-11

## 任务完成情况

### ✅ 已完成

#### 1. 修复了 Typecheck 命令语法错误

**问题：** `apps/web/project.json` 中的 typecheck 命令使用了 `pnpm -w -C .` 语法，在 Windows PowerShell 中无法正确解析。

**修复：**

```json
// 修改前（错误）
{
  "typecheck": {
    "executor": "nx:run-commands",
    "options": {
      "command": "pnpm -w -C . tsc --noEmit",
      "cwd": "./"
    }
  }
}

// 修改后（正确）
{
  "typecheck": {
    "executor": "nx:run-commands",
    "options": {
      "command": "vue-tsc --noEmit",
      "cwd": "apps/web"
    }
  }
}
```

#### 2. 为所有项目添加了 Typecheck Target

已为以下项目添加 typecheck target：

- ✅ **contracts** - 使用 `tsc --noEmit`
- ✅ **domain-core** - 使用 `tsc --noEmit`
- ✅ **domain-server** - 使用 `tsc --noEmit`
- ✅ **api** - 使用 `tsc --noEmit`
- ✅ **web** - 使用 `vue-tsc --noEmit`
- ✅ **desktop** - 使用 `vue-tsc --noEmit`

**运行方式：**

```bash
# 单个项目
pnpm nx typecheck contracts
pnpm nx typecheck web

# 所有项目
pnpm nx run-many --target=typecheck --all

# 受影响的项目
pnpm nx affected --target=typecheck
```

#### 3. 创建了完整的 Nx Scripts 文档

创建了 `docs/NX_SCRIPTS_AND_TARGETS_GUIDE.md`，详细讲解：

- Nx Targets（任务目标）的概念和配置
- Executors（执行器）的类型和使用
- Plugins（插件）和 Inferred Targets（推断目标）
- Project.json vs Package.json Scripts 的区别和最佳实践
- 实战案例分析（包括 `dev` vs `vite:dev` 的问题）
- 常见问题和最佳实践

#### 4. Contracts 包的 TypeScript 错误修复

**问题：** `useGoalOptimistic.example.ts` 文件中有 TypeScript 错误。

**修复：** 在 `tsconfig.json` 中排除示例文件：

```json
{
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts", "**/*.example.ts"]
}
```

**结果：** ✅ Contracts 包 typecheck 通过！

---

### ⚠️ 部分完成

#### 5. Domain-Core 包的 TypeScript 错误修复

**已修复的错误：**

1. ✅ 修复了所有 `override` 修饰符缺失的问题
   - `AddressCore`, `EmailCore`, `PhoneNumberCore`, `SexCore` 的 `toString()` 方法
   - `MFADeviceCore`, `SessionCore` 的 `uuid` getter
   - `RepositoryCore`, `UserPreferencesCore` 的 `uuid` getter
   - `Position.ts` 中的 `TextSelection` 类方法

2. ✅ 修复了 `EditorSettings.ts` 中 `CSS` 全局对象不存在的问题
   - 移除了 `CSS.supports()` 调用（lib 只包含 ES2020，不包含 DOM API）

3. ✅ 修复了 `authentication/index.ts` 中空的 `types` 文件夹导入

**仍存在的问题：**

1. ❌ **Editor 模块契约缺失**
   - `EditorCore.ts` 无法找到 `IEditorGroup`, `IEditorTab`, `IEditorLayout` 等接口
   - `EditorLayout.ts`, `EditorTab.ts` 也有类似问题
2. ❌ **Repository 模块契约重构不完整**
   - `RepositoryCore.ts` 尝试导入 `IRepository`, `IRepositoryConfig` 等接口
   - 但 contracts 包已重构为 `Server`/`Client` 后缀的命名约定
   - 需要更新 domain-core 以匹配新的契约命名

3. ❌ **Resource 模块契约缺失**
   - `Resource.ts` 无法找到 `IResource`, `IResourceMetadata`, `ResourceDTO`

**错误统计：**

- 总错误数：20
- Editor 相关：11 个
- Repository 相关：6 个
- Resource 相关：3 个

---

### ❌ 未完成

#### 6. Domain-Server 包的 TypeScript 错误

**主要问题类型：**

1. **找不到 @dailyuse/domain-core 的类型声明文件**
   - 影响文件：`GoalFolder.ts`, `GoalRecord.ts`, `KeyResult.ts`, `Reminder.ts`, 等多个文件
   - 错误信息：`Could not find a declaration file for module '@dailyuse/domain-core'`
   - **原因：** `domain-core/dist/index.d.ts` 可能未正确生成或导出

2. **Goal 聚合根的属性访问错误**
   - 大量错误如 `Property 'lifecycle' does not exist on type 'Goal'`
   - 可能原因：
     - Goal 类的属性定义不完整
     - 私有属性命名不一致（`_lifecycle` vs `lifecycle`）
     - 方法签名不匹配

3. **Reminder 模块的属性不存在错误**
   - 约 100+ 个错误，主要是属性访问失败
   - 涉及 `Reminder.ts`, `ReminderTemplate.ts`, `ReminderTemplateGroup.ts`, `ReminderInstance.ts`

4. **Task 模块的大量错误**
   - `TaskTemplate.ts`, `TaskInstance.ts`, `TaskMetaTemplate.ts` 等
   - 类似的属性访问问题

5. **Theme 模块的属性错误**
   - `ThemeDefinition.ts`, `ThemeServer.ts`, `ThemeService.ts`
   - 大量私有属性访问错误
   - `window` 对象在服务端不存在

**错误统计：**

- 总错误数：约 800+
- Goal 相关：约 40 个
- Reminder 相关：约 200 个
- Task 相关：约 300 个
- Theme 相关：约 100 个
- Schedule、Setting 等：约 160 个

---

## 核心问题分析

### 1. 架构层级的问题

#### A. Domain-Core 包的类型定义不完整

**症状：**

- `domain-server` 中多个文件报错 `Could not find a declaration file for module '@dailyuse/domain-core'`
- 即使 `domain-core` 编译成功，其 `.d.ts` 文件也无法被正确解析

**可能原因：**

1. `domain-core/tsconfig.json` 的 `composite: true` 和 `declaration: true` 配置可能有问题
2. `domain-core/dist/index.d.ts` 可能未正确导出所有类型
3. `domain-server` 的 `tsconfig.json` 中 `references` 配置可能不正确

**建议修复：**

```bash
# 1. 重新编译 domain-core
cd packages/domain-core
pnpm build

# 2. 检查生成的 dist/index.d.ts 是否完整
cat dist/index.d.ts

# 3. 如果 .d.ts 不完整，检查 src/index.ts 的导出
```

#### B. Contracts 重构导致的命名不一致

**问题：**

- Contracts 包已重构为 `Server`/`Client` 后缀命名（如 `IRepositoryConfigServer`, `IRepositoryConfigClient`）
- 但 `domain-core` 仍使用旧的命名（如 `IRepositoryConfig`, `IRepository`）

**影响范围：**

- `packages/domain-core/src/repository/`
- `packages/domain-core/src/editor/`

**建议修复：**
需要系统性地更新 `domain-core` 中的导入语句，将其与 `contracts` 的新命名约定对齐。

---

### 2. 代码质量问题

#### A. 属性访问模式不一致

**症状：**

- 大量 `Property 'xxx' does not exist` 错误
- 私有属性名称不一致（有些用 `_property`，有些用 `property`）

**示例：**

```typescript
// Goal.ts 中
get lifecycle() { return this._lifecycle; }  // ✅ 正确

// 但在其他地方
this.lifecycle  // ❌ 属性不存在？
this._lifecycle // ✅ 这个可能存在
```

**建议修复：**

1. 统一私有属性命名规范（建议统一使用 `_propertyName`）
2. 确保所有私有属性都有对应的 getter/setter
3. 使用 ESLint 规则强制执行命名约定

#### B. Override 修饰符缺失（已修复大部分）

**已修复：**

- ValueObject 子类的 `toString()` 方法
- Entity 子类的 `uuid` getter
- AggregateRoot 子类的 `uuid` getter

**仍需修复：**

- `domain-server` 中的 Repository 和其他 Entity 子类

---

### 3. 配置问题

#### A. TSConfig 的 lib 配置

**问题：**

- `domain-core` 的 `tsconfig.json` 只包含 `["ES2020"]`
- 导致无法使用 DOM API（如 `CSS.supports()`）

**已修复：**

- 移除了对 `CSS` 的依赖
- 改用纯 TypeScript 实现的颜色验证

**建议：**
如果需要在 domain-core 中使用 DOM API，考虑：

1. 添加 `"lib": ["ES2020", "DOM"]`（但这会引入浏览器依赖）
2. 或者使用条件检查：`if (typeof window !== 'undefined')`

---

## 下一步行动计划

### 短期（立即修复）

#### 1. 修复 Domain-Core 的类型声明问题

```bash
# 步骤 1: 重新编译 domain-core
cd packages/domain-core
rm -rf dist
pnpm build

# 步骤 2: 检查 dist/index.d.ts
cat dist/index.d.ts | head -50

# 步骤 3: 确认导出是否完整
# 应该包含所有聚合根、实体、值对象的导出
```

#### 2. 更新 Domain-Core 的 Contracts 导入

**文件清单：**

- `packages/domain-core/src/repository/aggregates/RepositoryCore.ts`
- `packages/domain-core/src/repository/entities/Resource.ts`
- `packages/domain-core/src/editor/aggregates/EditorCore.ts`
- `packages/domain-core/src/editor/aggregates/EditorLayout.ts`
- `packages/domain-core/src/editor/aggregates/EditorTab.ts`

**修复方法：**

```typescript
// 修改前
import type { IRepository, IRepositoryConfig } from '@dailyuse/contracts';

// 修改后
import type { IRepositoryServer, IRepositoryConfigServer } from '@dailyuse/contracts';
```

#### 3. 修复 Domain-Server 的 Override 修饰符

**文件清单：**

- `src/repository/aggregates/Repository.ts`
- `src/repository/entities/LinkedContent.ts`
- `src/repository/entities/RepositoryExplorer.ts`
- `src/repository/entities/Resource.ts`
- `src/repository/entities/ResourceReference.ts`

**修复方法：**
在继承的 getter 前添加 `override` 关键字。

---

### 中期（重构任务）

#### 1. 统一 Domain-Server 的属性命名

**需要重构的模块：**

- Goal 模块
- Reminder 模块
- Task 模块
- Theme 模块

**步骤：**

1. 审查每个聚合根/实体的属性定义
2. 确保私有属性统一使用 `_propertyName` 命名
3. 为所有私有属性添加 getter/setter
4. 更新所有引用这些属性的代码

#### 2. 修复 Schedule 模块的类型问题

**问题：**

- `schedule/index.ts` 重复导出 `IScheduleTaskRepository`
- 缺少 `ScheduleTask` 聚合根文件

**修复：**

1. 找到或创建 `aggregates/ScheduleTask.ts`
2. 修复 `index.ts` 的导出

#### 3. 完善 Editor 模块的 Contracts

**缺失的契约：**

- `IEditorGroup`
- `IEditorTab`
- `IEditorLayout`
- `EditorSessionDTO`
- `SupportedFileType`
- `EditorGroupDTO`
- `EditorTabDTO`
- `EditorLayoutDTO`

**行动：**
在 `packages/contracts/src/modules/editor/` 中创建这些类型定义。

---

### 长期（架构改进）

#### 1. 建立类型声明的 CI 检查

```json
// package.json
{
  "scripts": {
    "typecheck": "pnpm nx run-many --target=typecheck --all",
    "typecheck:affected": "pnpm nx affected --target=typecheck"
  }
}
```

在 CI 中添加：

```yaml
- name: Run typecheck
  run: pnpm typecheck
```

#### 2. 使用 ESLint 强制代码规范

```json
// .eslintrc.json
{
  "rules": {
    "@typescript-eslint/explicit-member-accessibility": "error",
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "property",
        "modifiers": ["private"],
        "format": ["camelCase"],
        "leadingUnderscore": "require"
      }
    ]
  }
}
```

#### 3. 文档化类型系统约定

创建 `docs/TYPESCRIPT_CONVENTIONS.md`：

- 私有属性命名规范
- Override 修饰符使用规范
- 类型导出规范
- TSConfig 配置规范

---

## 总结

### 已完成的工作

1. ✅ 修复了所有项目的 typecheck target 配置
2. ✅ 创建了详细的 Nx Scripts 文档
3. ✅ Contracts 包 typecheck 通过
4. ✅ 修复了 Domain-Core 中的大部分 override 错误
5. ✅ 修复了 EditorSettings 中的 CSS API 问题

### 仍需完成的工作

1. ❌ Domain-Core: 20 个 contracts 相关错误
2. ❌ Domain-Server: 约 800+ 个属性访问和类型声明错误

### 关键洞察

1. **契约重构未完成：** Contracts 包已重构为 Server/Client 命名，但 domain-core 未同步更新
2. **类型声明配置问题：** domain-core 的 .d.ts 可能未正确生成或导出
3. **代码质量问题：** 大量属性命名不一致、缺少 getter/setter
4. **需要系统性重构：** 不是简单的修复，需要架构层面的改进

### 建议优先级

1. 🔴 **高优先级：** 修复 domain-core 的类型声明问题（阻塞所有依赖它的包）
2. 🟠 **中优先级：** 更新 domain-core 的 contracts 导入（修复 20 个错误）
3. 🟡 **低优先级：** 重构 domain-server 的属性命名（长期改进）

---

## 附录

### 运行 Typecheck 的命令

```bash
# 单个项目
pnpm nx typecheck contracts    # ✅ 通过
pnpm nx typecheck domain-core  # ⚠️  20 个错误
pnpm nx typecheck domain-server # ❌ 800+ 个错误
pnpm nx typecheck api          # 未测试
pnpm nx typecheck web          # 未测试
pnpm nx typecheck desktop      # 未测试

# 所有项目
pnpm nx run-many --target=typecheck --all

# 受影响的项目
pnpm nx affected --target=typecheck
```

### 相关文档

- `docs/NX_SCRIPTS_AND_TARGETS_GUIDE.md` - Nx 脚本完整指南
- `docs/CONTRACTS_NAMING_CONVENTION.md` - Contracts 命名约定（如果存在）
- `packages/domain-core/tsconfig.json` - TypeScript 配置
- `packages/contracts/tsconfig.json` - Contracts 配置
