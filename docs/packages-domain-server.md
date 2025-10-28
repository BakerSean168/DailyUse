# @dailyuse/domain-server 包文档

> **生成时间**: 2025-10-28  
> **包版本**: 0.0.1  
> **文档类型**: 服务端领域层架构文档

---

## 📋 包概述

**@dailyuse/domain-server** 是 DailyUse 项目的**服务端领域层**核心包，包含所有服务端业务逻辑实现。该包遵循**领域驱动设计（DDD）**原则，提供了完整的聚合根、实体、值对象、领域服务和仓储接口。

### 核心职责

- 🎯 **聚合根管理**: 维护业务不变性和一致性边界
- 🏗️ **实体建模**: 封装业务实体及其行为
- 💎 **值对象**: 不可变的领域概念
- 🔧 **领域服务**: 跨实体的业务逻辑
- 📦 **仓储接口**: 数据持久化抽象层
- ✅ **业务规则验证**: 确保数据完整性

---

## 🏗️ 架构模式

### DDD 分层架构

```
@dailyuse/domain-server/
├── aggregates/         # 聚合根 (Aggregate Roots)
│   └── 业务一致性边界、事务边界
├── entities/           # 实体 (Entities)
│   └── 有唯一标识的业务对象
├── value-objects/      # 值对象 (Value Objects)
│   └── 不可变的领域概念
├── services/           # 领域服务 (Domain Services)
│   └── 跨实体的业务逻辑
├── repositories/       # 仓储接口 (Repository Interfaces)
│   └── 数据访问抽象
└── application-services/ # 应用服务 (可选)
    └── 业务流程编排
```

### DDD 核心概念

| 概念 | 职责 | 示例 |
|------|------|------|
| **Aggregate Root** | 聚合根，维护业务不变性 | `Goal`, `Task`, `EditorWorkspace` |
| **Entity** | 有唯一标识的业务对象 | `KeyResult`, `GoalRecord`, `EditorTab` |
| **Value Object** | 不可变的领域概念 | `DateRange`, `Priority`, `NotificationChannel` |
| **Domain Service** | 跨实体的业务规则 | `GoalProgressCalculator`, `TaskScheduler` |
| **Repository** | 数据持久化抽象 | `IGoalRepository`, `ITaskRepository` |

---

## 📦 技术栈

### 核心依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| **@dailyuse/utils** | workspace | 工具函数库 |
| **bcryptjs** | ^2.4.3 | 密码加密 |
| **date-fns** | ^4.1.0 | 日期处理 |
| **jsonwebtoken** | ^9.0.2 | JWT 令牌生成 |

### 开发依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| **TypeScript** | ^5.0.0 | 类型系统 |
| **tsup** | ^8.0.0 | 构建工具 |
| **vitest** | ^3.2.4 | 单元测试 |

---

## 🎯 业务模块

### 模块概览

DailyUse 项目包含 **10 个核心业务模块**，每个模块都遵循相同的 DDD 分层结构：

```
模块/
├── aggregates/         # 聚合根
├── entities/           # 实体
├── value-objects/      # 值对象
├── services/           # 领域服务
├── repositories/       # 仓储接口
└── application-services/ # 应用服务 (可选)
```

### 模块列表

1. **Account** - 账户管理
2. **Authentication** - 认证授权
3. **Goal** - 目标管理 (OKR)
4. **Task** - 任务管理
5. **Schedule** - 日程调度
6. **Reminder** - 提醒系统
7. **Notification** - 通知系统
8. **Repository** - 文档仓库
9. **Editor** - 编辑器工作空间
10. **Setting** - 用户设置

---

## 📊 模块详细说明

### 1. Account 模块

**职责**: 用户账户生命周期管理

#### 聚合根
- `Account` - 账户聚合根
  - 管理用户基本信息
  - 维护账户状态 (激活/禁用/删除)
  - 处理账户相关事件

#### 实体
- `Profile` - 用户档案
- `Subscription` - 订阅信息
- `StorageQuota` - 存储配额

#### 值对象
- `Email` - 邮箱地址
- `PhoneNumber` - 手机号
- `AccountStatus` - 账户状态枚举

