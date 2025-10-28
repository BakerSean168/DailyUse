# 源码树分析

> **生成时间**: 2025-01-XX XX:XX:XX  
> **项目**: DailyUse Nx Monorepo  
> **版本**: 0.1.10

---

## 📁 完整目录结构

```
DailyUse/
├── apps/                           # 应用目录
│   ├── api/                       # API Backend (Express + Prisma)
│   │   ├── src/
│   │   │   ├── index.ts          # 应用入口
│   │   │   ├── app.ts            # Express 应用配置
│   │   │   ├── config/           # 配置文件
│   │   │   ├── middleware/       # Express 中间件
│   │   │   ├── modules/          # 业务模块 (8个)
│   │   │   │   ├── goal/         # 目标模块
│   │   │   │   ├── task/         # 任务模块
│   │   │   │   ├── schedule/     # 调度模块
│   │   │   │   └── ...
│   │   │   └── shared/           # 共享代码
│   │   ├── prisma/
│   │   │   └── schema.prisma     # 数据库模式
│   │   └── package.json
│   │
│   ├── web/                       # Web Application (Vue 3)
│   │   ├── src/
│   │   │   ├── main.ts           # 应用入口
│   │   │   ├── App.vue           # 根组件
│   │   │   ├── shared/           # 共享资源
│   │   │   │   ├── router/       # 路由配置
│   │   │   │   ├── api/          # API 客户端
│   │   │   │   └── vuetify/      # Vuetify 配置
│   │   │   └── modules/          # 业务模块 (12个)
│   │   │       ├── goal/
│   │   │       ├── task/
│   │   │       └── ...
│   │   ├── index.html
│   │   └── package.json
│   │
│   └── desktop/                   # Desktop App (Electron)
│       ├── src/
│       │   ├── main/             # 主进程
│       │   └── renderer/         # 渲染进程
│       └── package.json
│
├── packages/                      # 共享包
│   ├── contracts/                # DTOs + 类型定义
│   ├── domain-client/            # 客户端领域逻辑
│   ├── domain-server/            # 服务端领域逻辑
│   ├── ui/                       # Vue 组件库
│   └── utils/                    # 工具函数
│
├── docs/                          # 文档目录 (422+ MD 文件)
│   ├── project-overview.md       # 项目概览
│   ├── bmm-index.md             # 文档索引
│   ├── architecture-api.md       # API 架构
│   ├── architecture-web.md       # Web 架构
│   ├── modules/                  # 模块文档
│   ├── systems/                  # 系统文档
│   └── guides/                   # 开发指南
│
├── bmad/                          # BMAD Method v6
│   └── bmm/                      # BMAD Method Module
│
├── tools/                         # 工具脚本
├── public/                        # 静态资源
│
├── package.json                   # 根 package.json
├── pnpm-workspace.yaml           # pnpm 工作区配置
├── nx.json                        # Nx 配置
├── tsconfig.base.json            # TypeScript 配置
└── README.md                      # 项目说明
```

---

## 🎯 关键目录说明

### apps/api/src/modules/ (8个业务模块)

每个模块遵循 DDD 四层架构：

- **interfaces/**: REST API 控制器
- **application/**: 应用服务层
- **domain/**: 领域服务 + 实体
- **infrastructure/**: 数据访问 (Prisma)

### apps/web/src/modules/ (12个业务模块)

每个模块包含：

- **views/**: 页面组件
- **components/**: UI 组件
- **composables/**: 业务逻辑
- **stores/**: Pinia 状态管理
- **services/**: 应用服务

### packages/ (5个共享包)

- **contracts**: 跨应用类型定义
- **domain-client**: Web/Desktop 共享逻辑
- **domain-server**: API 专用逻辑
- **ui**: 可复用 Vue 组件
- **utils**: 工具函数 (logger, eventBus, 等)

---

## 📚 相关文档

- [项目概览](./project-overview.md)
- [API Backend 架构](./architecture-api.md)
- [Web Application 架构](./architecture-web.md)

---

**文档维护**: BMAD v6 Analyst  
**最后更新**: 2025-01-XX
