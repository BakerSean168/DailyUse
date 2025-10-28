# DailyUse 项目文档索引

> **生成时间**: 2025-10-28 14:24:17  
> **BMAD 版本**: v6.0.0-beta.0  
> **项目版本**: 0.1.10  
> **文档生成工具**: BMAD Analyst (Deep Scan Mode)

---

## 📖 文档导航

### 🎯 快速开始

1. **[项目概览](./project-overview.md)** - 项目简介、技术栈、架构组成
2. **[开发指南](./development-guide.md)** _(To be generated)_ - 环境搭建、开发流程
3. **[API 快速参考](./api-contracts.md)** _(To be generated)_ - API 端点清单

### 🏗️ 架构文档

#### 应用架构
- **[API Backend 架构](./architecture-api.md)** ✅
  - Express + Prisma 架构
  - RESTful API 设计
  - 数据库模式
  - 认证授权机制

- **[Web Application 架构](./architecture-web.md)** ✅
  - Vue 3 + Vuetify 架构
  - Pinia 状态管理
  - 路由设计
  - 组件结构

- **[Desktop Application 架构](./architecture-desktop.md)** _(To be generated)_
  - Electron 架构
  - 主进程与渲染进程通信
  - 本地数据库
  - 系统集成

#### 系统架构
- **[集成架构](./integration-architecture.md)** ✅
  - 多应用通信
  - 数据流设计
  - API 契约
  - 事件系统

- **[源码树分析](./source-tree-analysis.md)** ✅
  - 目录结构详解
  - 关键路径说明
  - 模块组织

### 📊 技术规范

#### 已有文档 (系统级)
- [DDD 规范](./DDD规范.md) - 领域驱动设计规范
- [事件 vs Saga 模式分析](./systems/EVENT_VS_SAGA_PATTERN_ANALYSIS.md) - 架构模式选择
- [Prisma 事务架构](./systems/PRISMA_TRANSACTION_ARCHITECTURE.md) - 数据库事务设计
- [SSE 技术文档](./systems/SSE_TECHNICAL_DOCUMENTATION.md) - 实时通信方案
- [初始化错误处理最佳实践](./systems/INITIALIZATION_ERROR_HANDLING_BEST_PRACTICES.md)

#### 已有文档 (配置)
- [Nx 配置完整指南](./configs/NX_CONFIGURATION_GUIDE.md) - Nx Monorepo 配置详解
- [Nx 使用指南](./configs/NX_USAGE_GUIDE.md) - Nx 命令和工作流
- [TSConfig 优化总结](./configs/TSCONFIG_OPTIMIZATION_SUMMARY.md) - TypeScript 配置优化
- [项目 JSON 指南](./configs/PROJECT_JSON_GUIDE.md) - Project.json 配置说明
- [构建优化指南](./configs/BUILD_OPTIMIZATION_GUIDE.md) - 构建性能优化

### 🎨 业务模块

#### Goal (目标管理) ⭐ 文档完整
- [模块规划](./modules/goal/GOAL_MODULE_PLAN.md)
- [接口定义](./modules/goal/GOAL_MODULE_INTERFACES.md)
- [完整流程](./modules/goal/Goal模块完整流程.md)
- **Feature Specs** (8个功能规格):
  - [KR 权重快照](./modules/goal/features/02-kr-weight-snapshot.md)
  - [专注模式](./modules/goal/features/03-focus-mode.md)
  - [目标复盘](./modules/goal/features/04-goal-retrospective.md)
  - [进度自动计算](./modules/goal/features/04-progress-auto-calculation.md)
  - [目标任务关联](./modules/goal/features/05-goal-task-link.md)
  - [模板库](./modules/goal/features/06-goal-template-library.md)
  - [目标依赖](./modules/goal/features/07-goal-dependencies.md)
  - [健康评分](./modules/goal/features/08-goal-health-score.md)

#### Task (任务管理) ⭐ 文档完整
- [模块规划](./modules/task/TASK_MODULE_PLAN.md)
- [接口定义 V2](./modules/task/TASK_MODEL_INTERFACES_V2.md)
- **Feature Specs** (7个功能规格):
  - [依赖图](./modules/task/features/01-dependency-graph.md)
  - [优先级矩阵](./modules/task/features/02-priority-matrix.md)
  - [时间块](./modules/task/features/03-task-time-blocks.md)
  - [进度快照](./modules/task/features/04-progress-snapshot.md)
  - [任务依赖](./modules/task/features/06-task-dependencies.md)
  - [标签系统](./modules/task/features/07-task-tags.md)
  - [任务模板](./modules/task/features/08-task-templates.md)
- **业务流程**:
  - [循环任务流程](./modules/task/task-flows/RECURRING_TASK_FLOW.md)
  - [任务实例生命周期](./modules/task/task-flows/TASK_INSTANCE_LIFECYCLE_FLOW.md)
  - [任务模板状态转换](./modules/task/task-flows/TASK_TEMPLATE_STATUS_TRANSITION_FLOW.md)

