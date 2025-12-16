# DailyUse 源码树分析

> **生成时间**: 2025-12-16  
> **扫描级别**: Exhaustive  
> **项目版本**: 0.1.10

---

## 📋 项目概述

**DailyUse** 是一个智能个人效率管理平台，采用 **Nx Monorepo** 架构，包含 3 个独立应用和 16 个共享包。

### 技术栈摘要

| 层次 | Web 应用 | Desktop 应用 | API 服务 |
|------|----------|--------------|----------|
| **框架** | Vue 3.4.21 | Electron 39 + React 19 | Express 5.2 |
| **UI** | Vuetify 3.11 | shadcn/ui + TailwindCSS | - |
| **状态** | Pinia 3.0 | Zustand 5.0 | - |
| **数据库** | - (远程 API) | SQLite (better-sqlite3) | PostgreSQL + Prisma |
| **构建** | Vite 7.1 | Vite + electron-builder | tsup |

---

## 🗂️ 目录结构

```
DailyUse/
├── 📁 apps/                          # 应用程序 (3个)
│   ├── 📁 api/                       # Node.js 后端 API
│   ├── 📁 web/                       # Vue 3 Web 应用
│   └── 📁 desktop/                   # Electron 桌面应用
├── 📁 packages/                      # 共享代码包 (16个)
│   ├── 📁 contracts/                 # TypeScript 类型契约
│   ├── 📁 domain-server/             # 服务端领域层
│   ├── 📁 domain-client/             # 客户端领域层
│   ├── 📁 application-server/        # 服务端应用层
│   ├── 📁 application-client/        # 客户端应用层
│   ├── 📁 infrastructure-server/     # 服务端基础设施
│   ├── 📁 infrastructure-client/     # 客户端基础设施
│   ├── 📁 ui-vue/                    # Vue 组件
│   ├── 📁 ui-vuetify/                # Vuetify 组件
│   ├── 📁 ui-react/                  # React Hooks
│   ├── 📁 ui-shadcn/                 # shadcn/ui 组件
│   ├── 📁 ui-core/                   # 框架无关 UI
│   ├── 📁 utils/                     # 工具函数
│   ├── 📁 assets/                    # 静态资源
│   ├── 📁 sync-client/               # 离线同步
│   └── 📁 test-utils/                # 测试工具
├── 📁 docs/                          # 项目文档
├── 📁 tools/                         # 构建工具
└── 📁 .bmad/                         # BMAD 方法论配置
```

---

## 📦 应用详情

### 1. API Backend (`apps/api`)

**技术**: Express 5 + Prisma 6 + PostgreSQL

```
apps/api/
├── prisma/
│   └── schema.prisma           # 数据库模式 (1620行, 50+模型)
├── src/
│   ├── index.ts                # 应用入口
│   ├── app.ts                  # Express 配置
│   ├── modules/                # 业务模块 (DDD 分层)
│   │   ├── account/           # 账户管理
│   │   ├── ai/                # AI 服务
│   │   ├── authentication/    # 认证授权
│   │   ├── dashboard/         # 仪表盘
│   │   ├── editor/            # 编辑器
│   │   ├── goal/              # OKR 目标
│   │   ├── metrics/           # 性能指标
│   │   ├── notification/      # 通知系统
│   │   ├── reminder/          # 智能提醒
│   │   ├── repository/        # 知识仓库
│   │   ├── schedule/          # 日程调度
│   │   ├── setting/           # 系统设置
│   │   ├── system/            # 系统功能
│   │   └── task/              # 任务管理
│   └── shared/                # 共享代码
│       ├── infrastructure/    # 基础设施
│       └── initialization/    # 初始化
├── package.json
└── tsup.config.ts
```

**模块结构** (以 `goal` 为例):
```
modules/goal/
├── application/               # 应用服务层
│   └── services/
├── infrastructure/            # 基础设施层
│   ├── cron/                 # 定时任务
│   └── repositories/         # 仓储实现
├── interface/                 # 接口层
│   └── http/                 # HTTP 路由
├── initialization/            # 模块初始化
└── tests/                     # 测试文件
```

### 2. Web Application (`apps/web`)

**技术**: Vue 3 + Vuetify 3 + Pinia

