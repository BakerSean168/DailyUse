# DailyUse 项目 - Epic 规划文档

> **文档版本**: v1.0  
> **生成时间**: 2025-10-28  
> **基于**: PRD-PRODUCT-REQUIREMENTS.md  
> **规划范围**: MVP + MMP (Phase 1 & 2)

---

## 📋 Epic 总览

本文档将 PRD 中的 89 个功能需求拆分为 **10 个核心 Epic**，每个 Epic 对应一个业务模块。

### Epic 优先级分布

```
Phase 1 (MVP) - 8-10 周
├── Epic 1: Account & Authentication (P0) - 2 周
├── Epic 2: Goal Module (P0) - 4 周
├── Epic 3: Task Module (P0) - 3 周
├── Epic 4: Schedule Module (P0) - 2 周
├── Epic 5: Reminder Module (P0) - 1 周
├── Epic 6: Notification Module (P0) - 1 周
├── Epic 7: Repository Module (P0) - 1.5 周
├── Epic 8: Editor Module (P0) - 3 周
└── Epic 9: Setting Module (P0) - 0.5 周

Phase 2 (MMP) - 6-8 周
├── Epic 2.1: Goal Enhancement (P1) - 2 周
├── Epic 3.1: Task Enhancement (P1) - 1.5 周
├── Epic 4.1: Schedule Enhancement (P1) - 2.5 周
├── Epic 5.1: Reminder Enhancement (P1) - 0.5 周
├── Epic 6.1: Notification Enhancement (P1) - 1 周
├── Epic 7.1: Repository Enhancement (P1) - 2.5 周
└── Epic 9.1: Setting Enhancement (P1) - 1.5 周
```

---

## Epic 1: Account & Authentication (账户与认证)

**Epic ID**: EPIC-ACCOUNT-001  
**优先级**: P0  
**预估时间**: 2 周  
**Sprint**: Sprint 1  
**状态**: 📋 Planning

### Epic 目标

建立用户账户体系和认证机制，为整个平台提供安全的用户管理基础。

### 功能范围

#### 基础 CRUD (5 个功能)
- AC-001: 用户注册
- AC-002: 用户登录
- AC-003: 查看个人资料
- AC-004: 修改密码
- AC-005: 注销账户

#### 认证功能 (4 个功能)
- AUTH-001: JWT Token 管理
- AUTH-002: 邮箱验证
- AUTH-003: 密码重置
- AUTH-004: 会话管理

### User Stories 拆分

| Story ID | Story 标题 | 优先级 | Story Points | 依赖 |
|----------|-----------|--------|--------------|------|
| STORY-1.1 | 用户注册与邮箱验证 | P0 | 5 | - |
| STORY-1.2 | 用户登录与 Token 管理 | P0 | 5 | STORY-1.1 |
| STORY-1.3 | 个人资料管理 | P0 | 3 | STORY-1.2 |
| STORY-1.4 | 密码管理（修改/重置） | P0 | 3 | STORY-1.2 |
| STORY-1.5 | 会话管理与账户注销 | P0 | 2 | STORY-1.2 |

**Total**: 18 Story Points

### 验收标准

```gherkin
Feature: 账户与认证

Scenario: 用户注册
  Given 访客用户在注册页面
  When 填写邮箱、用户名、密码
  And 输入邮箱验证码
  Then 账户创建成功
  And 自动登录并跳转到主页

Scenario: 用户登录
  Given 用户在登录页面
  When 输入正确的邮箱和密码
  Then 登录成功并获得 Token
  And 跳转到主页

Scenario: 修改密码
  Given 已登录用户
  When 输入旧密码和新密码
  Then 密码修改成功
  And 所有会话被清除
  And 收到邮件通知
```

### 技术栈

- **Backend**: NestJS + Prisma + JWT
- **Frontend**: Vue 3 + Pinia
- **Database**: PostgreSQL (Account, AuthCredential 表)
- **安全**: bcrypt 密码加密，验证码限流

### 相关文档

