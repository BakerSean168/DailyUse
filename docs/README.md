---
tags:
  - documentation
  - index
  - obsidian
  - v2.0
description: DailyUse项目文档中心 v2.0 - 生产级文档系统
created: 2025-11-23T14:54:12
updated: 2025-11-23T15:00:00
---

# 📚 DailyUse Documentation v2.0

> 🎯 生产级、开发友好、AI优化的文档系统

## 🚀 快速导航

<table>
<tr>
<td width="33%">

### 🌱 新手入门
开始使用 DailyUse

- [[getting-started/quick-start|⚡ 5分钟快速开始]]
- [[getting-started/installation|📦 完整安装指南]]
- [[getting-started/project-structure|📁 项目结构导览]]

</td>
<td width="33%">

### 🏗 架构设计
了解系统架构

- [[architecture/system-overview|🎯 系统架构概览]]
- [[architecture/api-architecture|🔌 API架构]]
- [[architecture/web-architecture|🌐 Web架构]]
- [[architecture/adr/README|📝 架构决策记录 (ADR)]]

</td>
<td width="33%">

### 📦 业务模块
深入各个模块

- [[modules/goal/README|🎯 目标管理 (OKR)]]
- [[modules/task/README|✅ 任务管理 (GTD)]]
- [[modules/schedule/README|📅 日程调度]]
- [[modules/reminder/README|⏰ 智能提醒]]

</td>
</tr>
<tr>
<td width="33%">

### 📖 开发指南
开发工作流程

- [[guides/development/setup|🛠 开发环境配置]]
- [[guides/development/coding-standards|📝 代码规范]]
- [[guides/development/testing|🧪 测试指南]]
- [[guides/development/git-workflow|🌿 Git工作流]]

</td>
<td width="33%">

### 📚 参考文档
快速查阅

- [[reference/api/README|🔌 API参考]]
- [[reference/cli/README|⌨️ CLI命令]]
- [[reference/configuration/README|⚙️ 配置参考]]
- [[packages-index|📦 包文档索引]]

</td>
<td width="33%">

### 🤝 贡献指南
参与项目

- [[contributing/README|🤝 贡献指南]]
- [[contributing/code-of-conduct|📜 行为准则]]
- [[contributing/documentation-guide|📝 文档规范]]

</td>
</tr>
</table>

---

## 📖 文档体系结构

```
docs/
├── getting-started/         # 🌱 新手入门（快速开始、安装、结构）
├── architecture/            # 🏗 系统架构（C4模型、DDD、ADR）
│   └── adr/                # 架构决策记录
├── modules/                 # 📦 业务模块（goal、task、schedule等）
├── guides/                  # 📖 开发指南
│   ├── development/        # 开发指南（编码、测试、调试）
│   ├── deployment/         # 部署指南（环境、CI/CD）
│   └── troubleshooting/    # 故障排除
├── reference/              # 📚 参考文档
│   ├── api/                # API文档（自动生成）
│   ├── cli/                # CLI命令
│   └── configuration/      # 配置参考
├── examples/               # 💡 示例代码（可运行）
├── contributing/           # 🤝 贡献指南
├── concepts/               # 💭 概念文档（DDD、事件驱动）
├── packages/               # 📦 包文档（共享包说明）
├── ops/                    # 🔧 运维文档（Docker、部署）
├── configs/                # ⚙️ 配置说明（Nx、TS、构建）
└── archives/               # 🗄️ 归档文档
    ├── incidents/          # 历史问题修复
    └── legacy/             # 遗留文档
```

---

## 🎯 按角色导航

### 👨‍💻 新开发者

**目标**: 快速上手开发

1. [[getting-started/quick-start|⚡ 5分钟快速开始]] - 启动第一个服务
2. [[getting-started/installation|📦 完整安装指南]] - 配置开发环境
3. [[getting-started/project-structure|📁 项目结构]] - 了解代码组织
4. [[architecture/system-overview|🎯 系统架构]] - 理解整体设计

**预计时间**: 2-3小时

### 🏗 架构师

**目标**: 理解架构设计与决策

1. [[architecture/system-overview|🎯 系统架构概览]] - C4模型、DDD分层
2. [[architecture/adr/README|📝 架构决策记录]] - 关键技术选型
3. [[architecture/integration-architecture|🔗 集成架构]] - 模块间通信
4. [[concepts/ddd-patterns|🏛 DDD模式]] - 领域驱动设计