```
apps/web/
├── src/
│   ├── main.ts                # 应用入口
│   ├── App.vue                # 根组件
│   ├── modules/               # 业务模块
│   │   ├── account/          # 账户管理
│   │   ├── ai/               # AI 助手
│   │   ├── app/              # 应用布局
│   │   ├── authentication/   # 认证
│   │   ├── dashboard/        # 仪表盘
│   │   ├── editor/           # 编辑器
│   │   ├── goal/             # 目标管理
│   │   ├── notification/     # 通知
│   │   ├── reminder/         # 提醒
│   │   ├── repository/       # 知识库
│   │   ├── schedule/         # 日程
│   │   ├── setting/          # 设置
│   │   ├── task/             # 任务
│   │   └── theme/            # 主题
│   ├── shared/               # 共享代码
│   │   ├── api/              # API 客户端
│   │   ├── components/       # 通用组件
│   │   ├── i18n/             # 国际化
│   │   ├── router/           # 路由配置
│   │   └── vuetify/          # Vuetify 配置
│   ├── views/                # 顶层视图
│   └── config/               # 配置文件
├── e2e/                       # E2E 测试 (Playwright)
├── public/                    # 静态资源
├── package.json
└── vite.config.ts
```

**模块结构** (以 `goal` 为例):
```
modules/goal/
├── application/               # 应用服务
│   └── services/
├── infrastructure/            # 基础设施
│   └── api/                  # API 客户端
├── initialization/            # 模块初始化
└── presentation/              # 表现层
    ├── components/           # Vue 组件
    ├── composables/          # 组合式函数
    ├── router/               # 路由配置
    ├── stores/               # Pinia Store
    ├── views/                # 页面视图
    └── widgets/              # Widget 组件
```

### 3. Desktop Application (`apps/desktop`)

**技术**: Electron 39 + React 19 + Zustand + SQLite

```
apps/desktop/
├── src/
│   ├── main/                  # 主进程 (Node.js)
│   │   ├── main.ts           # 入口点
│   │   ├── database/         # SQLite 数据库
│   │   ├── di/               # 依赖注入
│   │   ├── events/           # 事件监听
│   │   ├── ipc/              # IPC 处理器
│   │   ├── lifecycle/        # 生命周期
│   │   ├── modules/          # 业务模块 (21个)
│   │   ├── services/         # 应用服务
│   │   └── utils/            # 工具函数
│   ├── preload/              # 预加载脚本
│   │   └── index.ts          # contextBridge API
│   ├── renderer/             # 渲染进程 (React)
│   │   ├── main.tsx          # React 入口
│   │   ├── App.tsx           # 根组件
│   │   ├── modules/          # 业务模块 (17个)
│   │   ├── shared/           # 共享代码
│   │   ├── views/            # 页面视图
│   │   └── types/            # 类型定义
│   ├── shared/               # 主/渲染共享
│   └── types/                # 全局类型
├── electron-builder.json5     # 打包配置
├── package.json
└── vite.config.ts
```

**主进程模块**:
```
main/modules/
├── account/                   # 账户 IPC
├── ai/                        # AI IPC
├── authentication/            # 认证 IPC
├── auto-update/              # 自动更新
├── autolaunch/               # 开机启动
├── dashboard/                # 仪表盘 IPC
├── editor/                   # 编辑器 IPC
├── goal/                     # 目标 IPC
├── infrastructure/           # 基础设施
├── notification/             # 通知 IPC
├── reminder/                 # 提醒 IPC
├── repository/               # 仓库 IPC
├── schedule/                 # 日程 IPC
├── setting/                  # 设置 IPC
├── shortcuts/                # 快捷键
├── task/                     # 任务 IPC
├── tray/                     # 系统托盘
├── window/                   # 窗口管理
├── index.ts                  # 模块注册
└── ipc-registry.ts           # IPC 注册表
```

**渲染进程模块**:
```
renderer/modules/
├── account/                   # 账户
├── ai/                        # AI
├── auth/                      # 认证 (旧)
├── authentication/            # 认证
├── auto-update/              # 自动更新
├── dashboard/                # 仪表盘
├── editor/                   # 编辑器
├── focus/                    # 专注模式
├── goal/                     # 目标
├── initialization/           # 初始化
├── notification/             # 通知
├── reminder/                 # 提醒
├── repository/               # 仓库
├── schedule/                 # 日程
├── setting/                  # 设置
├── settings/                 # 设置 (旧)
├── task/                     # 任务
└── index.ts                  # 模块导出
```