#### 领域服务
- `AccountDomainService` - 账户业务逻辑
  - 账户创建验证
  - 状态转换规则
  - 配额管理

#### 仓储接口
- `IAccountRepository` - 账户数据访问

---

### 2. Authentication 模块

**职责**: 认证和授权

#### 聚合根
- `AuthSession` - 认证会话聚合根
  - 管理登录会话
  - Token 生命周期
  - 设备管理

#### 实体
- `AuthCredential` - 认证凭据
- `RefreshToken` - 刷新令牌
- `DeviceInfo` - 设备信息

#### 值对象
- `AccessToken` - 访问令牌
- `PasswordHash` - 密码哈希
- `SessionStatus` - 会话状态

#### 领域服务
- `AuthenticationService` - 认证服务
  - 密码验证
  - Token 生成
  - 会话管理
- `PasswordService` - 密码服务
  - 密码加密 (bcryptjs)
  - 密码强度验证

#### 仓储接口
- `IAuthSessionRepository` - 会话仓储
- `IAuthCredentialRepository` - 凭据仓储

---

### 3. Goal 模块

**职责**: OKR 目标管理

#### 聚合根
- `Goal` - 目标聚合根
  - 管理目标及其关键结果
  - 计算进度
  - 维护目标层级关系

#### 实体
- `KeyResult` - 关键结果
- `GoalRecord` - 目标记录
- `GoalReview` - 目标复盘
- `GoalFolder` - 目标文件夹

#### 值对象
- `DateRange` - 日期范围
- `Progress` - 进度值 (0-100)
- `GoalStatus` - 目标状态 (进行中/已完成/已放弃)
- `KeyResultType` - KR 类型 (数值型/完成型)

#### 领域服务
- `GoalDomainService` - 目标业务逻辑
  - 进度自动计算
  - 依赖关系验证
  - 循环检测
- `GoalProgressCalculator` - 进度计算器
  - 基于 Key Results 计算目标进度
  - 支持加权计算

#### 仓储接口
- `IGoalRepository` - 目标仓储
- `IKeyResultRepository` - KR 仓储

---

### 4. Task 模块

**职责**: 任务管理

#### 聚合根
- `Task` - 任务聚合根
  - 管理任务状态
  - 处理任务实例
  - 维护任务依赖

#### 实体
- `TaskTemplate` - 任务模板
- `TaskInstance` - 任务实例
- `TaskDependency` - 任务依赖

#### 值对象
- `Priority` - 优先级 (高/中/低)
- `TaskStatus` - 任务状态
- `RecurrencePattern` - 循环模式

#### 领域服务
- `TaskDomainService` - 任务业务逻辑
  - 任务创建验证
  - 循环任务生成
  - 依赖关系管理
- `TaskScheduler` - 任务调度器

#### 仓储接口
- `ITaskRepository` - 任务仓储

---

### 5. Schedule 模块

**职责**: 日程调度

#### 聚合根
- `Schedule` - 日程聚合根
  - 管理日程事件
  - 冲突检测
  - 时间槽分配

#### 实体
- `ScheduleEvent` - 日程事件
- `TimeSlot` - 时间槽
- `Recurrence` - 循环规则

#### 值对象
- `TimeRange` - 时间范围
- `EventType` - 事件类型
- `ConflictResolution` - 冲突解决策略

#### 领域服务
- `ScheduleDomainService` - 日程业务逻辑
  - 时间冲突检测
  - 日程优化
  - 循环事件生成

#### 仓储接口
- `IScheduleRepository` - 日程仓储

---

### 6. Reminder 模块

**职责**: 智能提醒

#### 聚合根
- `Reminder` - 提醒聚合根
  - 管理提醒规则
  - 触发条件
  - 提醒历史

#### 实体
- `ReminderTemplate` - 提醒模板
- `ReminderInstance` - 提醒实例
- `ReminderGroup` - 提醒分组

#### 值对象
- `TriggerCondition` - 触发条件
- `ReminderChannel` - 提醒渠道 (应用内/邮件/推送)
- `Frequency` - 频率

#### 领域服务
- `ReminderDomainService` - 提醒业务逻辑
  - 提醒规则验证
  - 智能提醒时间计算
  - 提醒去重

