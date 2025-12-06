# EPIC-002: Desktop Application Development

## 📋 Epic 概述

**Epic ID**: EPIC-002  
**Epic Name**: Desktop Application Complete Development  
**Epic Owner**: Development Team  
**Created**: 2025-12-06  
**Priority**: High  
**Status**: 🟡 Planning  

---

## 🎯 产品愿景

> **打造一个真正融入日常工作流的桌面应用 —— 开机即启动，随时待命，成为用户效率提升的核心工具。**

### 为什么是桌面应用？（浏览器做不到）

| 能力 | 桌面端 | Web 端 |
|------|--------|--------|
| 开机自启 | ✅ 静默后台运行 | ❌ 需手动打开 |
| 系统托盘 | ✅ 随时快速访问 | ❌ 无法实现 |
| 全局快捷键 | ✅ 任何应用中唤起 | ❌ 仅页面内有效 |
| 原生通知 | ✅ 系统级通知 | ⚠️ 需权限且不可靠 |
| 离线工作 | ✅ SQLite 本地优先 | ⚠️ 依赖 Service Worker |
| 快速启动器 | ✅ Spotlight 式体验 | ❌ 无法实现 |

### 产品定位

```
Desktop 应用 = 主力工具（深度融入工作流）
Web 应用 = 临时/补充场景（任意设备快速访问）
```

---

## 📋 MVP 定义

### MVP 范围：全部功能完整实现

**原则**：不赶 deadline，追求完美复用，质量优先

| 类别 | 包含 Story | 说明 |
|------|-----------|------|
| **基础架构** | Story 1-3 | DI 集成、IPC 通信 |
| **核心模块** | Story 4-7 | Goal、Task、Schedule、Reminder、Auth |
| **增强功能** | Story 6、9 | Dashboard、Repository、Setting |
| **桌面特性** | Story 10 | 托盘、快捷键、自启、快速启动器 |
| **高级功能** | Story 8、11 | AI 集成、离线同步 |
| **质量保障** | Story 12 | 测试、打包 |

### MVP 验收标准

1. ✅ **功能对等**：与 Web 端 100% 功能一致
2. ✅ **桌面优势**：6 项桌面特有功能全部实现
3. ✅ **代码复用**：85%+ 代码来自共享包
4. ✅ **跨平台**：Windows/macOS/Linux 全部可用
5. ✅ **质量达标**：70%+ 测试覆盖，无 P0/P1 Bug

---

## 🏆 业务优先级矩阵

### P0 - 阻塞性（必须先完成）

| Story | 名称 | 为什么是 P0 |
|-------|------|------------|
| Story 1 | 主进程 DI 初始化 | 所有功能的基础 |
| Story 2 | 渲染进程 DI 集成 | 所有 UI 的基础 |
| Story 3 | Preload API 暴露 | IPC 通信的桥梁 |

### P1 - 核心价值（定义产品）

| Story | 名称 | 用户价值 |
|-------|------|---------|
| Story 4 | Goal & Task | 目标管理核心功能 |
| Story 5 | Schedule & Reminder | 时间管理核心功能 |
| Story 7 | 认证与账户 | 用户身份基础 |
| Story 10 | **桌面特有功能** ⭐ | **差异化竞争力** |
| Story 12 | 测试 & 打包 | 质量保障 |

### P2 - 增强体验（锦上添花）

| Story | 名称 | 用户价值 |
|-------|------|---------|
| Story 6 | Dashboard | 数据概览 |
| Story 9 | Repository & Setting | 配置管理 |
| Story 8 | AI 集成 | 智能辅助 |

### P3 - 未来演进

| Story | 名称 | 用户价值 |
|-------|------|---------|
| Story 11 | 离线同步 | 多设备协同 |

---

## 🎨 用户体验愿景

### 典型用户场景

**场景 1：开始一天的工作**
```
1. 电脑开机 → DailyUse 自动启动（后台静默）
2. 系统托盘显示今日待办数量
3. 原生通知弹出：「早上好！今天有 5 个任务待处理」
```

**场景 2：快速记录想法**
```
1. 正在写代码/看文档...
2. 按下全局快捷键 Ctrl+Shift+Space
3. 快速启动器弹出
4. 输入「新任务 完成产品文档」→ Enter
5. 任务创建成功，继续之前的工作
```

**场景 3：收到提醒**
```
1. 正在其他应用工作
2. 原生通知弹出：「会议提醒：15分钟后产品评审」
3. 点击通知 → 直接跳转到日程详情
```