#### Schedule (调度模块) ⭐ 文档完整
- [模块设计](./modules/schedule/01-SCHEDULE_MODULE_DESIGN.md)
- [Contracts 实现总结](./modules/schedule/02-CONTRACTS_IMPLEMENTATION_SUMMARY.md)
- [Domain Server 实现总结](./modules/schedule/03-DOMAIN_SERVER_IMPLEMENTATION_SUMMARY.md)
- [Web 实现完成](./modules/schedule/WEB_IMPLEMENTATION_COMPLETE.md)
- [Domain Client 最终总结](./modules/schedule/DOMAIN_CLIENT_FINAL_SUMMARY.md)
- **Feature Specs** (5个功能规格):
  - [冲突检测](./modules/schedule/features/01-conflict-detection.md)
  - [日历同步](./modules/schedule/features/03-calendar-sync.md)
  - [周视图](./modules/schedule/features/04-week-view.md)
  - [时间热力图](./modules/schedule/features/05-time-heatmap.md)
  - [搜索过滤](./modules/schedule/features/06-search-filter.md)

#### Reminder (提醒模块) ⭐ 文档良好
- **Feature Specs** (4个功能规格):
  - [智能频率调整](./modules/reminder/features/01-smart-frequency.md)
  - [历史追踪](./modules/reminder/features/03-history-tracking.md)
  - [提醒模板](./modules/reminder/features/04-reminder-templates.md)
  - [位置提醒](./modules/reminder/features/05-location-reminder.md)

#### Notification (通知模块) ⭐ 文档良好
- [API 实现总结](./modules/notification/NOTIFICATION_API_IMPLEMENTATION_SUMMARY.md)
- **Feature Specs** (4个功能规格):
  - [多渠道聚合](./modules/notification/features/01-multi-channel-aggregation.md)
  - [优先级分类](./modules/notification/features/02-priority-classification.md)
  - [通知摘要](./modules/notification/features/03-notification-digest.md)
  - [统计分析](./modules/notification/features/04-notification-stats.md)

#### Setting (设置模块) ⚠️ 需完善
- [模块规划](./modules/setting/SETTING_MODULE_PLAN.md)
- [模型接口](./modules/setting/SETTING_MODEL_INTERFACES.md)
- [Contracts 完成总结](./modules/SETTING_MODULE_CONTRACTS_COMPLETION_SUMMARY.md)
- [Domain Server 完成](./modules/SETTING_DOMAIN_SERVER_COMPLETION.md)
- [API 完成](./modules/SETTING_API_COMPLETION.md)

#### Account (账户模块) ⚠️ 需完善
- [认证 API 实现总结](./modules/account/ACCOUNT_AUTHENTICATION_API_IMPLEMENTATION_SUMMARY.md)
- [认证 Contracts 实现](./modules/account/ACCOUNT_AUTHENTICATION_CONTRACTS_IMPLEMENTATION.md)

#### Repository (仓库模块) ⚠️ 文档缺失
- _(暂无文档，仅有代码实现)_

### 📦 共享包文档

#### Utils 包 ⭐ 文档完整
- **Logger 系统**:
  - [快速参考](./packages/utils/LOGGER_QUICK_REFERENCE.md)
  - [集成指南](./packages/utils/LOGGER_INTEGRATION_GUIDE.md)
  - [使用指南](./packages/utils/logger-usage-guide.md)
  - [示例代码](./packages/utils/logger-examples.md)

- **API 响应系统**:
  - [系统指南](./packages/utils/API_RESPONSE_SYSTEM_GUIDE.md)
  - [快速参考](./packages/utils/api-response-quick-reference.md)
  - [示例代码](./packages/utils/api-response-examples.md)

- **SSE (Server-Sent Events)**:
  - [实现指南](./packages/utils/SSE_IMPLEMENTATION_GUIDE.md)
  - [Token 认证实现](./packages/utils/SSE_TOKEN_AUTH_IMPLEMENTATION.md)
  - [用户级连接升级](./packages/utils/SSE_USER_LEVEL_CONNECTION_UPGRADE.md)

- **系统模块**:
  - [防抖/节流](./packages/utils/systems/debounce-throttle.md)
  - [事件总线](./packages/utils/systems/event-bus.md)
  - [验证工具](./packages/utils/systems/validation.md)
  - [加载状态](./packages/utils/systems/loading-state.md)
  - [初始化管理](./packages/utils/systems/initialization.md)

#### UI 包
- [useMessage Composable](./packages/ui/composables/useMessage.md)

### 🔧 开发指南

#### 已有指南
- [前端工具使用](./guides/frontend-tools-usage.md)
- [前端优雅模式](./guides/frontend-elegant-patterns.md)
- [主题系统 README](./guides/THEME_SYSTEM_README.md)
- [编辑器模块完成](./guides/EDITOR_MODULE_COMPLETION.md)
- [开发源码模式](./guides/DEV_SOURCE_MODE.md)
- [DAG 性能优化](./guides/DAG-PERFORMANCE-OPTIMIZATION.md)
- [性能基准测试](./guides/PERFORMANCE-BENCHMARKS.md)
- [PowerShell 开发指南](./guides/POWERSHELL_DEVELOPER_GUIDE.md)
- [产品经理提示指南](./guides/PRODUCT_MANAGER_PROMPTS_GUIDE.md)
- [Corepack pnpm 设置指南](./guides/COREPACK_PNPM_SETUP_GUIDE.md)
- [Nx CI 优化指南](./guides/NX_CI_OPTIMIZATION_GUIDE.md)

