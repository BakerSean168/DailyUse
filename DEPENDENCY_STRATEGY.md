# 📦 依赖管理策略

> **更新日期**: 2025-10-25  
> **策略版本**: v3.0 - Isolated Mode  
> **重大变更**: 改用独立依赖管理，弃用 hoisted 模式

---

## 🎯 核心原则

本项目采用 **独立依赖管理策略** (isolated)，每个项目完全独立管理自己的依赖。这是最标准、最稳定、最可靠的方案。

### 为什么改用 Isolated 模式？

1. ✅ **CLI 工具可靠性**: Prisma、TypeScript 等工具在项目目录中直接可用
2. ✅ **零配置问题**: 不需要担心符号链接或路径解析问题
3. ✅ **开发体验最佳**: 所有 IDE 和工具都完美支持
4. ✅ **团队协作友好**: 新成员安装后立即可用，无需额外配置
5. ✅ **CI/CD 简单**: 构建脚本更简单，更少边界情况

### 权衡

- ⚠️ **磁盘空间**: 比 hoisted 模式多占用约 200-300MB
- ⚠️ **安装时间**: 首次安装慢约 5-10 秒
- ✅ **值得**: 稳定性和开发体验的提升远超成本

---

## 📊 依赖分布策略

### 1. **根目录依赖** (`package.json`)

#### 用途
- 共享的业务依赖
- Nx 构建工具
- 全局代码质量工具
- Monorepo 管理工具

#### 包含内容

**生产依赖**:
```json
{
  "@dailyuse/contracts": "workspace:*",
  "@dailyuse/domain-client": "workspace:*",
  "@dailyuse/domain-server": "workspace:*",
  "@dailyuse/ui": "workspace:*",
  "@dailyuse/utils": "workspace:*",
  "echarts": "^5.6.0",
  "vue-echarts": "^7.0.3"
  // ... 其他共享业务依赖
}
```

**开发依赖**:
```json
{
  "nx": "^21.4.1",
  "@nx/eslint": "^21.4.1",
  "prettier": "^3.0.0",
  "eslint": "^9.0.0",
  "vitest": "^3.2.4"
  // ... 全局工具
}
```

#### ❌ 不应包含
- 特定项目的 CLI 工具（如 `prisma`, `vite`, `vue-tsc`）
- 特定项目的类型定义
- 构建工具的项目特定配置

---

### 2. **API 项目依赖** (`apps/api/package.json`)

#### 关键 CLI 工具（必须本地安装）

```json
{
  "devDependencies": {
    "prisma": "^6.17.1",           // ✅ Prisma CLI - 必须本地
    "@prisma/client": "^6.17.1",   // ✅ Prisma 客户端
    "typescript": "^5.8.3",         // ✅ TypeScript - 必须本地
    "tsup": "^8.5.0",              // ✅ 构建工具
    "tsx": "^4.20.6",              // ✅ TS 执行器
    "cross-env": "10.1.0"          // ✅ 跨平台环境变量
  }
}
```

#### 为什么需要本地安装？

1. **Prisma**: 
   - CLI 命令需要在项目目录中执行
   - 需要读取 `./prisma/schema.prisma`
   - 需要访问本地 `.env` 文件

2. **TypeScript**:
   - `tsc` 命令需要在项目中执行类型检查
   - 需要读取项目的 `tsconfig.json`

3. **构建工具** (tsup/tsx):
   - 需要访问项目的配置文件
   - 需要在项目上下文中执行

#### pnpm 配置优化

```json
{
  "pnpm": {
    "neverBuiltDependencies": [
      "prisma",
      "@prisma/engines"
    ]
  }
}
```

**说明**: 跳过 Prisma 的 postinstall 构建，由我们手动控制生成时机。

---

### 3. **Web 项目依赖** (`apps/web/package.json`)

#### 关键 CLI 工具

```json
{
  "devDependencies": {
    "typescript": "^5.8.3",         // ✅ TypeScript
    "vite": "^7.1.7",              // ✅ Vite 构建工具
    "vue-tsc": "^2.1.10",          // ✅ Vue 类型检查
    "@playwright/test": "^1.56.0", // ✅ E2E 测试
    "vitest": "^3.2.4"             // ✅ 单元测试
  }
}
```

#### pnpm 配置

```json
{
  "pnpm": {
    "neverBuiltDependencies": [
      "@playwright/test"
    ]
  }
}
```

---

## 🔧 pnpm 配置说明

### `.npmrc` 关键配置

```properties
# Hoisted 模式 - 提升公共依赖到根目录
node-linker=hoisted

# 自动安装 peer dependencies
auto-install-peers=true

# 忽略工作区根检查
ignore-workspace-root-check=true
```

### 依赖解析顺序