**场景 4：离线工作**
```
1. 在飞机/地铁上（无网络）
2. 打开 DailyUse → 所有数据正常可用
3. 创建任务、修改目标 → 本地保存
4. 恢复网络后 → 自动同步到服务器
```

---

### 业务目标
将 DailyUse 打造成一个功能完整的跨平台桌面应用，利用已提取的 6 个共享包，实现与 Web 端功能一致的用户体验，同时充分发挥桌面端的原生能力。

### 技术目标
- 复用 `@dailyuse/domain-client`、`@dailyuse/application-client`、`@dailyuse/infrastructure-client` 包
- 利用 IPC 适配器架构实现 Electron 主进程/渲染进程通信
- 充分利用桌面端原生能力（系统通知、快捷键、托盘等）

---

## 🏗️ 现有基础设施分析

### 已完成的包提取（STORY-001 成果）

| 包名 | 功能 | Desktop 适用性 |
|------|------|---------------|
| `@dailyuse/domain-client` | 12 模块领域实体/值对象 | ✅ 直接复用 |
| `@dailyuse/domain-server` | 12 模块服务端领域层 | ✅ 主进程复用 |
| `@dailyuse/application-client` | 225 个客户端服务 | ✅ 渲染进程复用 |
| `@dailyuse/application-server` | 93 个服务端服务 | ✅ 主进程复用 |
| `@dailyuse/infrastructure-client` | 12 Container + 20 Ports + 40 Adapters | ✅ 核心依赖 |
| `@dailyuse/infrastructure-server` | 11 Container | ✅ 主进程复用 |

### IPC 适配器覆盖（已就绪）

```
infrastructure-client/
├── goal/          ✅ GoalIpcAdapter, GoalFolderIpcAdapter
├── task/          ✅ TaskTemplateIpcAdapter, TaskInstanceIpcAdapter, TaskDependencyIpcAdapter, TaskStatisticsIpcAdapter
├── schedule/      ✅ ScheduleTaskIpcAdapter, ScheduleEventIpcAdapter
├── reminder/      ✅ ReminderIpcAdapter
├── account/       ✅ AccountIpcAdapter
├── authentication/ ✅ AuthIpcAdapter
├── notification/  ✅ NotificationIpcAdapter
├── ai/            ✅ AIConversationIpcAdapter, AIMessageIpcAdapter, AIGenerationTaskIpcAdapter, AIUsageQuotaIpcAdapter, AIProviderConfigIpcAdapter
├── dashboard/     ✅ DashboardIpcAdapter
├── repository/    ✅ RepositoryIpcAdapter
└── setting/       ✅ SettingIpcAdapter
```

### Composition Root（已就绪）

```typescript
// packages/infrastructure-client/src/di/composition-roots/desktop.composition-root.ts
export function configureDesktopDependencies(electronApi: ElectronAPI): void {
  // 已实现所有 11 个模块的 DI 配置
}
```

### 现有 Desktop 代码结构

```
apps/desktop/src/
├── main/                    # 主进程 (56 目录, 112 文件)
│   ├── windows/             # 窗口管理
│   │   ├── windowManager.ts ✅
│   │   ├── mainWindow.ts    ✅
│   │   └── loginWindow.ts   ✅
│   └── shared/
│       ├── ipc/             # IPC 处理器 (filesystem, git, repository, window-control)
│       ├── database/        # SQLite 数据库
│       ├── notification/    # 原生通知
│       └── schedule/        # 调度服务
├── renderer/                # 渲染进程
│   ├── views/               # AuthView, AboutView
│   ├── shared/              # 工具、服务、路由
│   └── plugins/             # quickLauncher
├── preload/                 # Preload 脚本
└── plugins/                 # 插件系统
    ├── core/                # PluginManager
    └── quickLauncher/       # 快速启动器插件
```

---

## 📊 Story 分解

### Story 1: 主进程 DI 初始化重构
**预估**: 3-5 天 | **优先级**: P0 (阻塞其他 Story)

#### 目标
将现有主进程的手动依赖管理迁移到使用 `@dailyuse/infrastructure-server` Container 模式。

#### Tasks
- [ ] **Task 1.1**: 创建主进程 Composition Root
  - 创建 `apps/desktop/src/main/di/desktop-main.composition-root.ts`
  - 使用 `@dailyuse/infrastructure-server` 的 Container 类
  - 配置 SQLite 仓库适配器
  