#### 仓储接口
- `IReminderRepository` - 提醒仓储

---

### 7. Notification 模块

**职责**: 通知系统

#### 聚合根
- `Notification` - 通知聚合根
  - 管理通知消息
  - 通知优先级
  - 已读/未读状态

#### 实体
- `NotificationMessage` - 通知消息
- `NotificationChannel` - 通知渠道

#### 值对象
- `NotificationType` - 通知类型
- `Priority` - 优先级
- `DeliveryStatus` - 发送状态

#### 领域服务
- `NotificationDomainService` - 通知业务逻辑
  - 通知分类
  - 优先级计算
  - 批量处理

#### 仓储接口
- `INotificationRepository` - 通知仓储

---

### 8. Repository 模块

**职责**: 文档仓库管理

#### 聚合根
- `Repository` - 仓库聚合根
  - 管理文档结构
  - 版本控制集成
  - 资源管理

#### 实体
- `Document` - 文档实体
- `Folder` - 文件夹
- `ResourceLink` - 资源链接

#### 值对象
- `FilePath` - 文件路径
- `MimeType` - MIME 类型
- `FileSize` - 文件大小

#### 领域服务
- `RepositoryDomainService` - 仓库业务逻辑
  - 文档搜索
  - 路径解析
  - 权限验证

#### 仓储接口
- `IRepositoryRepository` - 仓库仓储

---

### 9. Editor 模块

**职责**: 编辑器工作空间

#### 聚合根
- `EditorWorkspace` - 工作空间聚合根
  - 管理编辑器会话
  - 标签页组织
  - 协作状态

#### 实体
- `EditorSession` - 编辑会话
- `EditorGroup` - 标签组
- `EditorTab` - 标签页
- `Document` - 文档
- `DocumentVersion` - 文档版本

#### 值对象
- `TabState` - 标签状态
- `CursorPosition` - 光标位置
- `EditorSettings` - 编辑器设置

#### 应用服务
- `EditorSessionApplicationService` - 会话编排服务

#### 领域服务
- `EditorWorkspaceDomainService` - 工作空间业务逻辑
  - 会话恢复
  - 标签页布局
  - 协作冲突解决

#### 仓储接口
- `IEditorWorkspaceRepository` - 工作空间仓储

---

### 10. Setting 模块

**职责**: 用户设置管理

#### 聚合根
- `Setting` - 设置聚合根
  - 管理用户偏好
  - 主题配置
  - 编辑器设置

#### 实体
- `ThemeSetting` - 主题设置
- `EditorPreference` - 编辑器偏好
- `NotificationPreference` - 通知偏好

#### 值对象
- `Theme` - 主题值
- `Locale` - 语言区域
- `FontFamily` - 字体

#### 领域服务
- `SettingDomainService` - 设置业务逻辑
  - 设置验证
  - 默认值管理
  - 设置同步

#### 仓储接口
- `ISettingRepository` - 设置仓储

---

## 🔧 使用示例

### 聚合根使用

```typescript
import { Goal, KeyResult } from '@dailyuse/domain-server';

// 创建目标聚合根
const goal = new Goal({
  uuid: 'goal-123',
  accountUuid: 'user-456',
  title: '提升产品市场份额',
  description: 'Q1 目标',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-03-31'),
  status: 'ACTIVE',
});

// 添加关键结果
const kr1 = new KeyResult({
  uuid: 'kr-001',
  goalUuid: 'goal-123',
  title: '新用户增长 30%',
  target: 100,
  current: 50,
  type: 'NUMERIC',
});

goal.addKeyResult(kr1);

// 计算进度
const progress = goal.calculateProgress(); // 50%
```

### 领域服务使用

```typescript
import { GoalDomainService } from '@dailyuse/domain-server';

const goalService = new GoalDomainService();

// 验证目标依赖
const isValid = await goalService.validateGoalDependencies(goal);

// 检测循环依赖
const hasCycle = await goalService.detectCyclicDependencies(goal);

// 计算进度
const progress = goalService.calculateProgress(goal);
```

### 值对象使用