### 🚀 运维工程师

**目标**: 部署与维护系统

1. [[ops/docker/DOCKER_SERVICES_GUIDE|🐳 Docker服务指南]] - 容器化部署
2. [[guides/deployment/README|🚀 部署指南]] - 各环境部署流程
3. [[guides/troubleshooting/README|🔧 故障排除]] - 常见问题解决
4. [[reference/configuration/README|⚙️ 配置参考]] - 环境变量与配置

### 📝 技术写作者

**目标**: 编写与维护文档

1. [[contributing/documentation-guide|📝 文档规范]] - 写作指南
2. [[architecture/adr/README|📝 ADR模板]] - 决策记录格式
3. [[getting-started/README|📚 学习路径]] - 文档组织结构


---

## 📦 核心包 (Packages)

完整的共享包文档，包含API参考和使用示例。

| 包名 | 描述 | 文档 |
|------|------|------|
| `@dailyuse/contracts` | TypeScript类型契约层 | [[packages-contracts|查看文档]] |
| `@dailyuse/domain-client` | 客户端领域层 (Pinia) | [[packages-domain-client|查看文档]] |
| `@dailyuse/domain-server` | 服务端领域层 (DDD) | [[packages-domain-server|查看文档]] |
| `@dailyuse/utils` | 通用工具库 | [[packages-utils|查看文档]] |
| `@dailyuse/ui` | Vue 3 UI组件库 | [[packages-ui|查看文档]] |
| `@dailyuse/assets` | 静态资源 | [[packages-assets|查看文档]] |

📑 [[packages-index|包文档完整索引]]

---

## 🏗 架构文档 (Architecture)

### 核心架构

- [[architecture/system-overview|🎯 系统架构概览]] - C4模型、技术栈、模块划分
- [[architecture/api-architecture|🔌 API架构]] - NestJS后端架构
- [[architecture/web-architecture|🌐 Web架构]] - Vue 3前端架构  
- [[architecture/integration-architecture|🔗 集成架构]] - 跨应用集成方案

### 架构决策记录 (ADR)

记录项目中重要的架构决策及其背景。

- [[architecture/adr/README|📝 ADR索引]] - 所有架构决策
- [[architecture/adr/001-use-nx-monorepo|ADR-001: 使用Nx Monorepo]]
- [[architecture/adr/002-ddd-pattern|ADR-002: 采用DDD架构模式]]
- [[architecture/adr/003-event-driven-architecture|ADR-003: 事件驱动架构]]

---

## 💡 概念文档 (Concepts)

深入理解核心概念和设计模式。

### DDD与架构模式

- [[concepts/ddd-patterns|🏛 DDD模式指南]] - Entity、Value Object、Aggregate、Repository、Service
- [[concepts/event-driven|📡 事件驱动架构]] - 事件设计、发布订阅模式

### 业务概念

#### 权重系统
- [[concepts/weight-system/WEIGHT_SYSTEM_COMPLETE_OVERHAUL|权重系统完整重构]] - 系统设计与实现
- [[concepts/weight-system/WEIGHT_SYSTEM_QUICK_REFERENCE|权重系统快速参考]] - API速查

#### 日程调度系统
- [[concepts/schedule/UNIFIED_SCHEDULE_EVENT_SYSTEM|统一日程事件系统]] - 系统架构设计
- [[concepts/schedule/UNIFIED_SCHEDULE_EVENT_SYSTEM_QUICK_GUIDE|日程事件系统快速指南]] - 快速上手

---

## 📖 开发指南 (Guides)

### 开发环境

- [[guides/development/setup|🛠 开发环境配置]] - IDE、工具、插件
- [[guides/development/coding-standards|📝 代码规范]] - TypeScript、Vue、NestJS规范
- [[guides/development/testing|🧪 测试指南]] - 单元测试、E2E测试
- [[guides/development/debugging|🐛 调试指南]] - 调试技巧
- [[guides/development/git-workflow|🌿 Git工作流]] - 分支策略、提交规范

### 部署指南

