# DailyUse 产品需求文档 (PRD)

> **文档版本**: v1.0  
> **生成时间**: 2025-10-28  
> **产品**: DailyUse - 智能个人效率管理平台  
> **文档类型**: 产品需求文档 (Product Requirements Document)

---

## 📋 文档概述

本文档汇总 DailyUse 项目的**所有功能需求**，包括：
- **基础 CRUD 功能**：10 个核心模块的增删改查
- **高级功能特性**：超越 CRUD 的 40+ 个创新功能
- **功能优先级**：MVP / MMP / Future 分阶段规划

---

## 🎯 产品定位

### 产品愿景

打造一款**智能化、一体化的个人效率管理平台**，帮助用户高效管理目标、任务、日程、知识，实现个人成长和目标达成。

### 目标用户

- **核心用户**: 追求高效的知识工作者、创业者、学生
- **次要用户**: 团队管理者、自由职业者
- **典型画像**: 25-40 岁，有明确目标，需要系统化管理个人事务

### 产品核心价值

1. **目标驱动**: OKR 体系贯穿全局
2. **知识沉淀**: Markdown 文档 + 双向链接
3. **智能提醒**: 多场景、多渠道智能提醒
4. **跨平台**: Web + Desktop (Electron)
5. **数据安全**: 本地优先 + 可选云同步

---

## 🏗️ 模块架构

DailyUse 包含 **10 个核心业务模块**：

```
DailyUse Platform
├── Account (账户) ─────────── 用户账户与个人资料
├── Authentication (认证) ──── 登录认证与权限管理
├── Goal (目标) ────────────── OKR 目标管理
├── Task (任务) ────────────── GTD 任务管理
├── Schedule (日程) ────────── 日程调度与日历
├── Reminder (提醒) ────────── 智能提醒系统
├── Notification (通知) ────── 多渠道通知中心
├── Repository (仓库) ──────── 文档知识库
├── Editor (编辑器) ────────── Markdown 编辑器
└── Setting (设置) ─────────── 用户偏好设置
```

---

## 📊 功能需求总览

### 功能统计