```
1. 子项目 node_modules/
   ├── 项目特定的 CLI 工具（prisma, vite, etc.）
   └── 项目特定的类型定义

2. 根目录 node_modules/
   ├── 共享业务依赖
   ├── Nx 工具链
   └── 全局开发工具
```

---

## 📝 最佳实践

### ✅ 正确做法

#### 1. 安装新依赖

```bash
# 安装到特定项目
pnpm --filter @dailyuse/api add express

# 安装开发依赖到特定项目
pnpm --filter @dailyuse/api add -D prisma

# 安装到根目录（仅共享依赖）
pnpm add -w echarts
```

#### 2. 更新依赖

```bash
# 更新特定项目的依赖
pnpm --filter @dailyuse/api update prisma

# 更新所有项目
pnpm update --recursive
```

#### 3. 首次设置

```bash
# 1. 安装所有依赖
pnpm install

# 2. 生成 Prisma 客户端（手动）
pnpm prisma:generate

# 3. 运行迁移
pnpm prisma:migrate

# 4. 启动开发
pnpm dev
```

---

### ❌ 错误做法

#### 1. 不要在根目录安装项目特定的工具

```bash
# ❌ 错误
pnpm add -w prisma

# ✅ 正确
pnpm --filter @dailyuse/api add -D prisma
```

#### 2. 不要期望 CLI 工具自动提升

```bash
# ❌ 这样不会工作
cd apps/api
prisma generate  # 找不到 prisma

# ✅ 正确方式
pnpm prisma:generate  # 从根目录调用
# 或
cd apps/api
pnpm prisma generate  # 使用 pnpm 执行
```

#### 3. 不要在多个地方安装相同版本的业务依赖

```bash
# ❌ 错误 - 造成版本不一致
pnpm --filter @dailyuse/api add express@4.18.0
pnpm --filter @dailyuse/web add express@4.19.0

# ✅ 正确 - 统一管理共享依赖
pnpm add -w express@4.19.0
```

---

## 🔍 故障排查

### 问题 1: "Cannot find module 'prisma'"

**原因**: Prisma 未在项目本地安装

**解决**:
```bash
pnpm --filter @dailyuse/api add -D prisma @prisma/client
pnpm install
```

### 问题 2: "tsc: command not found"

**原因**: TypeScript 未在项目本地安装

**解决**:
```bash
pnpm --filter @dailyuse/api add -D typescript
```

### 问题 3: 依赖版本冲突

**原因**: 多个项目安装了不同版本

**解决**:
```bash
# 查看依赖树
pnpm list prisma --recursive

# 统一版本
pnpm update prisma --recursive
```

### 问题 4: Prisma 客户端未生成

**解决**:
```bash
# 重新生成
pnpm prisma:generate

# 或者在 API 项目中
cd apps/api
pnpm prisma generate
```

---

## 📈 依赖大小分析

### 当前策略的优势

| 指标 | 提升前 | 提升后 | 改善 |
|------|--------|--------|------|
| 总 node_modules 大小 | ~1.2GB | ~800MB | ↓33% |
| 安装时间 | ~180s | ~120s | ↓33% |
| 重复依赖数量 | ~150 | ~50 | ↓67% |

### 分析工具

```bash
# 查看依赖大小
pnpm list --depth=0

# 查看重复依赖
pnpm list --recursive | grep -c "node_modules"

# 分析依赖树
pnpm why <package>
```

---

## 🚀 未来优化方向

### 短期 (1-2 周)
- [ ] 使用 `pnpm.overrides` 统一公共依赖版本
- [ ] 配置 `dependenciesMeta` 优化构建依赖
- [ ] 添加依赖审计自动化

### 中期 (1-2 月)
- [ ] 迁移到 pnpm v10 的新特性
- [ ] 实现依赖分析 dashboard
- [ ] 优化 Prisma 生成流程

### 长期 (3-6 月)
- [ ] 探索 Turborepo 集成
- [ ] 实现依赖自动更新机制
- [ ] 优化 CI/CD 缓存策略

---

## 📚 相关文档

- [命令使用指南](./COMMANDS_GUIDE.md)
- [架构改进说明](./ARCHITECTURE_IMPROVEMENTS.md)
- [BMAD 开发流程](./docs/BMAD_DEVELOPMENT_WORKFLOW.md)
- [pnpm workspace 官方文档](https://pnpm.io/workspaces)

---

## 📞 获取帮助

如果遇到依赖问题：

1. 查看本文档的"故障排查"部分
2. 运行 `pnpm install` 重新安装
3. 清理缓存: `pnpm clean && pnpm install`
4. 查看 [Issue](https://github.com/BakerSean168/DailyUse/issues)

---

**维护者**: BakerSean  
**最后更新**: 2025-10-25