---

## 📦 共享包详情

### 层次结构

```
Layer 0: 基础包 (无内部依赖)
├── @dailyuse/contracts        # 类型契约
├── @dailyuse/utils            # 工具函数
└── @dailyuse/assets           # 静态资源

Layer 1: 领域层
├── @dailyuse/domain-server    # 服务端领域
└── @dailyuse/domain-client    # 客户端领域

Layer 2: 应用层
├── @dailyuse/application-server
└── @dailyuse/application-client

Layer 3: 基础设施层
├── @dailyuse/infrastructure-server
└── @dailyuse/infrastructure-client

Layer 4: UI 层
├── @dailyuse/ui-core          # 框架无关
├── @dailyuse/ui-vue           # Vue 专用
├── @dailyuse/ui-vuetify       # Vuetify 专用
├── @dailyuse/ui-react         # React 专用
└── @dailyuse/ui-shadcn        # shadcn/ui 专用

辅助包
├── @dailyuse/sync-client      # 离线同步
└── @dailyuse/test-utils       # 测试工具
```

### 包使用规则

| 运行环境 | 可用包 | 禁用包 |
|----------|--------|--------|
| **Web Frontend** | contracts, utils, domain-client, application-client, infrastructure-client, ui-* | domain-server, *-server |
| **Desktop Renderer** | contracts, utils, domain-client, application-client, infrastructure-client, ui-* | domain-server, *-server |
| **Desktop Main** | contracts, utils, domain-server, application-server, infrastructure-server | domain-client, *-client |
| **API Server** | contracts, utils, domain-server, application-server, infrastructure-server | domain-client, *-client |

---

## 🗄️ 数据模型概览

### 核心聚合根 (10个)

| 聚合根 | 描述 | 相关实体 |
|--------|------|----------|
| `account` | 用户账户 | authCredential, authSession, userSetting |
| `goal` | OKR 目标 | keyResult, goalRecord, goalReview, goalFolder |
| `taskTemplate` | 任务模板 | taskInstance, taskDependency |
| `reminderTemplate` | 提醒模板 | reminderInstance, reminderGroup, reminderResponse |
| `schedule` | 日程 | scheduleTask, scheduleExecution |
| `repository` | 知识仓库 | resource, folder |
| `document` | 文档 | document_version, document_link |
| `aiConversation` | AI 对话 | aiMessage |
| `notification` | 通知 | notificationChannel, notificationHistory |
| `setting` | 设置 | settingGroup, settingItem |

### 同步系统 (Event Sourcing)

```
syncEvent         # 事件日志 (不可变)
entityVersion     # 实体版本 (物化视图)
syncDevice        # 设备注册
syncCursor        # 同步游标
syncConflict      # 冲突记录
```

---

## 🔌 通信架构

### Web ↔ API

```
[Vue 3 App] ──Axios──> [Express API] ──Prisma──> [PostgreSQL]
     │
     └──EventSource──> [SSE Endpoint]
```

### Desktop IPC

```
[React Renderer] ──ipcRenderer.invoke──> [Preload Bridge] ──ipcMain.handle──> [Main Process]
       │                                                                            │
       │                                                                            ▼
       │                                                                     [SQLite DB]
       │
       └── Zustand Store ◀────── IPC Client ◀────── IPC Response
```

---

## 📊 统计信息

| 指标 | 数量 |
|------|------|
| 应用数量 | 3 |
| 共享包数量 | 16 |
| API 模块数量 | 14 |
| Web 模块数量 | 14 |
| Desktop 主进程模块 | 21 |
| Desktop 渲染进程模块 | 17 |
| Prisma 模型数量 | 50+ |
| Schema 总行数 | 1620 |
| 文档文件数 | 50+ |

---

## 🔗 相关文档

- [系统架构概览](architecture/system-overview.md)
- [Desktop 架构](architecture/desktop-architecture.md)
- [DDD 类型架构](architecture/ddd-type-architecture.md)
- [IPC 架构](architecture/IPC_ARCHITECTURE.md)
- [Nx 使用指南](configs/NX_USAGE_GUIDE.md)

---

*文档由 BMAD Analyst Agent 生成*