| 模块 | 基础 CRUD | 高级功能 | 总功能 | MVP 功能 | 文档链接 |
|------|-----------|----------|--------|----------|----------|
| **Account** | 5 | 2 | 7 | 5 | [详情](#1-account-账户模块) |
| **Authentication** | 4 | 3 | 7 | 4 | [详情](#2-authentication-认证模块) |
| **Goal** | 6 | 8 | 14 | 9 | [详情](#3-goal-目标模块) |
| **Task** | 6 | 7 | 13 | 8 | [详情](#4-task-任务模块) |
| **Schedule** | 5 | 5 | 10 | 7 | [详情](#5-schedule-日程模块) |
| **Reminder** | 5 | 4 | 9 | 6 | [详情](#6-reminder-提醒模块) |
| **Notification** | 4 | 4 | 8 | 5 | [详情](#7-notification-通知模块) |
| **Repository** | 5 | 3 | 8 | 6 | [详情](#8-repository-仓库模块) |
| **Editor** | 4 | 3 | 7 | 5 | [详情](#9-editor-编辑器模块) |
| **Setting** | 4 | 2 | 6 | 5 | [详情](#10-setting-设置模块) |
| **总计** | **48** | **41** | **89** | **60** | - |

### 开发阶段规划

```
Phase 1: MVP (8-10 周)
├── 基础 CRUD: 48 个功能
├── 核心高级功能: 12 个 (P0)
└── 预计交付: 60 个功能

Phase 2: MMP (6-8 周)
├── 增强功能: 15 个 (P1)
├── 集成功能: 8 个 (P2)
└── 预计交付: 23 个功能

Phase 3: Future (持续迭代)
├── 创新功能: 6 个 (P3)
└── AI 智能特性
```

---

## 1. Account (账户模块)

### 1.1 基础 CRUD 功能

#### AC-001: 用户注册
**需求描述**: 用户通过邮箱/用户名注册账户

**功能要点**:
- 邮箱/用户名唯一性验证
- 密码强度检查（最少 8 位，包含大小写字母、数字）
- 邮箱验证码发送
- 自动创建默认用户配置

**API 设计**:
```typescript
POST /api/accounts/register
Body: {
  username: string;
  email: string;
  password: string;
  verificationCode?: string;
}
Response: AccountResponseDto
```

---

#### AC-002: 用户登录
**需求描述**: 用户通过邮箱或用户名登录

**功能要点**:
- 支持邮箱/用户名登录
- 密码加密验证（bcrypt）
- JWT Token 签发
- 记住我功能（7天有效期）
- 登录失败次数限制（5次锁定 15 分钟）

**API 设计**:
```typescript
POST /api/auth/login
Body: {
  usernameOrEmail: string;
  password: string;
  rememberMe?: boolean;
}
Response: {
  accessToken: string;
  refreshToken: string;
  user: AccountResponseDto;
}
```

---

#### AC-003: 查看个人资料
**需求描述**: 用户查看和编辑个人信息

**功能要点**:
- 查看：用户名、邮箱、手机号、头像、简介
- 编辑：昵称、头像、简介、手机号
- 敏感信息（邮箱、用户名）不可修改

**API 设计**:
```typescript
GET /api/accounts/me
Response: AccountResponseDto

PUT /api/accounts/me
Body: UpdateAccountDto
Response: AccountResponseDto
```

---

#### AC-004: 修改密码
**需求描述**: 用户修改登录密码

**功能要点**:
- 需要验证旧密码
- 新密码强度检查
- 修改成功后清除所有登录 Token
- 发送邮件通知

**API 设计**:
```typescript
PUT /api/accounts/me/password
Body: {
  oldPassword: string;
  newPassword: string;
}
Response: { success: boolean; message: string; }
```

---

#### AC-005: 注销账户
**需求描述**: 用户永久删除账户（软删除）

**功能要点**:
- 需要二次确认（输入密码）
- 软删除（保留 30 天）
- 关联数据级联删除/归档
- 发送确认邮件

**API 设计**:
```typescript
DELETE /api/accounts/me
Body: { password: string; reason?: string; }
Response: { success: boolean; deletionDate: string; }
```

---

### 1.2 高级功能特性

#### AC-101: 用户偏好设置 (P1)
**需求描述**: 用户自定义界面和行为偏好

**功能要点**:
- 主题设置（浅色/深色/自动）
- 语言设置（中文/英文）
- 通知偏好（邮件/推送/站内）
- 默认视图设置
- 快捷键自定义

---

#### AC-102: 数据导入导出 (P2)
**需求描述**: 导入/导出用户数据

**功能要点**:
- 导出格式：JSON / CSV / Markdown
- 导出范围：全部/指定模块
- 导入：批量创建目标/任务
- 导入冲突处理

---

## 2. Authentication (认证模块)

### 2.1 基础 CRUD 功能

#### AUTH-001: JWT Token 管理
**需求描述**: 管理访问令牌和刷新令牌

**功能要点**:
- AccessToken: 1 小时有效期
- RefreshToken: 7 天有效期
- Token 自动刷新机制
- Token 黑名单（登出时）

---

#### AUTH-002: 邮箱验证
**需求描述**: 邮箱验证码发送和验证

**功能要点**:
- 验证码：6 位数字
- 有效期：10 分钟
- 频率限制：1 分钟 1 次
- 用途：注册、重置密码、修改邮箱

---

#### AUTH-003: 密码重置
**需求描述**: 通过邮箱重置密码

**功能要点**:
- 发送重置链接到邮箱
- 链接有效期：1 小时
- 重置成功后清除所有 Token
- 防止重放攻击

---

#### AUTH-004: 会话管理
**需求描述**: 查看和管理活跃会话

**功能要点**:
- 查看所有登录设备
- 显示：设备类型、IP、最后活跃时间
- 支持强制登出某个设备
- 支持登出所有设备

---

### 2.2 高级功能特性

#### AUTH-101: 双因素认证 (2FA) (P2)
**需求描述**: 增强账户安全性

**功能要点**:
- TOTP 算法（Google Authenticator）
- 备用恢复码（10 个）
- 登录时二次验证
- 信任设备（30 天免验证）

---

#### AUTH-102: OAuth 第三方登录 (P3)
**需求描述**: 支持第三方账号登录

**功能要点**:
- 支持：GitHub / Google / 微信
- 账号绑定/解绑
- 自动创建本地账户
- 权限范围控制

---

#### AUTH-103: 登录审计日志 (P2)
**需求描述**: 记录所有登录活动

**功能要点**:
- 记录：时间、IP、设备、结果
- 异常登录告警（新设备/异地）
- 日志保留 90 天
- 支持导出审计报告

---

## 3. Goal (目标模块)

### 3.1 基础 CRUD 功能

#### GOAL-001: 创建目标
**需求描述**: 创建 OKR 目标

**功能要点**:
- 目标标题（必填，最多 200 字符）
- 目标描述（可选，Markdown 格式）
- 起止日期（必填）
- 目标状态：DRAFT / ACTIVE / COMPLETED / ABANDONED
- 父目标关联（支持目标层级）

**API 设计**:
```typescript
POST /api/goals
Body: CreateGoalDto
Response: GoalResponseDto
```

---

#### GOAL-002: 查看目标列表
**需求描述**: 分页查询目标列表

**功能要点**:
- 筛选：状态、日期范围、标签
- 排序：创建时间、截止日期、进度
- 分页：默认 20 条/页
- 搜索：标题关键词

**API 设计**:
```typescript
GET /api/goals?status=ACTIVE&page=1&pageSize=20
Response: PaginatedResponse<GoalResponseDto>
```

---

#### GOAL-003: 查看目标详情
**需求描述**: 查看单个目标的完整信息

**功能要点**:
- 目标基本信息
- 关联的 Key Results（关键结果）
- 子目标列表
- 关联任务列表
- 进度统计

---

#### GOAL-004: 更新目标
**需求描述**: 修改目标信息

**功能要点**:
- 可修改：标题、描述、截止日期、状态
- 不可修改：创建时间、创建人
- 状态变更规则：
  - DRAFT → ACTIVE（激活）
  - ACTIVE → COMPLETED（完成）
  - ACTIVE → ABANDONED（放弃）

---

#### GOAL-005: 删除目标
**需求描述**: 删除目标（软删除）

**功能要点**:
- 软删除（保留 30 天）
- 关联 KR 级联删除
- 子目标解除父目标关联
- 回收站功能

---

#### GOAL-006: Key Result 管理
**需求描述**: 管理目标的关键结果

**功能要点**:
- 创建 KR：标题、目标值、当前值、权重
- 更新 KR 进度
- 删除 KR
- KR 权重总和必须 = 100%

---

### 3.2 高级功能特性

#### GOAL-101: KR 权重快照 (P0)
**功能编号**: GOAL-002  
**RICE 评分**: 672  
**优先级**: P0  
**文档**: [docs/modules/goal/features/02-kr-weight-snapshot.md](./modules/goal/features/02-kr-weight-snapshot.md)

**需求描述**: 自动记录 KR 权重变更历史

**核心场景**:
1. 用户调整 KR 权重时，自动创建快照
2. 查看 KR 权重变化历史
3. 对比不同时间点的权重分配

**价值**:
- ✅ 提供完整的权重调整历史
- ✅ 支持权重变化趋势分析
- ✅ 增强目标管理透明度

---

#### GOAL-102: 专注周期聚焦模式 (P0)
**功能编号**: GOAL-003  
**RICE 评分**: 432  
**优先级**: P0  
**文档**: [docs/modules/goal/features/03-focus-mode.md](./modules/goal/features/03-focus-mode.md)

**需求描述**: 设定专注周期，集中精力完成特定目标

**核心场景**:
1. 创建专注周期（如：本周专注目标 A）
2. 周期内屏蔽其他目标干扰
3. 周期结束自动复盘

**价值**:
- ✅ 提升目标执行专注度
- ✅ 减少多目标切换成本
- ✅ 强制复盘机制

---

#### GOAL-103: 目标进度自动计算 (P0)
**功能编号**: GOAL-004  
**RICE 评分**: 480  
**优先级**: P0  
**文档**: [docs/modules/goal/features/04-progress-auto-calculation.md](./modules/goal/features/04-progress-auto-calculation.md)

**需求描述**: 根据 KR 完成情况自动计算目标进度

**核心场景**:
1. KR 进度更新后，自动计算目标整体进度
2. 权重加权计算：`Goal Progress = Σ(KR Progress × KR Weight)`
3. 实时进度更新

**价值**:
- ✅ 自动化进度追踪
- ✅ 减少手动计算错误
- ✅ 实时反馈目标状态

---

#### GOAL-104: 目标复盘 (P1)
**功能编号**: GOAL-004  
**RICE 评分**: 336  
**优先级**: P1  
**文档**: [docs/modules/goal/features/04-goal-retrospective.md](./modules/goal/features/04-goal-retrospective.md)

**需求描述**: 目标完成/放弃后进行复盘总结

**核心场景**:
1. 目标状态变更为 COMPLETED/ABANDONED 时触发
2. 填写复盘表单：完成情况、经验教训、改进建议
3. 生成复盘报告

---

#### GOAL-105: 目标任务关联 (P1)
**功能编号**: GOAL-005  
**RICE 评分**: 224  
**优先级**: P1  
**文档**: [docs/modules/goal/features/05-goal-task-link.md](./modules/goal/features/05-goal-task-link.md)

**需求描述**: 将任务关联到目标和 KR

**核心场景**:
1. 创建任务时选择关联的目标/KR
2. 任务完成自动更新 KR 进度
3. 目标详情显示关联任务列表

---

#### GOAL-106: 目标模板库 (P2)
**功能编号**: GOAL-006  
**RICE 评分**: 140  
**优先级**: P2  
**文档**: [docs/modules/goal/features/06-goal-template-library.md](./modules/goal/features/06-goal-template-library.md)

**需求描述**: 预定义常用目标模板

**模板示例**:
- 学习新技能（3 个月）
- 健康管理（季度）
- 职业发展（年度）
- 项目管理（自定义）

---

#### GOAL-107: 目标依赖关系 (P3)
**功能编号**: GOAL-007  
**RICE 评分**: 105  
**优先级**: P3  
**文档**: [docs/modules/goal/features/07-goal-dependencies.md](./modules/goal/features/07-goal-dependencies.md)

**需求描述**: 设置目标之间的依赖关系

**核心场景**:
1. 目标 A 依赖目标 B（B 完成后 A 才能开始）
2. 依赖关系可视化（DAG 图）
3. 依赖阻塞告警

---

#### GOAL-108: 目标健康度评分 (P3)
**功能编号**: GOAL-008  
**RICE 评分**: 98  
**优先级**: P3  
**文档**: [docs/modules/goal/features/08-goal-health-score.md](./modules/goal/features/08-goal-health-score.md)

**需求描述**: 智能评估目标健康状态

**评分维度**:
- 进度健康度（是否按计划推进）
- KR 平衡度（权重分配合理性）
- 活跃度（最近更新频率）
- 风险度（剩余时间 vs 完成度）

---

## 4. Task (任务模块)

### 4.1 基础 CRUD 功能

#### TASK-001: 创建任务
**需求描述**: 创建待办任务

**功能要点**:
- 任务标题（必填）
- 任务描述（Markdown）
- 优先级：LOW / MEDIUM / HIGH / URGENT
- 状态：TODO / IN_PROGRESS / BLOCKED / COMPLETED / CANCELLED
- 截止日期（可选）
- 标签（多选）
- 关联目标/KR

---

#### TASK-002: 查看任务列表
**需求描述**: 分页查询任务列表

**功能要点**:
- 筛选：状态、优先级、截止日期、标签
- 排序：优先级、截止日期、创建时间
- 视图模式：列表 / 看板 / 日历
- 搜索：标题/描述关键词

---

#### TASK-003: 更新任务
**需求描述**: 修改任务信息

**功能要点**:
- 可修改所有字段
- 状态变更自动记录时间戳
- 任务完成记录 `completedAt`

---

#### TASK-004: 删除任务
**需求描述**: 删除任务（软删除）

**功能要点**:
- 软删除（保留 30 天）
- 回收站功能
- 批量删除支持

---

#### TASK-005: 任务批量操作
**需求描述**: 批量修改任务状态/标签

**功能要点**:
- 批量修改状态
- 批量添加/移除标签
- 批量设置优先级

---

#### TASK-006: 子任务管理
**需求描述**: 创建和管理子任务

**功能要点**:
- 最多 3 层嵌套
- 子任务完成自动更新父任务进度
- 父任务删除级联删除子任务

---

### 4.2 高级功能特性

#### TASK-101: 任务依赖图 (P0)
**功能编号**: TASK-001  
**优先级**: P0  
**文档**: [docs/modules/task/features/01-dependency-graph.md](./modules/task/features/01-dependency-graph.md)

**需求描述**: 可视化任务依赖关系

**核心场景**:
1. 设置任务 A 依赖任务 B
2. DAG 图展示任务依赖
3. 依赖阻塞告警

---

#### TASK-102: 任务优先级矩阵 (P0)
**功能编号**: TASK-002  
**优先级**: P0  
**文档**: [docs/modules/task/features/02-priority-matrix.md](./modules/task/features/02-priority-matrix.md)

**需求描述**: 四象限优先级管理（艾森豪威尔矩阵）

**核心场景**:
- 紧急重要：立即做
- 重要不紧急：计划做
- 紧急不重要：委托做
- 不紧急不重要：不做

---

#### TASK-103: 任务时间块 (P1)
**功能编号**: TASK-003  
**优先级**: P1  
**文档**: [docs/modules/task/features/03-task-time-blocks.md](./modules/task/features/03-task-time-blocks.md)

**需求描述**: 为任务分配时间块（时间盒）

**核心场景**:
1. 创建时间块（如：今天 9:00-10:30 做任务 A）
2. 日历视图展示时间块
3. 番茄钟集成

---

#### TASK-104: 进度快照 (P1)
**功能编号**: TASK-004  
**优先级**: P1  
**文档**: [docs/modules/task/features/04-progress-snapshot.md](./modules/task/features/04-progress-snapshot.md)

**需求描述**: 记录任务进度变化历史

---

#### TASK-105: 任务依赖关系 (P0)
**功能编号**: TASK-006  
**优先级**: P0  
**文档**: [docs/modules/task/features/06-task-dependencies.md](./modules/task/features/06-task-dependencies.md)

**需求描述**: 设置任务之间的依赖关系

---

#### TASK-106: 任务标签系统 (P2)
**功能编号**: TASK-007  
**优先级**: P2  
**文档**: [docs/modules/task/features/07-task-tags.md](./modules/task/features/07-task-tags.md)

**需求描述**: 自定义标签分类任务

---

#### TASK-107: 任务模板 (P3)
**功能编号**: TASK-008  
**优先级**: P3  
**文档**: [docs/modules/task/features/08-task-templates.md](./modules/task/features/08-task-templates.md)

**需求描述**: 保存常用任务作为模板

---

## 5. Schedule (日程模块)

### 5.1 基础 CRUD 功能

#### SCHEDULE-001: 创建日程事件
**需求描述**: 创建日程安排

**功能要点**:
- 事件标题、描述
- 开始时间、结束时间
- 重复规则（每日/每周/每月/自定义）
- 提醒设置
- 参与者（可选）

---

#### SCHEDULE-002: 查看日程列表
**需求描述**: 按日/周/月查看日程

**功能要点**:
- 日视图：今天的所有事件
- 周视图：本周日历
- 月视图：月历
- 时间轴视图

---

#### SCHEDULE-003: 更新日程事件
**需求描述**: 修改日程信息

---

#### SCHEDULE-004: 删除日程事件
**需求描述**: 删除单个或系列事件

**功能要点**:
- 删除单个事件
- 删除整个系列（重复事件）

---

#### SCHEDULE-005: 重复事件管理
**需求描述**: 管理重复日程

**功能要点**:
- 每日重复
- 每周重复（指定星期几）
- 每月重复（指定日期）
- 自定义重复规则（RRULE）

---

### 5.2 高级功能特性

#### SCHEDULE-101: 冲突检测 (P0)
**功能编号**: SCHEDULE-001  
**优先级**: P0  
**文档**: [docs/modules/schedule/features/01-conflict-detection.md](./modules/schedule/features/01-conflict-detection.md)

**需求描述**: 自动检测日程冲突

---

#### SCHEDULE-102: 日历同步 (P1)
**功能编号**: SCHEDULE-003  
**优先级**: P1  
**文档**: [docs/modules/schedule/features/03-calendar-sync.md](./modules/schedule/features/03-calendar-sync.md)

**需求描述**: 同步 Google Calendar / Outlook

---

#### SCHEDULE-103: 周视图 (P0)
**功能编号**: SCHEDULE-004  
**优先级**: P0  
**文档**: [docs/modules/schedule/features/04-week-view.md](./modules/schedule/features/04-week-view.md)

**需求描述**: 周视图日历展示

---

#### SCHEDULE-104: 时间热力图 (P2)
**功能编号**: SCHEDULE-005  
**优先级**: P2  
**文档**: [docs/modules/schedule/features/05-time-heatmap.md](./modules/schedule/features/05-time-heatmap.md)

**需求描述**: 可视化时间分配热力图

---

#### SCHEDULE-105: 搜索过滤 (P1)
**功能编号**: SCHEDULE-006  
**优先级**: P1  
**文档**: [docs/modules/schedule/features/06-search-filter.md](./modules/schedule/features/06-search-filter.md)

**需求描述**: 高级搜索和过滤日程

---

## 6. Reminder (提醒模块)

### 6.1 基础 CRUD 功能

#### REMINDER-001: 创建提醒
**需求描述**: 创建提醒事项

**功能要点**:
- 提醒标题、内容
- 提醒时间（精确到分钟）
- 提醒频率（一次性/重复）
- 提醒渠道（推送/邮件/站内）
- 关联对象（目标/任务/日程）

---

#### REMINDER-002: 查看提醒列表
**需求描述**: 查看所有提醒

**功能要点**:
- 筛选：状态（待触发/已触发/已关闭）
- 排序：时间
- 搜索

---

#### REMINDER-003: 更新提醒
**需求描述**: 修改提醒设置

---

#### REMINDER-004: 删除提醒
**需求描述**: 删除提醒

---

#### REMINDER-005: 提醒触发
**需求描述**: 系统自动触发提醒

**功能要点**:
- 定时任务扫描
- 多渠道推送
- 触发日志记录
- 重试机制

---

### 6.2 高级功能特性

#### REMINDER-101: 智能提醒频率 (P0)
**功能编号**: REMINDER-001  
**优先级**: P0  
**文档**: [docs/modules/reminder/features/01-smart-frequency.md](./modules/reminder/features/01-smart-frequency.md)

**需求描述**: 智能调整提醒频率

---

#### REMINDER-102: 提醒历史追踪 (P1)
**功能编号**: REMINDER-003  
**优先级**: P1  
**文档**: [docs/modules/reminder/features/03-history-tracking.md](./modules/reminder/features/03-history-tracking.md)

**需求描述**: 记录提醒触发历史

---

#### REMINDER-103: 提醒模板 (P2)
**功能编号**: REMINDER-004  
**优先级**: P2  
**文档**: [docs/modules/reminder/features/04-reminder-templates.md](./modules/reminder/features/04-reminder-templates.md)

**需求描述**: 常用提醒模板库

---

#### REMINDER-104: 地理位置提醒 (P3)
**功能编号**: REMINDER-005  
**优先级**: P3  
**文档**: [docs/modules/reminder/features/05-location-reminder.md](./modules/reminder/features/05-location-reminder.md)

**需求描述**: 基于地理位置触发提醒

---

## 7. Notification (通知模块)

### 7.1 基础 CRUD 功能

#### NOTIFICATION-001: 创建通知
**需求描述**: 系统创建通知

**功能要点**:
- 通知类型：系统/任务/目标/提醒
- 通知优先级：LOW / NORMAL / HIGH / URGENT
- 通知内容（支持变量）
- 接收人
- 推送渠道

---

#### NOTIFICATION-002: 查看通知列表
**需求描述**: 用户查看通知

**功能要点**:
- 未读/已读筛选
- 按类型筛选
- 按优先级筛选
- 分页加载

---

#### NOTIFICATION-003: 标记已读
**需求描述**: 标记通知为已读

**功能要点**:
- 单个标记已读
- 全部标记已读

---

#### NOTIFICATION-004: 删除通知
**需求描述**: 删除通知

---

### 7.2 高级功能特性

#### NOTIFICATION-101: 多渠道通知聚合 (P0)
**功能编号**: NOTIFICATION-001  
**优先级**: P0  
**文档**: [docs/modules/notification/features/01-multi-channel-aggregation.md](./modules/notification/features/01-multi-channel-aggregation.md)

**需求描述**: 统一管理多渠道通知

---

#### NOTIFICATION-102: 通知优先级分类 (P1)
**功能编号**: NOTIFICATION-002  
**优先级**: P1  
**文档**: [docs/modules/notification/features/02-priority-classification.md](./modules/notification/features/02-priority-classification.md)

**需求描述**: 智能分类通知优先级

---

#### NOTIFICATION-103: 通知摘要 (P2)
**功能编号**: NOTIFICATION-003  
**优先级**: P2  
**文档**: [docs/modules/notification/features/03-notification-digest.md](./modules/notification/features/03-notification-digest.md)

**需求描述**: 定期发送通知摘要

---

#### NOTIFICATION-104: 通知统计分析 (P3)
**功能编号**: NOTIFICATION-004  
**优先级**: P3  
**文档**: [docs/modules/notification/features/04-notification-stats.md](./modules/notification/features/04-notification-stats.md)

**需求描述**: 通知触达和响应统计

---

## 8. Repository (仓库模块)

### 8.1 基础 CRUD 功能

#### REPOSITORY-001: 创建文档
**需求描述**: 创建 Markdown 文档

**功能要点**:
- 文档标题
- Markdown 内容
- 文件夹归类
- 标签

---

#### REPOSITORY-002: 查看文档列表
**需求描述**: 浏览文档库

**功能要点**:
- 文件夹树形结构
- 搜索文档
- 筛选标签

---

#### REPOSITORY-003: 编辑文档
**需求描述**: 编辑 Markdown 文档

---

#### REPOSITORY-004: 删除文档
**需求描述**: 删除文档

---

#### REPOSITORY-005: 文档版本管理
**需求描述**: 记录文档修改历史

---

### 8.2 高级功能特性

#### REPOSITORY-101: 链接推荐 (P1)
**功能编号**: REPOSITORY-001  
**优先级**: P1  
**文档**: [docs/modules/repository/features/01-link-recommendation.md](./modules/repository/features/01-link-recommendation.md)

**需求描述**: 智能推荐相关文档链接

---

#### REPOSITORY-102: 版本管理 (P0)
**功能编号**: REPOSITORY-002  
**优先级**: P0  
**文档**: [docs/modules/repository/features/02-version-management.md](./modules/repository/features/02-version-management.md)

**需求描述**: Git 式版本管理

---

#### REPOSITORY-103: 全文搜索 (P1)
**功能编号**: REPOSITORY-003  
**优先级**: P1  
**文档**: [docs/modules/repository/features/03-full-text-search.md](./modules/repository/features/03-full-text-search.md)

**需求描述**: 全文搜索文档内容

---

## 9. Editor (编辑器模块)

### 9.1 基础 CRUD 功能

#### EDITOR-001: 创建编辑会话
**需求描述**: 打开文档进入编辑模式

---

#### EDITOR-002: 保存文档
**需求描述**: 保存编辑内容

**功能要点**:
- 自动保存（30 秒）
- 手动保存
- 保存冲突检测

---

#### EDITOR-003: Markdown 渲染
**需求描述**: 实时预览 Markdown

---

#### EDITOR-004: 编辑器工作空间
**需求描述**: 管理多个编辑会话

---

### 9.2 高级功能特性

#### EDITOR-101: 双向链接 (P0)
**功能编号**: EDITOR-001  
**优先级**: P0  
**文档**: [docs/modules/editor/features/01-bidirectional-links.md](./modules/editor/features/01-bidirectional-links.md)

**需求描述**: 文档间双向链接

---

#### EDITOR-102: Markdown 编辑器增强 (P0)
**功能编号**: EDITOR-002  
**优先级**: P0  
**文档**: [docs/modules/editor/features/02-markdown-editor.md](./modules/editor/features/02-markdown-editor.md)

**需求描述**: 富文本编辑体验

---

#### EDITOR-103: 协作编辑 (P2)
**功能编号**: EDITOR-003  
**优先级**: P2  
**文档**: [docs/modules/editor/features/03-collaborative-editing.md](./modules/editor/features/03-collaborative-editing.md)

**需求描述**: 实时协作编辑

---

## 10. Setting (设置模块)

### 10.1 基础 CRUD 功能

#### SETTING-001: 查看设置
**需求描述**: 查看用户设置

---

#### SETTING-002: 更新设置
**需求描述**: 修改设置项

**功能要点**:
- 主题设置
- 语言设置
- 通知偏好
- 快捷键设置

---

#### SETTING-003: 重置设置
**需求描述**: 恢复默认设置

---

#### SETTING-004: 设置同步
**需求描述**: 跨设备同步设置

---

### 10.2 高级功能特性

#### SETTING-101: 用户偏好设置 (P0)
**功能编号**: SETTING-001  
**优先级**: P0  
**文档**: [docs/modules/setting/features/01-user-preferences.md](./modules/setting/features/01-user-preferences.md)

**需求描述**: 自定义界面和行为偏好

---

#### SETTING-102: 数据导入导出 (P1)
**功能编号**: SETTING-002  
**优先级**: P1  
**文档**: [docs/modules/setting/features/02-import-export.md](./modules/setting/features/02-import-export.md)

**需求描述**: 导入导出用户数据

---

## 📈 功能优先级矩阵

### P0 功能（MVP 核心）- 必须实现

| 模块 | 功能 | RICE | 预估时间 |
|------|------|------|----------|
| Goal | KR 权重快照 | 672 | 1 周 |
| Goal | 目标进度自动计算 | 480 | 1 周 |
| Goal | 专注周期聚焦模式 | 432 | 1.5 周 |
| Task | 任务依赖图 | - | 1 周 |
| Task | 任务优先级矩阵 | - | 1 周 |
| Task | 任务依赖关系 | - | 1 周 |
| Schedule | 冲突检测 | - | 1 周 |
| Schedule | 周视图 | - | 0.5 周 |
| Reminder | 智能提醒频率 | - | 1 周 |
| Notification | 多渠道通知聚合 | - | 1 周 |
| Repository | 版本管理 | - | 1.5 周 |
| Editor | 双向链接 | - | 2 周 |
| Editor | Markdown 编辑器增强 | - | 1 周 |
| Setting | 用户偏好设置 | - | 0.5 周 |

**P0 小计**: 14 个功能，预计 **14 周**

---

### P1 功能（MMP 增强）- 应该实现

| 模块 | 功能 | RICE | 预估时间 |
|------|------|------|----------|
| Goal | 目标复盘 | 336 | 1 周 |
| Goal | 目标任务关联 | 224 | 1 周 |
| Task | 任务时间块 | - | 1 周 |
| Task | 进度快照 | - | 0.5 周 |
| Schedule | 日历同步 | - | 2 周 |
| Schedule | 搜索过滤 | - | 0.5 周 |
| Reminder | 提醒历史追踪 | - | 0.5 周 |
| Notification | 通知优先级分类 | - | 1 周 |
| Repository | 链接推荐 | - | 1.5 周 |
| Repository | 全文搜索 | - | 1 周 |
| Setting | 数据导入导出 | - | 1 周 |
| Account | 用户偏好设置 | - | 0.5 周 |

**P1 小计**: 12 个功能，预计 **12 周**

---

### P2 功能（扩展特性）- 可以实现

| 模块 | 功能 | 预估时间 |
|------|------|----------|
| Goal | 目标模板库 | 1 周 |
| Task | 任务标签系统 | 0.5 周 |
| Schedule | 时间热力图 | 1 周 |
| Reminder | 提醒模板 | 0.5 周 |
| Notification | 通知摘要 | 1 周 |
| Editor | 协作编辑 | 3 周 |
| Account | 数据导入导出 | 1 周 |
| Authentication | 双因素认证 | 1 周 |
| Authentication | 登录审计日志 | 0.5 周 |

**P2 小计**: 9 个功能，预计 **9.5 周**

---

### P3 功能（创新特性）- 未来实现

| 模块 | 功能 | 预估时间 |
|------|------|----------|
| Goal | 目标依赖关系 | 1.5 周 |
| Goal | 目标健康度评分 | 2 周 |
| Task | 任务模板 | 0.5 周 |
| Reminder | 地理位置提醒 | 2 周 |
| Notification | 通知统计分析 | 1 周 |
| Authentication | OAuth 第三方登录 | 2 周 |

**P3 小计**: 6 个功能，预计 **9 周**

---

## 🚀 开发路线图

### Phase 1: MVP (8-10 周)

**目标**: 完成基础 CRUD + 核心高级功能

**里程碑**:
- Week 1-2: Account + Authentication 模块（CRUD + 基础认证）
- Week 3-4: Goal 模块（CRUD + KR 权重快照 + 进度自动计算）
- Week 5-6: Task 模块（CRUD + 依赖图 + 优先级矩阵）
- Week 7: Schedule + Reminder 模块（CRUD + 冲突检测 + 智能提醒）
- Week 8: Notification + Repository 模块（CRUD + 多渠道聚合 + 版本管理）
- Week 9: Editor + Setting 模块（CRUD + 双向链接 + 用户偏好）
- Week 10: 集成测试 + Bug 修复

**交付物**:
- ✅ 48 个基础 CRUD 功能
- ✅ 14 个 P0 高级功能
- ✅ 60 个功能可用
- ✅ 覆盖 80% 核心用户需求

---

### Phase 2: MMP (6-8 周)

**目标**: 增强功能体验，完善生态

**里程碑**:
- Week 11-12: Goal 模块增强（复盘 + 任务关联）
- Week 13-14: Task + Schedule 增强（时间块 + 日历同步）
- Week 15-16: Notification + Repository 增强（优先级分类 + 全文搜索）
- Week 17: Setting + Account 增强（数据导入导出）
- Week 18: 性能优化 + 用户反馈迭代

**交付物**:
- ✅ 12 个 P1 功能
- ✅ 总计 72 个功能
- ✅ 覆盖 95% 用户需求

---

### Phase 3: Future (持续迭代)

**目标**: 创新特性，AI 增强

**功能方向**:
- P2/P3 扩展功能
- AI 智能推荐
- 社交分享功能
- 移动端适配
- 第三方集成（GitHub, Notion, etc.）

---

## 📊 技术实现要点

### API 设计原则

1. **RESTful 风格**: 标准 HTTP 方法（GET/POST/PUT/DELETE）
2. **统一响应格式**: 
   ```typescript
   { success: boolean; data: T; error?: ErrorDto; }
   ```
3. **分页规范**: `page`, `pageSize`, `total`, `totalPages`
4. **错误码规范**: 业务错误码 + HTTP 状态码
5. **版本控制**: `/api/v1/...`

---

### 数据库设计原则

1. **规范化设计**: 避免数据冗余
2. **软删除**: 使用 `deletedAt` 字段
3. **审计字段**: `createdAt`, `updatedAt`
4. **UUID 主键**: 避免 ID 可预测
5. **索引优化**: 高频查询字段建索引

---

### 前端实现原则

1. **组件化**: 可复用组件库（@dailyuse/ui）
2. **状态管理**: Pinia Stores
3. **类型安全**: 全栈 TypeScript
4. **响应式设计**: 移动端适配
5. **性能优化**: 懒加载、虚拟滚动

---

## 📝 附录

### 术语表

| 术语 | 英文 | 说明 |
|------|------|------|
| OKR | Objectives and Key Results | 目标与关键结果 |
| KR | Key Result | 关键结果 |
| CRUD | Create/Read/Update/Delete | 增删改查 |
| DTO | Data Transfer Object | 数据传输对象 |
| DDD | Domain-Driven Design | 领域驱动设计 |
| RICE | Reach/Impact/Confidence/Effort | 功能优先级评分模型 |
| MVP | Minimum Viable Product | 最小可行产品 |
| MMP | Minimum Marketable Product | 最小可售产品 |
| GTD | Getting Things Done | 尽管去做 |

---

### 相关文档

- [项目概览](./project-overview.md)
- [Web 应用架构](./architecture-web.md)
- [API 应用架构](./architecture-api.md)
- [包文档索引](./packages-index.md)
- [模块功能详细文档](./modules/)

---

**文档维护**: BMAD v6 Analyst (Mary)  
**最后更新**: 2025-10-28 17:30:00  
**审核状态**: ✅ 已审核
