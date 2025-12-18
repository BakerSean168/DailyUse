# DailyUse 开发指南

> **更新时间**: 2025-12-16  
> **项目版本**: 0.1.10  
> **Node.js**: 22+  
> **包管理器**: pnpm 10.18.3

---

## 🚀 快速开始

### 环境准备

```bash
# 1. 克隆仓库
git clone https://github.com/BakerSean168/DailyUse.git
cd DailyUse

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp apps/api/.env.example apps/api/.env
# 编辑 .env 文件，配置数据库连接等

# 4. 初始化数据库
pnpm prisma:migrate

# 5. 启动开发服务器
pnpm dev        # 启动所有应用
# 或单独启动
pnpm dev:api    # 仅 API (端口 3888)
pnpm dev:web    # 仅 Web (端口 5173)
pnpm dev:desktop # 仅 Desktop
```

### 验证安装

```bash
# API 健康检查
curl http://localhost:3888/api/v1/health

# Web 应用
open http://localhost:5173

# 运行测试
pnpm test
```

---

## 📁 项目结构

```
DailyUse/
├── apps/
│   ├── api/              # Express 后端 API
│   ├── web/              # Vue 3 Web 应用
│   └── desktop/          # Electron 桌面应用
├── packages/
│   ├── contracts/        # 类型契约 (DTOs, Enums)
│   ├── domain-server/    # 服务端领域层
│   ├── domain-client/    # 客户端领域层
│   ├── application-*/    # 应用服务层
│   ├── infrastructure-*/ # 基础设施层
│   ├── ui-*/             # UI 组件包
│   ├── utils/            # 工具函数
│   └── assets/           # 静态资源
├── docs/                 # 项目文档
└── tools/                # 构建工具
```

---

## 🛠️ 常用命令

### Nx 命令

```bash
# 运行开发服务器
pnpm nx serve api
pnpm nx serve web
pnpm nx serve desktop

# 构建
pnpm nx build api
pnpm nx build web
pnpm nx build desktop
pnpm nx build --all           # 构建所有

# 测试
pnpm nx test api
pnpm nx test web
pnpm nx affected:test         # 仅测试受影响的项目

# 代码检查
pnpm nx lint api
pnpm nx lint web
pnpm nx affected:lint

# 依赖图
pnpm nx graph                 # 打开依赖关系可视化
```

### 数据库命令

```bash
# Prisma 迁移
pnpm prisma:migrate           # 开发环境迁移
pnpm prisma:deploy            # 生产环境部署
pnpm prisma:reset             # 重置数据库
pnpm prisma:studio            # 打开 Prisma Studio
pnpm prisma:generate          # 生成 Prisma Client
```

### Docker 命令

```bash
# 启动开发环境
docker-compose up -d

# 启动测试环境
docker-compose -f docker-compose.test.yml up -d

# 查看日志
docker-compose logs -f api
```

---

## 🏗️ 开发规范

### 代码风格

- **TypeScript**: 严格模式，禁用 `any`
- **ESLint**: 统一配置在 `eslint.config.ts`
- **命名规范**:
  - 文件: `kebab-case.ts` 或 `PascalCase.vue`
  - 类/接口: `PascalCase`
  - 函数/变量: `camelCase`
  - 常量: `UPPER_SNAKE_CASE`

### Git 提交规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试
- `chore`: 构建/工具

**示例**:
```
feat(goal): add key result weight adjustment

- Implement weight snapshot mechanism
- Add weight history tracking
- Update goal progress calculation

Closes #123
```

### 分支策略 (GitHub Flow)

```
main                    # 主干分支 (生产环境，受保护)
├── feat/xxx            # 功能分支
├── fix/xxx             # 修复分支
├── refactor/xxx        # 重构分支
└── docs/xxx            # 文档分支
```

> ⚠️ **重要**: 本项目使用 GitHub Flow (Trunk-Based Development)，不使用传统 Git Flow。
> 详见: [Release Workflow 最佳实践](./guides/RELEASE_WORKFLOW.md)

---

## 📦 模块开发指南

### 创建新业务模块

1. **API 模块** (`apps/api/src/modules/<module>/`):
```
<module>/
├── application/           # 应用服务
│   └── services/
├── domain/               # 领域模型 (可选，大多在 packages)
├── infrastructure/       # 仓储实现
│   └── repositories/
├── interface/            # HTTP 接口
│   └── http/
│       ├── routes/
│       └── controllers/
├── initialization/       # 模块初始化
│   └── index.ts
└── index.ts
```