- [PRD - Account 模块](./PRD-PRODUCT-REQUIREMENTS.md#1-account-账户模块)
- [PRD - Authentication 模块](./PRD-PRODUCT-REQUIREMENTS.md#2-authentication-认证模块)

---

## Epic 2: Goal Module (目标管理)

**Epic ID**: EPIC-GOAL-001  
**优先级**: P0  
**预估时间**: 4 周  
**Sprint**: Sprint 2-3  
**状态**: 📋 Planning

### Epic 目标

实现基于 OKR 的目标管理系统，支持目标层级、关键结果追踪、权重快照、进度自动计算等核心功能。

### 功能范围

#### 基础 CRUD (6 个功能)
- GOAL-001: 创建目标
- GOAL-002: 查看目标列表
- GOAL-003: 查看目标详情
- GOAL-004: 更新目标
- GOAL-005: 删除目标
- GOAL-006: Key Result 管理

#### P0 高级功能 (3 个功能)
- GOAL-101: KR 权重快照 (RICE: 672)
- GOAL-102: 专注周期聚焦模式 (RICE: 432)
- GOAL-103: 目标进度自动计算 (RICE: 480)

### User Stories 拆分

| Story ID | Story 标题 | 优先级 | Story Points | 依赖 |
|----------|-----------|--------|--------------|------|
| STORY-2.1 | 目标 CRUD 基础功能 | P0 | 5 | STORY-1.2 |
| STORY-2.2 | Key Result 管理 | P0 | 5 | STORY-2.1 |
| STORY-2.3 | KR 权重快照 | P0 | 8 | STORY-2.2 |
| STORY-2.4 | 目标进度自动计算 | P0 | 5 | STORY-2.2 |
| STORY-2.5 | 专注周期聚焦模式 | P0 | 8 | STORY-2.1 |

**Total**: 31 Story Points

### 验收标准

```gherkin
Feature: 目标管理

Scenario: 创建 OKR 目标
  Given 已登录用户
  When 创建目标"Q4 增长目标"
  And 添加 3 个 Key Results
  And 为每个 KR 设置权重（40%, 30%, 30%）
  Then 目标创建成功
  And 自动创建权重快照

Scenario: KR 权重调整自动快照
  Given 目标已有 3 个 KR
  When 调整 KR 权重从 (40%, 30%, 30%) 到 (50%, 30%, 20%)
  Then 自动创建新快照
  And 记录调整时间和原因

Scenario: 目标进度自动计算
  Given 目标有 3 个 KR（权重 40%, 30%, 30%）
  When KR1 完成 50%, KR2 完成 80%, KR3 完成 100%
  Then 目标整体进度 = 50%*40% + 80%*30% + 100%*30% = 74%
```

### 技术栈

- **Backend**: NestJS + DDD 架构
- **Frontend**: Vue 3 + Echarts (进度可视化)
- **Database**: Goal, KeyResult, KRWeightSnapshot 表

### 相关文档

- [PRD - Goal 模块](./PRD-PRODUCT-REQUIREMENTS.md#3-goal-目标模块)
- [Feature Spec - KR 权重快照](./modules/goal/features/02-kr-weight-snapshot.md)
- [Feature Spec - 专注周期](./modules/goal/features/03-focus-mode.md)
- [Feature Spec - 进度自动计算](./modules/goal/features/04-progress-auto-calculation.md)

---

## Epic 3: Task Module (任务管理)

**Epic ID**: EPIC-TASK-001  
**优先级**: P0  
**预估时间**: 3 周  
**Sprint**: Sprint 3-4  
**状态**: 📋 Planning

### Epic 目标

实现基于 GTD 的任务管理系统，支持任务依赖、优先级矩阵、时间块等高级功能。

### 功能范围

#### 基础 CRUD (6 个功能)
- TASK-001: 创建任务
- TASK-002: 查看任务列表
- TASK-003: 更新任务
- TASK-004: 删除任务
- TASK-005: 任务批量操作
- TASK-006: 子任务管理

#### P0 高级功能 (3 个功能)
- TASK-101: 任务依赖图
- TASK-102: 任务优先级矩阵（艾森豪威尔矩阵）
- TASK-105: 任务依赖关系

### User Stories 拆分

| Story ID | Story 标题 | 优先级 | Story Points | 依赖 |
|----------|-----------|--------|--------------|------|
| STORY-3.1 | 任务 CRUD 基础功能 | P0 | 5 | STORY-1.2 |
| STORY-3.2 | 子任务管理 | P0 | 3 | STORY-3.1 |
| STORY-3.3 | 任务依赖关系 | P0 | 8 | STORY-3.1 |
| STORY-3.4 | 任务依赖图可视化 | P0 | 8 | STORY-3.3 |
| STORY-3.5 | 任务优先级矩阵 | P0 | 5 | STORY-3.1 |

**Total**: 29 Story Points

### 验收标准

```gherkin
Feature: 任务管理

Scenario: 创建任务并设置优先级
  Given 已登录用户
  When 创建任务"开发登录功能"
  And 设置优先级为"紧急重要"
  And 设置截止日期为明天
  Then 任务创建成功
  And 出现在优先级矩阵的第一象限

Scenario: 设置任务依赖关系
  Given 已有任务 A"设计 UI" 和任务 B"开发前端"
  When 设置任务 B 依赖任务 A
  Then 依赖关系保存成功
  And DAG 图中显示 A → B

Scenario: 任务依赖阻塞
  Given 任务 B 依赖任务 A
  When 尝试将任务 B 状态改为"进行中"
  And 任务 A 状态仍为"待办"
  Then 显示阻塞警告："依赖任务 A 尚未完成"
```

### 技术栈

- **Backend**: NestJS + DDD 架构
- **Frontend**: Vue 3 + D3.js (DAG 可视化)
- **Database**: Task, TaskDependency 表

### 相关文档

- [PRD - Task 模块](./PRD-PRODUCT-REQUIREMENTS.md#4-task-任务模块)
- [Feature Spec - 任务依赖图](./modules/task/features/01-dependency-graph.md)
- [Feature Spec - 优先级矩阵](./modules/task/features/02-priority-matrix.md)
- [Feature Spec - 任务依赖关系](./modules/task/features/06-task-dependencies.md)

---

## Epic 4: Schedule Module (日程管理)

**Epic ID**: EPIC-SCHEDULE-001  
**优先级**: P0  
**预估时间**: 2 周  
**Sprint**: Sprint 4-5  
**状态**: 📋 Planning

### Epic 目标

实现日程调度系统，支持日历视图、重复事件、冲突检测等功能。

### 功能范围

#### 基础 CRUD (5 个功能)
- SCHEDULE-001: 创建日程事件
- SCHEDULE-002: 查看日程列表
- SCHEDULE-003: 更新日程事件
- SCHEDULE-004: 删除日程事件
- SCHEDULE-005: 重复事件管理

#### P0 高级功能 (2 个功能)
- SCHEDULE-101: 冲突检测
- SCHEDULE-103: 周视图

### User Stories 拆分

| Story ID | Story 标题 | 优先级 | Story Points | 依赖 |
|----------|-----------|--------|--------------|------|
| STORY-4.1 | 日程事件 CRUD | P0 | 5 | STORY-1.2 |
| STORY-4.2 | 重复事件管理 | P0 | 5 | STORY-4.1 |
| STORY-4.3 | 日程冲突检测 | P0 | 5 | STORY-4.1 |
| STORY-4.4 | 周视图日历 | P0 | 3 | STORY-4.1 |

**Total**: 18 Story Points

### 验收标准

```gherkin
Feature: 日程管理

Scenario: 创建日程事件
  Given 已登录用户
  When 创建日程"团队会议"
  And 设置时间为今天 14:00-15:00
  Then 日程创建成功
  And 显示在日历视图

Scenario: 日程冲突检测
  Given 已有日程"会议 A" 时间为 14:00-15:00
  When 创建日程"会议 B" 时间为 14:30-15:30
  Then 显示冲突警告
  And 列出冲突的日程"会议 A"
```

### 技术栈

- **Backend**: NestJS + 冲突检测算法
- **Frontend**: Vue 3 + FullCalendar
- **Database**: Schedule 表

### 相关文档

- [PRD - Schedule 模块](./PRD-PRODUCT-REQUIREMENTS.md#5-schedule-日程模块)
- [Feature Spec - 冲突检测](./modules/schedule/features/01-conflict-detection.md)
- [Feature Spec - 周视图](./modules/schedule/features/04-week-view.md)

---

## Epic 5: Reminder Module (提醒管理)

**Epic ID**: EPIC-REMINDER-001  
**优先级**: P0  
**预估时间**: 1 周  
**Sprint**: Sprint 5  
**状态**: 📋 Planning

### Epic 目标

实现智能提醒系统，支持多场景触发、多渠道推送、智能频率调整。

### 功能范围

#### 基础 CRUD (5 个功能)
- REMINDER-001: 创建提醒
- REMINDER-002: 查看提醒列表
- REMINDER-003: 更新提醒
- REMINDER-004: 删除提醒
- REMINDER-005: 提醒触发

#### P0 高级功能 (1 个功能)
- REMINDER-101: 智能提醒频率

### User Stories 拆分

| Story ID | Story 标题 | 优先级 | Story Points | 依赖 |
|----------|-----------|--------|--------------|------|
| STORY-5.1 | 提醒 CRUD + 触发机制 | P0 | 5 | STORY-1.2 |
| STORY-5.2 | 智能提醒频率调整 | P0 | 5 | STORY-5.1 |

**Total**: 10 Story Points

### 技术栈

- **Backend**: NestJS + 定时任务 (node-cron)
- **Frontend**: Vue 3
- **Database**: Reminder 表

### 相关文档

- [PRD - Reminder 模块](./PRD-PRODUCT-REQUIREMENTS.md#6-reminder-提醒模块)
- [Feature Spec - 智能频率](./modules/reminder/features/01-smart-frequency.md)

---

## Epic 6: Notification Module (通知中心)

**Epic ID**: EPIC-NOTIFICATION-001  
**优先级**: P0  
**预估时间**: 1 周  
**Sprint**: Sprint 5  
**状态**: 📋 Planning

### Epic 目标

实现多渠道通知聚合中心，统一管理系统通知、任务提醒、目标更新等消息。

### 功能范围

#### 基础 CRUD (4 个功能)
- NOTIFICATION-001: 创建通知
- NOTIFICATION-002: 查看通知列表
- NOTIFICATION-003: 标记已读
- NOTIFICATION-004: 删除通知

#### P0 高级功能 (1 个功能)
- NOTIFICATION-101: 多渠道通知聚合

### User Stories 拆分

| Story ID | Story 标题 | 优先级 | Story Points | 依赖 |
|----------|-----------|--------|--------------|------|
| STORY-6.1 | 通知 CRUD + 多渠道聚合 | P0 | 8 | STORY-1.2 |

**Total**: 8 Story Points

### 技术栈

- **Backend**: NestJS + WebSocket (实时推送)
- **Frontend**: Vue 3 + SSE
- **Database**: Notification 表

### 相关文档

- [PRD - Notification 模块](./PRD-PRODUCT-REQUIREMENTS.md#7-notification-通知模块)
- [Feature Spec - 多渠道聚合](./modules/notification/features/01-multi-channel-aggregation.md)

---

## Epic 7: Repository Module (知识仓库)

**Epic ID**: EPIC-REPOSITORY-001  
**优先级**: P0  
**预估时间**: 1.5 周  
**Sprint**: Sprint 6  
**状态**: 📋 Planning

### Epic 目标

实现 Markdown 文档管理系统，支持文件夹组织、版本控制、全文搜索。

### 功能范围

#### 基础 CRUD (5 个功能)
- REPOSITORY-001: 创建文档
- REPOSITORY-002: 查看文档列表
- REPOSITORY-003: 编辑文档
- REPOSITORY-004: 删除文档
- REPOSITORY-005: 文档版本管理

#### P0 高级功能 (1 个功能)
- REPOSITORY-102: 版本管理

### User Stories 拆分

| Story ID | Story 标题 | 优先级 | Story Points | 依赖 |
|----------|-----------|--------|--------------|------|
| STORY-7.1 | 文档 CRUD 基础功能 | P0 | 5 | STORY-1.2 |
| STORY-7.2 | Git 式版本管理 | P0 | 8 | STORY-7.1 |

**Total**: 13 Story Points

### 技术栈

- **Backend**: NestJS + 版本快照
- **Frontend**: Vue 3
- **Database**: Repository, DocumentVersion 表

### 相关文档

- [PRD - Repository 模块](./PRD-PRODUCT-REQUIREMENTS.md#8-repository-仓库模块)
- [Feature Spec - 版本管理](./modules/repository/features/02-version-management.md)

---

## Epic 8: Editor Module (Markdown 编辑器)

**Epic ID**: EPIC-EDITOR-001  
**优先级**: P0  
**预估时间**: 3 周  
**Sprint**: Sprint 6-7  
**状态**: 📋 Planning

### Epic 目标

实现 Obsidian 风格的 Markdown 编辑器，支持双向链接、实时预览、语法高亮。

### 功能范围

#### 基础 CRUD (4 个功能)
- EDITOR-001: 创建编辑会话
- EDITOR-002: 保存文档
- EDITOR-003: Markdown 渲染
- EDITOR-004: 编辑器工作空间

#### P0 高级功能 (2 个功能)
- EDITOR-101: 双向链接
- EDITOR-102: Markdown 编辑器增强

### User Stories 拆分

| Story ID | Story 标题 | 优先级 | Story Points | 依赖 |
|----------|-----------|--------|--------------|------|
| STORY-8.1 | Markdown 编辑器基础 | P0 | 8 | STORY-7.1 |
| STORY-8.2 | 双向链接功能 | P0 | 13 | STORY-8.1 |

**Total**: 21 Story Points

### 技术栈

- **Backend**: NestJS
- **Frontend**: Vue 3 + Monaco Editor / CodeMirror
- **Database**: DocumentLink 表

### 相关文档

- [PRD - Editor 模块](./PRD-PRODUCT-REQUIREMENTS.md#9-editor-编辑器模块)
- [Feature Spec - 双向链接](./modules/editor/features/01-bidirectional-links.md)
- [Feature Spec - Markdown 编辑器](./modules/editor/features/02-markdown-editor.md)

---

## Epic 9: Setting Module (用户设置)

**Epic ID**: EPIC-SETTING-001  
**优先级**: P0  
**预估时间**: 0.5 周  
**Sprint**: Sprint 7  
**状态**: 📋 Planning

### Epic 目标

实现用户偏好设置系统，支持主题、语言、通知偏好等配置。

### 功能范围

#### 基础 CRUD (4 个功能)
- SETTING-001: 查看设置
- SETTING-002: 更新设置
- SETTING-003: 重置设置
- SETTING-004: 设置同步

#### P0 高级功能 (1 个功能)
- SETTING-101: 用户偏好设置

### User Stories 拆分

| Story ID | Story 标题 | 优先级 | Story Points | 依赖 |
|----------|-----------|--------|--------------|------|
| STORY-9.1 | 用户偏好设置管理 | P0 | 5 | STORY-1.2 |

**Total**: 5 Story Points

### 技术栈

- **Backend**: NestJS
- **Frontend**: Vue 3
- **Database**: Setting 表

### 相关文档

- [PRD - Setting 模块](./PRD-PRODUCT-REQUIREMENTS.md#10-setting-设置模块)
- [Feature Spec - 用户偏好](./modules/setting/features/01-user-preferences.md)

---

## 📊 Sprint 规划建议

### Phase 1: MVP (8-10 周)

| Sprint | 周数 | Epic | Story Points | 关键交付 |
|--------|------|------|--------------|----------|
| Sprint 1 | 2 周 | Epic 1 | 18 SP | 账户认证系统 |
| Sprint 2 | 2 周 | Epic 2 (Part 1) | 15 SP | 目标 CRUD + KR 管理 |
| Sprint 3 | 2 周 | Epic 2 (Part 2) + Epic 3 (Part 1) | 16 + 8 = 24 SP | KR 快照 + 任务基础 |
| Sprint 4 | 2 周 | Epic 3 (Part 2) + Epic 4 | 21 + 18 = 39 SP | 任务依赖 + 日程管理 |
| Sprint 5 | 1 周 | Epic 5 + Epic 6 | 10 + 8 = 18 SP | 提醒 + 通知 |
| Sprint 6 | 2 周 | Epic 7 + Epic 8 (Part 1) | 13 + 8 = 21 SP | 文档仓库 + 编辑器基础 |
| Sprint 7 | 2 周 | Epic 8 (Part 2) + Epic 9 | 13 + 5 = 18 SP | 双向链接 + 设置 |

**Total**: 8-10 周，173 Story Points

### Phase 2: MMP (6-8 周)

Phase 2 将在 MVP 完成后规划，主要包含 P1 优先级的增强功能。

---

## 🎯 下一步行动

1. **Sprint Planning**: 运行 `sprint-planning` workflow 生成 `sprint-status.yaml`
2. **Story Creation**: 为 Sprint 1 创建详细的 User Story 文档
3. **Tech Spec**: 为高 RICE 评分的功能编写技术设计文档
4. **Architecture Review**: 审查跨模块依赖和数据库设计
5. **Environment Setup**: 搭建开发/测试/CI 环境

---

## 📚 相关文档

- [PRD 产品需求文档](./PRD-PRODUCT-REQUIREMENTS.md)
- [项目概览](./project-overview.md)
- [架构文档](./architecture-web.md)
- [包文档索引](./packages-index.md)

---

**文档维护**: BMAD v6 Analyst (Mary)  
**生成时间**: 2025-10-28 18:00:00  
**文档状态**: ✅ Epic 规划完成