- [[guides/deployment/local|🖥 本地部署]] - 开发环境部署
- [[guides/deployment/staging|🎭 预发布环境]] - Staging部署流程
- [[guides/deployment/production|🚀 生产环境]] - Production部署流程

### 故障排除

- [[guides/troubleshooting/common-errors|❗ 常见错误]] - 常见问题解决方案
- [[guides/troubleshooting/performance|⚡ 性能问题]] - 性能优化与排查

---

## 📚 参考文档 (Reference)

### API参考

- [[reference/api/README|🔌 API参考]] - RESTful API文档
- [[reference/api/authentication|🔐 认证API]] - 登录、注册、Token
- [[reference/api/goal|🎯 目标API]] - 目标CRUD操作
- [[reference/api/task|✅ 任务API]] - 任务管理
- [[reference/api/schedule|📅 日程API]] - 日程调度

### CLI参考

- [[reference/cli/README|⌨️ CLI命令]] - 命令行工具
- [[reference/cli/nx|⚡ Nx命令]] - Nx任务执行
- [[reference/cli/prisma|🗄️ Prisma命令]] - 数据库迁移

### 配置参考

- [[reference/configuration/README|⚙️ 配置参考]] - 配置文件说明
- [[reference/configuration/nx|⚙️ Nx配置]] - nx.json、project.json
- [[reference/configuration/typescript|⚙️ TypeScript配置]] - tsconfig.json
- [[reference/configuration/env-variables|🔑 环境变量]] - .env配置

---

## 💡 示例代码 (Examples)

可运行的示例代码，帮助理解API使用。

- [[examples/README|💡 示例索引]] - 所有示例列表
- [[examples/goal/|🎯 目标示例]] - 创建、更新、删除目标
- [[examples/task/|✅ 任务示例]] - 任务操作示例
- [[examples/schedule/|📅 日程示例]] - 日程调度示例

---

## 🤝 贡献指南 (Contributing)

参与项目开发的完整指南。

- [[contributing/README|🤝 贡献指南]] - 如何贡献代码
- [[contributing/code-of-conduct|📜 行为准则]] - 社区行为规范
- [[contributing/pull-request-template|🔀 PR模板]] - Pull Request指南
- [[contributing/documentation-guide|📝 文档规范]] - 文档写作指南

---

## 🔧 运维文档 (Operations)

### Docker配置

- [[ops/docker/DOCKER_CONFIG_UNIFIED|🐳 Docker配置统一说明]] - 完整的Docker配置指南
- [[ops/docker/DOCKER_SERVICES_GUIDE|🐳 Docker服务指南]] - 服务启动与管理

---

## 📦 业务模块 (Modules)

每个业务模块的详细文档。

| 模块 | 描述 | 文档 |
|------|------|------|
| **Goal** | OKR目标管理 | [[modules/goal/README|查看文档]] |
| **Task** | GTD任务管理 | [[modules/task/README|查看文档]] |
| **Schedule** | 日程调度系统 | [[modules/schedule/README|查看文档]] |
| **Reminder** | 智能提醒系统 | [[modules/reminder/README|查看文档]] |
| **Notification** | 通知中心 | [[modules/notification/README|查看文档]] |
| **Repository** | 知识仓库 | [[modules/repository/README|查看文档]] |
| **Editor** | Markdown编辑器 | [[modules/editor/README|查看文档]] |
| **Authentication** | 认证授权 | [[modules/authentication/README|查看文档]] |

---

## ⚙️ 配置说明 (Configs)

构建工具和开发工具的配置说明。

### Nx配置
- [[configs/nx-configuration|⚡ Nx配置说明]]
- [[configs/nx-optimization|⚡ Nx优化指南]]

### TypeScript配置
- [[configs/typescript-configuration|📘 TypeScript配置说明]]
- [[configs/tsconfig-paths|📘 路径映射配置]]

### 构建优化
- [[how-to/build/NX_VS_TSC_INCREMENTAL_BUILD|⚙️ Nx vs tsc增量构建]]
- [[how-to/build/TSUP_MIGRATION_COMPLETE|⚙️ tsup迁移完成]]

---

## 🗄️ 归档文档 (Archives)

历史文档，供参考。

