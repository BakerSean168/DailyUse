# 📦 包命名标准 (Package Naming Standards)

## 命名规范

### ✅ 使用 `@dailyuse` Scope

本项目的所有包均使用 `@dailyuse` scope 作为命名空间前缀。

### 包分类

#### 1. **应用程序 (Applications)** - `apps/`
最终可执行的应用程序，通常不发布到 NPM。

| 包名 | 说明 | 类型 |
|------|------|------|
| `@dailyuse/api` | 后端 API 服务 | Node.js + Express |
| `@dailyuse/web` | Web 前端应用 | Vue 3 + Vite |
| `@dailyuse/desktop` | 桌面客户端 | Electron + React |

#### 2. **领域层 (Domain Layer)** - `packages/domain-*`
核心业务逻辑和实体模型。

| 包名 | 说明 |
|------|------|
| `@dailyuse/domain-client` | 客户端领域模型 (UI-focused) |
| `@dailyuse/domain-server` | 服务端领域模型 (Business logic) |

#### 3. **应用层 (Application Layer)** - `packages/application-*`
用例和应用服务。

| 包名 | 说明 |
|------|------|
| `@dailyuse/application-client` | 客户端应用服务 |
| `@dailyuse/application-server` | 服务端应用服务 |

#### 4. **基础设施层 (Infrastructure Layer)** - `packages/infrastructure-*`
数据库、API 调用、外部服务集成。

| 包名 | 说明 |
|------|------|
| `@dailyuse/infrastructure-client` | 客户端基础设施 (LocalStorage, IndexedDB) |
| `@dailyuse/infrastructure-server` | 服务端基础设施 (Prisma, Redis) |

#### 5. **UI 组件库 (UI Libraries)** - `packages/ui-*`
可复用的 UI 组件。

| 包名 | 说明 | 框架 |
|------|------|------|
| `@dailyuse/ui-core` | 核心 UI 抽象 | Framework-agnostic |
| `@dailyuse/ui-react` | React 组件 | React |
| `@dailyuse/ui-shadcn` | shadcn/ui 组件库 | React + Tailwind |
| `@dailyuse/ui-vue` | Vue 组件 | Vue 3 |
| `@dailyuse/ui-vuetify` | Vuetify 组件库 | Vue 3 + Vuetify |

#### 6. **共享模块 (Shared Modules)** - `packages/*`
跨层复用的工具和契约。

| 包名 | 说明 |
|------|------|
| `@dailyuse/contracts` | 类型定义和 DTO |
| `@dailyuse/utils` | 通用工具函数 |
| `@dailyuse/assets` | 静态资源 (图片、音频) |
| `@dailyuse/sync-client` | API 同步客户端 (OpenAPI 生成) |
| `@dailyuse/test-utils` | 测试工具和 fixtures |

---

## 为什么使用 `@dailyuse` Scope？

### 1. **命名空间隔离**
```bash
# ❌ 冲突风险高
import { Button } from 'ui-core'
import { Button } from 'some-other-lib/ui-core'

# ✅ 清晰无歧义
import { Button } from '@dailyuse/ui-core'
```

### 2. **NPM 发布管理**
- Scoped packages 默认为私有
- 便于组织级别的权限管理
- 支持发布到私有 NPM registry

### 3. **Monorepo 一致性**
- 所有内部包一眼可识别
- 便于 IDE 自动补全和搜索
- 符合 Nx/pnpm 最佳实践

### 4. **版本管理**
- Release Please 可以统一管理所有 `@dailyuse/*` 包的版本
- 便于批量升级和依赖追踪

---

## package.json 示例

### 应用程序 (apps/desktop/package.json)
```json
{
  "name": "@dailyuse/desktop",
  "version": "0.1.10",
  "private": true,
  "dependencies": {
    "@dailyuse/domain-client": "workspace:*",
    "@dailyuse/ui-shadcn": "workspace:*",
    "@dailyuse/utils": "workspace:*"
  }
}
```

### 库包 (packages/utils/package.json)
```json
{
  "name": "@dailyuse/utils",
  "version": "0.1.10",
  "private": false,
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
}
```

---

## 导入规范

### ✅ 正确的导入方式

```typescript
// 从 scoped package 导入
import { TaskTemplate } from '@dailyuse/domain-client/task'
import { createLogger } from '@dailyuse/utils'
import { Button } from '@dailyuse/ui-shadcn'

// 使用别名导入本地模块 (Vite/Nx 配置)
import { AuthService } from '@main/services/auth'
import { useTaskStore } from '@renderer/stores/task'
```

### ❌ 错误的导入方式

```typescript
// ❌ 不使用相对路径跨包导入
import { TaskTemplate } from '../../../domain-client/src/task'

// ❌ 不直接导入 workspace 包的 src
import { Button } from '@dailyuse/ui-shadcn/src/components'
```

---

## Nx 依赖图配置

所有包的依赖关系由 Nx 自动管理：

```bash
# 查看依赖图
pnpm nx graph

# 构建所有依赖
pnpm nx run-many --target=build --all

# 只构建受影响的包
pnpm nx affected --target=build
```

---

## 添加新包的步骤

### 1. 创建包目录
```bash
mkdir -p packages/my-new-package
cd packages/my-new-package
```

### 2. 创建 package.json
```json
{
  "name": "@dailyuse/my-new-package",
  "version": "0.1.10",
  "private": false,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

### 3. 创建 project.json (Nx 配置)
```json
{
  "name": "my-new-package",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "library",
  "sourceRoot": "packages/my-new-package/src",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc -b",
        "cwd": "packages/my-new-package"
      }
    }
  }
}
```

### 4. 更新 release-please 配置
```json
// release-please-config.json
{
  "packages": {
    "packages/my-new-package": {
      "release-type": "node",
      "package-name": "@dailyuse/my-new-package"
    }
  }
}

// .release-please-manifest.json
{
  "packages/my-new-package": "0.1.10"
}
```

### 5. 安装依赖并构建
```bash
pnpm install
pnpm nx run my-new-package:build
```

---

## 常见问题

### Q: 为什么有些包没有 `@dailyuse` prefix？
A: 本项目已全面统一使用 `@dailyuse` scope。如果发现遗漏，请提交 Issue。

### Q: 可以改包名吗？
A: 可以，但需要：
1. 修改 `package.json` 的 `name` 字段
2. 更新所有引用该包的 `import` 语句
3. 更新 `release-please-config.json`
4. 提交 PR 统一修改

### Q: 如何发布到 NPM？
A: 修改 `package.json` 的 `private: false`，然后运行：
```bash
pnpm publish --access public
```

---

**维护者**: @bakersean  
**最后更新**: 2025-12-18
