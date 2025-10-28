# DailyUse Packages 文档索引

> **生成时间**: 2025-10-28  
> **文档版本**: v1.0  
> **包总数**: 6 个

---

## 📦 包概览

DailyUse 项目包含 6 个共享包，每个包都有明确的职责和边界。

```
packages/
├── contracts         # TypeScript 类型契约
├── domain-client     # 客户端领域层
├── domain-server     # 服务端领域层
├── ui                # Vue 3 UI 组件库
├── utils             # 通用工具函数
└── assets            # 静态资源
```

---

## 📚 包文档列表

### 1. [@dailyuse/contracts](./packages-contracts.md) - 类型契约层

**职责**: 定义跨应用共享的 TypeScript 类型、接口、枚举和 Zod 验证器。

**关键内容**:
- 239 个 TypeScript 文件
- 100+ DTO (Data Transfer Objects)
- 50+ 实体接口
- 80+ Zod 验证器
- 跨端类型一致性保障

**适用场景**:
- API 请求/响应类型定义
- 前后端数据格式约定
- 表单验证 schema
- 数据传输对象

[📖 查看完整文档](./packages-contracts.md)

---

### 2. [@dailyuse/domain-client](./packages-domain-client.md) - 客户端领域层

**职责**: 客户端业务逻辑和状态管理，基于 Pinia 构建。

**关键内容**:
- 10 个 Pinia Stores
- 业务模块: Account, Auth, Goal, Task, Schedule, Reminder, Notification, Repository, Editor, Setting
- 状态持久化
- API 集成层
- 客户端业务规则

**适用场景**:
- Vue 3 应用状态管理
- 客户端业务逻辑封装
- API 调用和缓存
- 用户会话管理

[📖 查看完整文档](./packages-domain-client.md)

---

### 3. [@dailyuse/domain-server](./packages-domain-server.md) - 服务端领域层

**职责**: 服务端业务逻辑，实现 DDD 架构模式。

**关键内容**:
- 10 个业务模块
- ~495 行核心代码
- DDD 架构: Aggregates, Entities, Value Objects, Services
- 领域事件
- 仓储接口

**适用场景**:
- 服务端核心业务逻辑
- 领域模型定义
- 业务规则实现
- 数据持久化抽象

[📖 查看完整文档](./packages-domain-server.md)

---

### 4. [@dailyuse/utils](./packages-utils.md) - 通用工具库

**职责**: 跨应用共享的工具函数和实用程序。

**关键内容**:
- 8 个核心模块
- 50+ 工具函数
- Logger 系统
- API 响应处理
- 事件总线
- 表单验证
- DDD 基类
- 日期时间工具

**适用场景**:
- 日志记录
- API 响应标准化
- 跨组件通信
- 数据验证
- 领域模型基类

[📖 查看完整文档](./packages-utils.md)

---

### 5. [@dailyuse/ui](./packages-ui.md) - UI 组件库

**职责**: 基于 Vue 3 + Vuetify 3 的共享 UI 组件库。

**关键内容**:
- 12 个 Vue 组件
- 5 个 Composables
- 账户组件: 登录、注册、个人资料
- 通用组件: 对话框、表单、反馈
- Material Design 风格

**适用场景**:
- Web 应用 UI
- 桌面应用 UI
- 表单处理
- 用户交互反馈
- 统一视觉风格

[📖 查看完整文档](./packages-ui.md)

---

### 6. [@dailyuse/assets](./packages-assets.md) - 静态资源

**职责**: 集中管理图像、音频等静态资源。

**关键内容**:
- 9 种 Logo 格式和尺寸
- 6 种通知音效
- 默认头像
- TypeScript 类型安全导出

**适用场景**:
- 应用图标
- 通知音效
- 用户头像
- PWA 配置
- Electron 应用资源

[📖 查看完整文档](./packages-assets.md)

---

## 🔗 包依赖关系

```mermaid
graph TD
    A[apps/web] --> B[@dailyuse/ui]
    A --> C[@dailyuse/domain-client]
    A --> D[@dailyuse/contracts]
    A --> E[@dailyuse/utils]
    A --> F[@dailyuse/assets]
    
    G[apps/api] --> H[@dailyuse/domain-server]
    G --> D
    G --> E
    
    I[apps/desktop] --> B
    I --> C
    I --> D
    I --> E
    I --> F
    
    B --> D
    B --> E
    C --> D
    C --> E
    H --> D
    H --> E
```

---

## 📊 包统计

| 包名 | 类型 | 文件数 | 主要技术 | 文档大小 |
|------|------|--------|----------|----------|
| **contracts** | 类型 | 239 | TypeScript, Zod | 14KB |
| **domain-client** | 业务逻辑 | ~50 | Pinia, TypeScript | 17KB |
| **domain-server** | 业务逻辑 | ~50 | DDD, TypeScript | 15KB |
| **utils** | 工具库 | ~30 | TypeScript, date-fns | 17KB |
| **ui** | 组件库 | ~20 | Vue 3, Vuetify 3 | 14KB |
| **assets** | 静态资源 | ~20 | 图片, 音频 | 13KB |

---

## 🚀 快速开始

### 1. 安装依赖

```bash
# 在项目根目录
pnpm install
```

### 2. 构建所有包

```bash
# 使用 Nx
nx run-many -t build --all

# 或使用 pnpm
pnpm build
```

### 3. 在应用中使用

```typescript
// 导入类型契约
import { GoalDto, TaskDto } from '@dailyuse/contracts';

// 导入工具函数
import { LoggerFactory, formatDate } from '@dailyuse/utils';

// 导入 UI 组件
import { DuLoginForm, useMessage } from '@dailyuse/ui';

// 导入客户端领域层
import { useGoalStore, useAuthStore } from '@dailyuse/domain-client';

// 导入静态资源
import { logos, notificationSounds } from '@dailyuse/assets';
```

---

## 🎯 最佳实践

### 1. 包依赖原则

- ✅ **domain-client** 和 **domain-server** 不应相互依赖
- ✅ **contracts** 不应依赖任何其他包（纯类型定义）
- ✅ **utils** 只能依赖外部库，不依赖其他内部包
- ✅ **ui** 只依赖 **contracts** 和 **utils**
- ✅ **assets** 不依赖任何包（纯资源）

### 2. 导入规范

```typescript
// ✅ 推荐：从包根导入
import { GoalDto } from '@dailyuse/contracts';
import { useGoalStore } from '@dailyuse/domain-client';

// ❌ 避免：深层路径导入
import { GoalDto } from '@dailyuse/contracts/src/dto/goal/GoalDto';
```

### 3. 类型使用

```typescript
// ✅ 推荐：使用 contracts 中的类型
import { GoalDto } from '@dailyuse/contracts';
const goal: GoalDto = { ... };

// ❌ 避免：在业务代码中定义重复类型
interface Goal { ... } // 应该在 contracts 中定义
```

---

## 📖 相关文档

- [项目概览](./project-overview.md)
- [Web 应用架构](./architecture-web.md)
- [API 应用架构](./architecture-api.md)
- [集成架构](./integration-architecture.md)

---

## 🔄 更新日志

### 2025-10-28
- ✅ 生成所有 6 个包的完整文档
- ✅ 添加包索引页面
- ✅ 完善依赖关系图
- ✅ 添加使用示例和最佳实践

---

**文档维护**: BMAD v6 Analyst (Mary)  
**最后更新**: 2025-10-28 17:10:00