- [ ] **Task 1.2**: 重构 `appInitializer.ts`
  - 替换手动模块初始化为 Container 依赖注入
  - 整合 11 个模块的初始化流程
  
- [ ] **Task 1.3**: 创建 SQLite Repository 适配器
  - 基于现有 `repositoryFactory.ts` 重构
  - 实现 `domain-server` 定义的 Repository 接口
  - 模块: Account, Auth, Task, Goal, Reminder, Schedule

#### 验收标准
- 主进程使用 Container 获取所有服务
- 无硬编码依赖

---

### Story 2: 渲染进程 DI 初始化集成
**预估**: 2-3 天 | **优先级**: P0

#### 目标
在渲染进程中正确调用 `configureDesktopDependencies`，集成 IPC 适配器。

#### Tasks
- [ ] **Task 2.1**: 创建 ElectronAPI 类型定义
  - 定义 `preload.ts` 暴露的 API 接口
  - 匹配 `infrastructure-client` 的 `ElectronAPI` 类型

- [ ] **Task 2.2**: 更新渲染进程入口
  - 在 `renderer/main.ts` 中调用 `configureDesktopDependencies`
  - 确保在 Vue app 挂载前完成 DI 配置

- [ ] **Task 2.3**: 重构现有服务调用
  - 将现有直接 IPC 调用迁移到 Container 服务调用
  - 验证所有模块的 IPC 通信

#### 验收标准
- 渲染进程通过 Container 获取所有服务
- IPC 通信正常工作

---

### Story 3: Preload 脚本 API 暴露
**预估**: 2 天 | **优先级**: P0

#### 目标
确保 preload 脚本暴露完整的 IPC API，与 IPC 适配器期望的接口匹配。

#### Tasks
- [ ] **Task 3.1**: 审计 IPC 适配器需求
  - 收集所有 IpcAdapter 调用的 IPC 方法
  - 创建完整的 IPC 通道列表

- [ ] **Task 3.2**: 扩展 preload.ts
  - 实现所有模块的 IPC 方法暴露
  - 确保类型安全

- [ ] **Task 3.3**: 主进程 IPC Handler 注册
  - 为每个 IPC 通道注册处理器
  - 连接到 Container 服务

#### 验收标准
- 完整的 IPC API 覆盖
- 类型安全的跨进程通信

---

### Story 4: 核心模块 UI 迁移 - Goal & Task
**预估**: 5-7 天 | **优先级**: P1

#### 目标
实现 Goal 和 Task 模块的完整 UI，复用 `@dailyuse/ui-vuetify` 组件。

#### Tasks
- [ ] **Task 4.1**: Goal 模块视图
  - GoalListView, GoalDetailView, GoalFormView
  - 目标树形结构展示
  - 进度追踪可视化

- [ ] **Task 4.2**: Task 模块视图
  - TaskListView, TaskDetailView, TaskFormView
  - 任务依赖关系可视化
  - 任务统计图表 (ECharts)

- [ ] **Task 4.3**: Goal-Task 关联
  - 目标下的任务列表
  - 任务完成对目标进度的影响

- [ ] **Task 4.4**: 拖拽排序支持
  - 使用 vuedraggable 实现拖拽
  - 更新排序顺序

#### 验收标准
- CRUD 操作正常
- 与 Web 端功能一致

---

### Story 5: 核心模块 UI 迁移 - Schedule & Reminder
**预估**: 5-7 天 | **优先级**: P1

#### Tasks
- [ ] **Task 5.1**: Schedule 模块视图
  - 日历视图 (日/周/月)
  - 时间线视图
  - 事件创建/编辑

- [ ] **Task 5.2**: Reminder 模块视图
  - 提醒列表
  - 提醒模板管理
  - 提醒触发设置

- [ ] **Task 5.3**: 原生通知集成
  - 系统托盘通知
  - 通知点击处理
  - 通知声音配置

#### 验收标准
- 日程/提醒创建正常
- 原生通知工作正常

---

### Story 6: Dashboard 模块实现
**预估**: 3-5 天 | **优先级**: P1

#### Tasks
- [ ] **Task 6.1**: Dashboard 主视图
  - 统计卡片布局
  - 快速操作入口

- [ ] **Task 6.2**: 统计图表
  - 任务完成趋势
  - 目标进度概览
  - 时间分配分析

- [ ] **Task 6.3**: 数据刷新机制
  - 定时刷新
  - 手动刷新
  - 缓存策略

