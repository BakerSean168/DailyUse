---
agent: agent
---

# DailyUse - 开发规范

## 开发规范

### 命名约定

- **文件命名**: 小驼峰命名法 `accountUtils.ts`
- **类/常量/枚举**: 大驼峰命名法 `AccountConstants.ts`
- **组件**: 大驼峰命名法 `ProfileDialog.vue`
- **函数/变量**: 小驼峰命名法

### 代码质量

- **类型安全**: 严格的TypeScript配置
- **代码注释**: 详细的JSDoc注释
- **单元测试**: 核心业务逻辑测试覆盖
- **代码格式**: ESLint + Prettier统一格式化

### 包管理

- **优先使用**: `pnpm` 命令而非 `npm`
- **依赖管理**: 通过workspace统一管理
- **版本控制**: 语义化版本控制

### Git工作流

- **分支策略**: GitFlow或GitHub Flow
- **提交规范**: Conventional Commits
- **代码审查**: Pull Request必须经过审查

### DDD聚合根控制开发规范

#### 聚合根设计原则

1. **聚合边界明确** - 每个聚合根控制特定的业务边界
2. **业务规则集中** - 所有业务规则在聚合根内部实现
3. **数据一致性** - 聚合根保证内部数据的强一致性
4. **领域事件** - 重要业务变更必须发布领域事件

### AI 功能模块开发工作流

#### 1. Contracts Layer (`packages/contracts`)

- 定义 Enums, Aggregates, Entities, Value Objects, 和 DTOs
- 遵循 `Client/Server` 分离模式定义 Aggregates 和 Entities
- 定义 Domain Events

#### 2. Domain Server Layer (`packages/domain-server`)

- **目录结构**: 必须严格遵循 `goal` 模块的 DDD 结构 (`aggregates`, `entities`, `events`, `infrastructure`, `repositories`, `services`, `value-objects`)
- **实现**: 实现 `contracts` 中定义的接口
- **业务逻辑**: 所有状态变更必须在聚合根内部完成

#### 3. Domain Client Layer (`packages/domain-client`)

- 实现客户端 Store (Pinia) 和 Services
- 将 Server DTOs 映射为 Client Entities

#### 4. API Layer (`apps/api`)

- 实现 Controllers 和 Routes
- 使用 Domain Services 进行编排
- **禁止**在 Controller 中编写业务逻辑

#### 5. Web Layer (`apps/web`)

- 实现 UI 组件
- 使用 Domain Client services 获取数据

### AI 开发规则补充

- AI 模块必须遵循 `goal` 模块的 DDD 目录结构
- 开发前必须先在 `contracts` 包中定义完整的领域模型
- 领域逻辑必须驻留在 `domain-server` 中，严禁泄露到 `apps/api`
- 使用 `BaseAIAdapter` 模式进行 LLM 集成，确保提供商无关性
- 配额检查 (Quota Check) 必须在 Domain Service 层强制执行