```typescript
import { DateRange, Priority } from '@dailyuse/domain-server';

// 创建日期范围值对象
const dateRange = DateRange.create(
  new Date('2025-01-01'),
  new Date('2025-12-31')
);

// 验证日期有效性
if (dateRange.isValid()) {
  console.log(`Duration: ${dateRange.getDurationInDays()} days`);
}

// 使用优先级枚举
const taskPriority = Priority.HIGH;
```

---

## 🧪 测试策略

### 单元测试

每个聚合根和领域服务都有对应的测试文件：

```
entities/
├── Goal.ts
└── Goal.test.ts         # Goal 实体测试

services/
├── GoalDomainService.ts
└── GoalDomainService.test.ts  # 领域服务测试
```

### 测试示例

```typescript
// Goal.test.ts
import { describe, it, expect } from 'vitest';
import { Goal, KeyResult } from '../entities';

describe('Goal Aggregate', () => {
  it('should calculate progress from key results', () => {
    const goal = new Goal({/* ... */});
    const kr = new KeyResult({ target: 100, current: 50, /* ... */ });
    
    goal.addKeyResult(kr);
    
    expect(goal.calculateProgress()).toBe(50);
  });
  
  it('should prevent adding KR to completed goal', () => {
    const goal = new Goal({ status: 'COMPLETED', /* ... */ });
    const kr = new KeyResult({/* ... */});
    
    expect(() => goal.addKeyResult(kr)).toThrow();
  });
});
```

---

## 📁 目录结构

```
packages/domain-server/
├── src/
│   ├── account/
│   │   ├── aggregates/
│   │   ├── entities/
│   │   ├── repositories/
│   │   └── services/
│   ├── authentication/
│   │   ├── aggregates/
│   │   ├── entities/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── value-objects/
│   ├── editor/
│   │   ├── aggregates/
│   │   ├── application-services/
│   │   ├── entities/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── value-objects/
│   ├── goal/
│   │   ├── aggregates/
│   │   ├── entities/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── value-objects/
│   ├── notification/
│   ├── reminder/
│   ├── repository/
│   ├── schedule/
│   ├── setting/
│   ├── task/
│   └── index.ts
├── dist/                  # 构建输出
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

---

## 🚀 构建和开发

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 类型检查 + 构建监听
pnpm dev

# 仅类型检查
pnpm typecheck
```

### 构建

```bash
pnpm build
```

### 测试

```bash
# 运行所有测试
pnpm test

# 运行测试 (单次)
pnpm test:run

# 测试覆盖率
pnpm test:coverage

# 测试 UI
pnpm test:ui
```

---

## 📊 统计信息

- **总代码行数**: ~495 行 (不含测试)
- **模块数量**: 10 个核心业务模块
- **聚合根数量**: ~10 个
- **实体数量**: ~30+ 个
- **值对象数量**: ~20+ 个
- **领域服务数量**: ~10 个

---

## 🔗 相关文档

- [项目概览](./project-overview.md)
- [@dailyuse/domain-client 包文档](./packages-domain-client.md)
- [@dailyuse/contracts 包文档](./packages-contracts.md)
- [@dailyuse/utils 包文档](./packages-utils.md)
- [API 架构文档](./architecture-api.md)
- [DDD 规范](./DDD规范.md)

---

## 📝 设计原则

### SOLID 原则

- ✅ **单一职责**: 每个聚合根只负责一个业务边界
- ✅ **开闭原则**: 通过继承和接口扩展，而非修改
- ✅ **里氏替换**: 子类可以替换父类
- ✅ **接口隔离**: 仓储接口精简，按需定义
- ✅ **依赖倒置**: 依赖抽象接口，而非具体实现

### DDD 最佳实践

1. **聚合根是事务边界**: 一次只修改一个聚合根
2. **通过 ID 引用其他聚合**: 避免聚合间直接引用
3. **值对象不可变**: 创建后不可修改
4. **领域事件**: 聚合根发布事件，解耦业务流程
5. **仓储接口**: 抽象数据访问，保持领域纯净

---

**文档维护**: BMAD v6 Analyst (Mary)  
**最后更新**: 2025-10-28 16:45:00