---

### Story 7: 认证与账户模块
**预估**: 3-4 天 | **优先级**: P1

#### Tasks
- [ ] **Task 7.1**: 登录/注册流程
  - 本地认证
  - Token 存储 (secure storage)

- [ ] **Task 7.2**: 账户管理
  - 个人资料编辑
  - 密码修改
  - 头像上传

- [ ] **Task 7.3**: 会话管理
  - 自动登录
  - 会话过期处理

---

### Story 8: AI 模块集成
**预估**: 4-5 天 | **优先级**: P2

#### Tasks
- [ ] **Task 8.1**: AI 对话界面
  - 对话列表
  - 消息历史
  - 流式响应展示

- [ ] **Task 8.2**: AI 辅助功能
  - 任务建议
  - 目标分解
  - 智能提醒

- [ ] **Task 8.3**: 配额管理
  - 使用量显示
  - 配额预警

---

### Story 9: Repository & Setting 模块
**预估**: 3-4 天 | **优先级**: P2

#### Tasks
- [ ] **Task 9.1**: 仓库管理
  - 仓库列表
  - 文件夹结构
  - Git 集成增强

- [ ] **Task 9.2**: 设置界面
  - 系统设置
  - 外观设置
  - 数据管理

---

### Story 10: 桌面端特有功能
**预估**: 5-7 天 | **优先级**: P2

#### Tasks
- [ ] **Task 10.1**: 系统托盘
  - 托盘图标
  - 托盘菜单
  - 快捷操作

- [ ] **Task 10.2**: 全局快捷键
  - 快速创建任务
  - 快速记录
  - 窗口切换

- [ ] **Task 10.3**: 快速启动器
  - 增强现有 QuickLauncher 插件
  - 命令面板功能

- [ ] **Task 10.4**: 开机自启
  - 自启动配置
  - 最小化到托盘

- [ ] **Task 10.5**: 自动更新
  - 更新检查
  - 增量更新
  - 更新通知

---

### Story 11: 离线支持 & 同步
**预估**: 5-7 天 | **优先级**: P3

#### Tasks
- [ ] **Task 11.1**: 离线数据持久化
  - SQLite 完整同步
  - 冲突解决策略

- [ ] **Task 11.2**: 在线同步
  - 增量同步
  - 同步状态指示

---

### Story 12: 测试 & 质量保障
**预估**: 5-7 天 | **优先级**: P1 (贯穿整个开发周期)

#### Tasks
- [ ] **Task 12.1**: 单元测试
  - 主进程服务测试
  - 渲染进程组件测试

- [ ] **Task 12.2**: E2E 测试
  - Playwright + Electron 测试
  - 关键流程覆盖

- [ ] **Task 12.3**: 打包测试
  - Windows 打包
  - macOS 打包
  - Linux 打包

---

## 📅 建议开发顺序

### Phase 1: 基础架构 (Week 1-2)
1. **Story 1**: 主进程 DI 初始化重构 ⭐
2. **Story 2**: 渲染进程 DI 初始化集成 ⭐
3. **Story 3**: Preload 脚本 API 暴露 ⭐

### Phase 2: 核心功能 (Week 3-5)
4. **Story 4**: Goal & Task 模块
5. **Story 5**: Schedule & Reminder 模块
6. **Story 7**: 认证与账户模块

### Phase 3: 增强功能 (Week 6-7)
7. **Story 6**: Dashboard 模块
8. **Story 9**: Repository & Setting 模块
9. **Story 10**: 桌面端特有功能

### Phase 4: 高级功能 (Week 8-9)
10. **Story 8**: AI 模块集成
11. **Story 11**: 离线支持 & 同步

### Phase 5: 质量保障 (持续)
12. **Story 12**: 测试 & 打包 (贯穿所有阶段)

---

## 🎯 Success Metrics

| 指标 | 目标 | 验收方式 |
|------|------|---------|
| 功能完整度 | 与 Web 端 100% 功能一致 | 功能对照清单 |
| 桌面特性 | 6 项全部实现 | 功能演示 |
| 包复用率 | 85%+ 代码来自共享包 | 代码统计 |
| 测试覆盖率 | 70%+ 单元测试覆盖 | Coverage Report |
| 打包成功率 | 3 平台 100% 打包成功 | CI/CD 验证 |
| 首屏加载时间 | < 2s | 性能测试 |
| 冷启动时间 | < 3s | 性能测试 |
| 内存占用 | < 300MB | 资源监控 |