### 问题修复报告
- [[archives/incidents/BUILD_ISSUE_REPORT|🔧 构建问题报告]]
- [[archives/incidents/COMPILATION_ERROR_FIX_SUMMARY|🔧 编译错误修复总结]]
- [[archives/incidents/E2E_TEST_FIX_REPORT|🔧 E2E测试修复报告]]

### 遗留文档
- [[archives/legacy/README|🗄️ 遗留文档索引]] - 18篇历史实现文档

---

## 📊 文档统计

| 类别 | 数量 | 状态 |
|------|------|------|
| **入门指南** | 4篇 | ✅ 完成 |
| **架构文档** | 5篇 + 3个ADR | ✅ 完成 |
| **业务模块** | 8个模块 | 🔄 进行中 |
| **开发指南** | 10+篇 | 🔄 进行中 |
| **参考文档** | 15+篇 | 🔄 进行中 |
| **示例代码** | 5+个 | ⏳ 待创建 |
| **贡献指南** | 4篇 | ✅ 完成 |
| **包文档** | 6篇 | ✅ 完成 |
| **概念文档** | 8篇 | ✅ 完成 |
| **运维文档** | 2篇 | ✅ 完成 |
| **配置说明** | 8篇 | ✅ 完成 |
| **归档文档** | 21篇 | ✅ 完成 |

**文档总数**: 100+ 篇（包含规划中）  
**v2.0完成度**: 40%

---

## 💡 文档约定

### YAML Front Matter

所有文档使用Obsidian兼容的YAML前置元数据：

```yaml
---
tags:
  - tag1
  - tag2
description: 文档简短描述
created: 2025-11-23T15:00:00
updated: 2025-11-23T15:00:00
---
```

### 链接格式

- **内部链接**: `[[文件名|显示文本]]` 或 `[[文件名]]`
- **外部链接**: `[显示文本](URL)`
- **相对路径**: `[文本](./相对路径.md)`

### 文档状态标记

- ✅ **完成** - 文档内容完整且最新
- 🔄 **进行中** - 文档正在编写或更新
- ⏳ **待创建** - 文档计划中但尚未创建
- 🗄️ **已归档** - 历史文档，仅供参考

---

## 🔍 搜索技巧

### Obsidian搜索

在Obsidian中打开 `docs/` 目录，使用以下搜索技巧：

- **按标签搜索**: `tag:#getting-started`
- **按文件名搜索**: `file:quick-start`
- **全文搜索**: 直接输入关键词
- **组合搜索**: `tag:#api path:reference/`

### IDE搜索

在VS Code中：
- **Ctrl+P**: 快速打开文件
- **Ctrl+Shift+F**: 全局搜索
- **Ctrl+T**: 搜索符号

---

## 🔗 外部资源

### 技术栈文档

| 技术 | 官方文档 |
|------|---------|
| **Nx** | [nx.dev](https://nx.dev/) |
| **Vue 3** | [vuejs.org](https://vuejs.org/) |
| **NestJS** | [nestjs.com](https://nestjs.com/) |
| **TypeScript** | [typescriptlang.org](https://www.typescriptlang.org/) |
| **Prisma** | [prisma.io](https://www.prisma.io/) |
| **Vuetify** | [vuetifyjs.com](https://vuetifyjs.com/) |

### 设计资源

- [Material Design Icons](https://pictogrammers.com/library/mdi/)
- [Vuetify Icon Fonts](https://vuetifyjs.com/en/features/icon-fonts/)

---

## 🤝 参与文档建设

### 报告文档问题

发现文档错误或缺失？

1. 在 [GitHub Issues](https://github.com/BakerSean168/DailyUse/issues) 创建问题
2. 使用标签 `documentation`
3. 描述问题位置和期望内容

### 贡献文档

想要改进文档？

1. Fork项目并创建分支
2. 按照 [[contributing/documentation-guide|文档规范]] 编写
3. 提交Pull Request
4. 等待Review

---

## 📞 获取帮助

- 💬 [GitHub Discussions](https://github.com/BakerSean168/DailyUse/discussions) - 提问与讨论
- 🐛 [GitHub Issues](https://github.com/BakerSean168/DailyUse/issues) - 报告Bug
- 📧 Email: baker.sean168@gmail.com - 联系维护者

---

**最后更新**: 2025-11-23  
**维护者**: @BakerSean168  
**版本**: v2.0  
**状态**: 🔄 持续完善中