2. **Web 模块** (`apps/web/src/modules/<module>/`):
```
<module>/
├── application/          # 应用服务
│   └── services/
├── infrastructure/       # API 客户端
│   └── api/
├── presentation/         # 表现层
│   ├── components/
│   ├── composables/
│   ├── router/
│   ├── stores/
│   ├── views/
│   └── widgets/
├── initialization/       # 模块初始化
│   └── index.ts
└── index.ts
```

3. **Desktop 主进程模块** (`apps/desktop/src/main/modules/<module>/`):
```
<module>/
├── ipc/                  # IPC 处理器
│   └── index.ts
├── services/             # 业务服务
└── index.ts
```

4. **Desktop 渲染进程模块** (`apps/desktop/src/renderer/modules/<module>/`):
```
<module>/
├── ipc/                  # IPC 客户端
│   └── <module>.ipc-client.ts
├── presentation/
│   ├── components/
│   └── stores/
└── index.ts
```

### 添加共享类型

1. 在 `packages/contracts/src/modules/<module>/` 添加:
```typescript
// types.ts
export interface MyEntityServerDTO {
  uuid: string;
  // ...数据库字段
}

export interface MyEntityClientDTO extends MyEntityServerDTO {
  // ...计算属性
}

// enums.ts
export enum MyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}
```

2. 在 `packages/contracts/src/index.ts` 导出

### 添加领域实体

1. 服务端 (`packages/domain-server/src/<module>/`):
```typescript
export class MyEntityServer {
  constructor(private data: MyEntityServerDTO) {}
  
  static create(input: CreateInput): MyEntityServer { }
  static fromServerDTO(dto: MyEntityServerDTO): MyEntityServer { }
  
  toServerDTO(): MyEntityServerDTO { }
  toClientDTO(): MyEntityClientDTO { }
}
```

2. 客户端 (`packages/domain-client/src/<module>/`):
```typescript
export class MyEntity {
  constructor(private data: MyEntityClientDTO) {}
  
  static fromServerDTO(dto: MyEntityServerDTO): MyEntity { }
  static fromClientDTO(dto: MyEntityClientDTO): MyEntity { }
  
  toClientDTO(): MyEntityClientDTO { }
}
```

---

## 🧪 测试指南

### 单元测试 (Vitest)

```typescript
// __tests__/my-service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { MyService } from '../my-service';

describe('MyService', () => {
  it('should do something', () => {
    const service = new MyService();
    const result = service.doSomething();
    expect(result).toBe(expected);
  });
});
```

### E2E 测试 (Playwright)

```typescript
// e2e/goal.spec.ts
import { test, expect } from '@playwright/test';

test('should create a new goal', async ({ page }) => {
  await page.goto('/goals');
  await page.click('[data-testid="create-goal"]');
  await page.fill('[name="title"]', 'My Goal');
  await page.click('[type="submit"]');
  await expect(page.locator('.goal-card')).toContainText('My Goal');
});
```

### 运行测试

```bash
# 单元测试
pnpm test                     # 所有测试
pnpm nx test api              # 特定应用
pnpm nx test api --watch      # 监听模式

# E2E 测试
pnpm nx e2e web
pnpm nx e2e web --headed      # 显示浏览器

# 覆盖率
pnpm nx test api --coverage
```

---

## 🔧 调试技巧

### API 调试

```bash
# 启用详细日志
LOG_LEVEL=debug pnpm dev:api

# 使用 VS Code 调试
# 在 .vscode/launch.json 配置 "Debug API"
```

### Web 调试

- Vue DevTools 浏览器扩展
- Pinia DevTools
- Network 面板查看 API 请求

### Desktop 调试

```bash
# 主进程日志
# 查看终端输出

# 渲染进程
# 使用 Chrome DevTools (Ctrl+Shift+I)
```

---

## 📚 相关文档

- [系统架构概览](architecture/system-overview.md)
- [API 架构](architecture/api-architecture.md)
- [Web 架构](architecture/web-architecture.md)
- [Desktop 架构](architecture/desktop-architecture.md)
- [数据模型](data-models.md)
- [包文档索引](packages-index.md)
- [Nx 使用指南](configs/NX_USAGE_GUIDE.md)

---

*文档由 BMAD Analyst Agent 生成*