#### 待生成文档
- **[开发环境设置](./development-guide.md)** _(To be generated)_
- **[Git 工作流](./git-workflow.md)** _(To be generated)_
- **[测试指南](./testing-guide.md)** _(To be generated)_
- **[部署指南](./deployment-guide.md)** _(To be generated)_

### 📝 API 参考

- **[API 契约文档](./api-contracts.md)** _(To be generated)_
  - 所有 REST API 端点
  - 请求/响应格式
  - 认证要求

- **[数据模型](./data-models.md)** _(To be generated)_
  - Prisma Schema
  - 实体关系图
  - 数据字典

---

## 📊 项目统计

### 仓库信息

| 指标 | 值 |
|------|------|
| **仓库类型** | Nx Monorepo |
| **应用数量** | 3 (API + Web + Desktop) |
| **共享包数量** | 5 (contracts, domain-client, domain-server, ui, utils) |
| **业务模块数量** | 8 (Goal, Task, Schedule, Reminder, Notification, Setting, Account, Repository) |
| **文档总数** | 422+ Markdown 文件 |
| **Feature Specs** | 30+ 功能规格文档 |

### 技术栈总览

| 层级 | 技术 |
|------|------|
| **前端** | Vue 3, Vuetify 3, Pinia, Vue Router |
| **桌面** | Electron 30.x |
| **后端** | Node.js, Express, Prisma |
| **数据库** | PostgreSQL / SQLite |
| **构建** | Nx, Vite, tsup |
| **包管理** | pnpm v10.18.3 |
| **语言** | TypeScript 5.8.3 |

---

## 🎯 文档质量评估

| 模块 | 文档完整性 | 评分 |
|------|-----------|------|
| **Goal** | ⭐⭐⭐⭐⭐ | 5/5 |
| **Task** | ⭐⭐⭐⭐⭐ | 5/5 |
| **Schedule** | ⭐⭐⭐⭐⭐ | 5/5 |
| **Reminder** | ⭐⭐⭐⭐ | 4/5 |
| **Notification** | ⭐⭐⭐⭐ | 4/5 |
| **Setting** | ⭐⭐⭐ | 3/5 |
| **Account** | ⭐⭐ | 2/5 |
| **Repository** | ⭐ | 1/5 |
| **Utils 包** | ⭐⭐⭐⭐⭐ | 5/5 |
| **系统架构** | ⭐⭐⭐⭐ | 4/5 |

---

## 🚀 如何使用此文档

### 对于新开发者

1. **从概览开始**: 阅读 [项目概览](./project-overview.md) 了解项目整体
2. **理解架构**: 查看各应用的架构文档（待生成）
3. **设置环境**: 跟随 [开发指南](./development-guide.md)（待生成）
4. **查看模块**: 浏览感兴趣的业务模块文档

### 对于产品经理

1. **业务功能**: 查看各模块的 Feature Specs
2. **规划文档**: 查看模块规划和接口定义
3. **进度追踪**: 查看实现总结和完成报告

### 对于架构师

1. **系统架构**: 查看系统级文档（DDD 规范、事件模式等）
2. **技术选型**: 查看技术栈和配置文档
3. **性能优化**: 查看性能基准和优化指南

### 对于 AI 辅助开发

本索引为 AI 代理提供完整的项目上下文：

- **PRD 生成**: 使用模块规划和 Feature Specs
- **代码生成**: 参考架构文档和接口定义
- **重构建议**: 基于 DDD 规范和最佳实践
- **文档补充**: 识别 _(To be generated)_ 标记的缺失文档

---

## 📌 快速链接

### 核心文档
- [项目 README](../README.md)
- [Git Flow 工作流](./.github/GITFLOW.md)
- [提交规范](./.github/COMMIT_CONVENTIONS.md)

### 外部资源
- [项目仓库](https://github.com/BakerSean168/DailyUse)
- [Nx 官方文档](https://nx.dev)
- [Vue 3 官方文档](https://vuejs.org)
- [Prisma 官方文档](https://prisma.io)

---

## 📮 文档维护

### 生成信息

- **生成工具**: BMAD v6 Analyst
- **扫描模式**: Deep Scan
- **扫描时间**: 2025-10-28 14:24:17
- **状态文件**: [project-scan-report.json](./project-scan-report.json)

### 更新策略

- **自动更新**: 运行 \mad/bmm\ Analyst 的 \document-project\ 工作流
- **手动更新**: 编辑对应的 Markdown 文件
- **建议频率**: 每次重大功能发布后

### 贡献指南

发现文档问题或需要补充？

1. 创建 Issue 描述文档问题
2. Fork 项目并修改文档
3. 提交 Pull Request 到 \dev\ 分支
4. 遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 规范

---

**最后更新**: 2025-10-28 14:24:17  
**维护者**: BakerSean168  
**License**: MIT