### 桌面特有功能验收清单

| 功能 | 验收标准 |
|------|---------|
| 开机自启 | 设置开启后，重启电脑自动运行 |
| 系统托盘 | 显示图标，右键菜单，左键唤起窗口 |
| 全局快捷键 | Ctrl+Shift+Space 任何应用中可唤起 |
| 原生通知 | 提醒准时弹出，点击可跳转 |
| 快速启动器 | 支持模糊搜索、快速创建 |
| 最小化到托盘 | 关闭窗口不退出，托盘常驻 |

---

## 📚 Story 文档索引

### P0 - 基础架构 Stories

| Story ID | 文档 | 预估 | 状态 |
|----------|------|------|------|
| STORY-002 | [主进程 DI 初始化](./stories/STORY-002-main-process-di-initialization.md) | 3-5 天 | 🔵 Ready |
| STORY-003 | [渲染进程 DI 集成](./stories/STORY-003-renderer-process-di-integration.md) | 2-3 天 | 🔵 Ready |
| STORY-004 | [Preload API 暴露](./stories/STORY-004-preload-script-api-exposure.md) | 2 天 | 🔵 Ready |

### P1 - 核心功能 Stories

| Story ID | 文档 | 预估 | 状态 |
|----------|------|------|------|
| STORY-005 | [Goal & Task UI](./stories/STORY-005-goal-task-ui.md) | 4-5 天 | 🔵 Ready |
| STORY-006 | [Schedule & Reminder UI](./stories/STORY-006-schedule-reminder-ui.md) | 4-5 天 | 🔵 Ready |
| STORY-008 | [Auth & Account UI](./stories/STORY-008-auth-account-ui.md) | 3-4 天 | 🔵 Ready |
| STORY-012 | [桌面原生功能](./stories/STORY-012-desktop-native-features.md) | 3-4 天 | 🔵 Ready |

### P2 - 增强体验 Stories

| Story ID | 文档 | 预估 | 状态 |
|----------|------|------|------|
| STORY-007 | [Dashboard UI](./stories/STORY-007-dashboard-ui.md) | 2-3 天 | 🔵 Ready |
| STORY-009 | [AI Module UI](./stories/STORY-009-ai-module-ui.md) | 4-5 天 | 🔵 Ready |
| STORY-010 | [Notification Module](./stories/STORY-010-notification-module.md) | 2-3 天 | 🔵 Ready |
| STORY-011 | [Repository Module UI](./stories/STORY-011-repository-module-ui.md) | 2-3 天 | 🔵 Ready |

### 架构决策记录 (ADR)

| ADR ID | 文档 | 决策 |
|--------|------|------|
| ADR-006 | [Desktop IPC 通信](../architecture/adr/ADR-006-desktop-ipc-communication.md) | invoke/handle 模式 |
| ADR-007 | [Main Process SQLite](../architecture/adr/ADR-007-main-process-sqlite-access.md) | better-sqlite3 直接访问 |

---

## 🔗 Dependencies

### 外部依赖
- Electron 30.x
- Vue 3.4.x
- Vuetify 3.7.x
- better-sqlite3
- electron-builder

### 内部依赖
- ✅ `@dailyuse/domain-client`
- ✅ `@dailyuse/domain-server`
- ✅ `@dailyuse/application-client`
- ✅ `@dailyuse/application-server`
- ✅ `@dailyuse/infrastructure-client`
- ✅ `@dailyuse/infrastructure-server`
- ✅ `@dailyuse/contracts`
- ✅ `@dailyuse/utils`
- ✅ `@dailyuse/ui-vuetify`

---

## 📝 Notes

### 技术决策
1. **渲染进程使用 Vue + Vuetify**：与 Web 端保持一致，最大化组件复用
2. **主进程使用 SQLite**：离线优先，已有 better-sqlite3 基础设施
3. **IPC 适配器模式**：透明切换 HTTP/IPC，无需修改业务代码
4. **插件系统保留**：QuickLauncher 等插件继续使用现有架构

### 风险评估
1. **IPC 性能**：大量数据传输可能需要分页/流式处理
2. **SQLite 并发**：主进程单线程限制，需要考虑 Worker
3. **打包体积**：Electron 打包体积较大，需要优化

---

**文档版本**: v1.2  
**最后更新**: 2025-12-06  
**更新说明**: 添加 Story 文档索引 (STORY-002 至 STORY-012)，关联 ADR-006 和 ADR-007
