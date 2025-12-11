# 🚀 DailyUse 升级计划 2025-12-11

## 📊 升级概览

### Phase 1: 清理未使用依赖 (5 min) ✅ COMPLETED
### Phase 2: 统一版本冲突 (10 min) ⏳  
### Phase 3: Electron 渐进式升级 (30 min) ⏳
### Phase 4: Node.js 升级 (10 min) ⏳
### Phase 5: 常规更新 (15 min) ⏳

---

## Phase 1: 清理未使用依赖 ✅

### 1.1 删除 Monaco Editor (未使用)
```bash
# 从 Web 项目删除
pnpm remove --filter @dailyuse/web monaco-editor monaco-editor-vue3
```

### 1.2 删除已废弃的包
```bash
# 删除 @types/bree (deprecated)
pnpm remove --filter @dailyuse/api @types/bree
```

**预计节省**: ~50 MB 磁盘空间

---

## Phase 2: 统一版本冲突 🔥

### 2.1 Zod 版本统一 (CRITICAL)
```bash
# API 项目从 3.25.76 升级到 4.1.13
pnpm --filter @dailyuse/api update zod@^4.1.13
pnpm --filter @dailyuse/contracts update zod@^4.1.13

# 统一根目录版本
pnpm update -w zod@^4.1.13
```

⚠️ **Breaking Changes**: Zod 3 → 4 有 API 变化，需要测试！

### 2.2 UUID 版本统一
```bash
# 统一到 13.0.0
pnpm update -r uuid@^13.0.0
```

### 2.3 Lucide-react 图标库统一
```bash
# 统一到最新版
pnpm update -r lucide-react@^0.560.0
```

### 2.4 @types/uuid 统一
```bash
# 统一到 11.0.0
pnpm update -r @types/uuid@^11.0.0
```

---

## Phase 3: Electron 渐进式升级 🖥️

### 当前状态分析
```
根目录 (devDependencies): electron@39.2.6 (已是最新)
Desktop (devDependencies): electron@30.5.1 (需升级)

Node.js 版本兼容性:
- Electron 30.x → Node.js 20.x
- Electron 33.x → Node.js 20.x (LTS)
- Electron 39.x → Node.js 22.21.1
```

### 3.1 Desktop 项目升级到 Electron 33 (LTS)
```bash
# Step 1: 升级到 Electron 33 (过渡版本)
pnpm --filter @dailyuse/desktop update electron@^33.0.2

# Step 2: 升级 electron-builder
pnpm --filter @dailyuse/desktop update electron-builder@^26.0.15

# Step 3: 测试构建
pnpm --filter @dailyuse/desktop build

# Step 4: 测试运行
pnpm --filter @dailyuse/desktop dev
```

### 3.2 检查 Breaking Changes
检查以下 Electron API 变更:
- [ ] `ipcRenderer` 使用方式
- [ ] `contextBridge` 配置
- [ ] Node.js 集成模式
- [ ] 本地存储 (better-sqlite3)

### 3.3 稳定后升级到 Electron 39
```bash
# 确认 Electron 33 稳定后
pnpm --filter @dailyuse/desktop update electron@^39.2.6

# 同步升级相关依赖
pnpm --filter @dailyuse/desktop update \
  @electron/rebuild@^4.0.2 \
  vite-plugin-electron@^0.29.0 \
  vite-plugin-electron-renderer@^0.14.5
```

### 3.4 测试清单
- [ ] 主进程启动正常
- [ ] 渲染进程通信正常
- [ ] IPC 通信正常
- [ ] SQLite 数据库读写正常
- [ ] 文件系统访问正常
- [ ] 自动更新机制正常
- [ ] 打包构建成功

---

## Phase 4: Node.js 升级 🟢

### 前置条件
✅ Electron 已升级到 39.2.6 (内置 Node.js 22.21.1)

### 4.1 升级 Node.js 到 24 LTS
```bash
# 1. 安装 Node.js 24.11.1 LTS
nvm install 24.11.1
nvm use 24.11.1

# 2. 更新 package.json 的 engines 字段
# 见下方配置
```

### 4.2 更新 @types/node
```bash
# ⚠️ 保持在 22.x，不要升级到 25.x
# 因为 Node.js 24 对应 @types/node@22.x
pnpm update -w @types/node@22.13.14

# 检查是否有 Node.js 24 的新 API 可用
```

### 4.3 测试兼容性
```bash
# 运行所有测试
pnpm test:run

# 运行所有构建
pnpm build

# 检查是否有废弃警告
node --trace-warnings
```

---

## Phase 5: 常规更新 📦

### 5.1 Nx 工具链升级
```bash
# Nx 21.4.1 → 22.2.0
pnpm nx migrate latest

# 应用迁移脚本
pnpm nx migrate --run-migrations

# 安装新依赖
pnpm install
```

### 5.2 Vitest 升级
```bash
# Vitest 3.2.4 → 4.0.15
pnpm update -r vitest@^4.0.15
pnpm update -r @vitest/ui@^4.0.15
pnpm update -r @vitest/coverage-v8@^4.0.15

# 检查配置文件是否需要更新
```

### 5.3 TypeScript 升级
```bash
# TypeScript 5.8.3 → 5.9.3
pnpm update -w typescript@~5.9.3

# 检查新的严格检查选项
```

### 5.4 小版本更新 (安全)
```bash
# 更新所有小版本和补丁版本
pnpm update -r --latest \
  date-fns \
  echarts \
  vue-echarts \
  marked \
  @milkdown/core \
  @milkdown/ctx \
  jspdf \
  prosemirror-view \
  @vueuse/core \
  sass-embedded \
  jiti
```

---

## ⚠️ 暂时不要升级的包

### 🔴 React 18 → 19 (重大变更)
```
react@18.3.1 → 19.2.1
react-dom@18.3.1 → 19.2.1
@types/react@18.3.27 → 19.2.7
@types/react-dom@18.3.7 → 19.2.3
```
**原因**: React 19 需要专门的迁移分支
- React Compiler 是可选的
- 新的 Actions API
- 废弃了一些旧 API
- UI 库(Shadcn/UI) 需要确认兼容性

### 🔴 Tailwind 3 → 4 (架构重写)
```
tailwindcss@3.4.18 → 4.1.17
```
**原因**: 配置方式完全改变，需要独立迁移
- 不再需要 `postcss.config.js`
- 配置全部移到 CSS 文件
- CLI 工具完全重写

### 🔴 Express 4 → 5 (中等变更)
```
express@4.22.1 → 5.2.1
@types/express@4.17.25 → 5.0.6
```
**原因**: Promise 错误处理机制改变
- 需要重新测试所有中间件
- 建议单独分支处理

### 🔴 Prisma 6 → 7 (重大变更)
```
prisma@6.19.0 → 7.1.0
@prisma/client@6.19.0 → 7.1.0
```
**原因**: Schema 语法可能有变化
- 需要重新生成 client
- 迁移脚本可能需要调整

---

## 📋 执行顺序建议

### Week 1: 清理 + 版本统一
```bash
# Day 1: 清理未使用依赖
pnpm remove --filter @dailyuse/web monaco-editor monaco-editor-vue3
pnpm remove --filter @dailyuse/api @types/bree

# Day 2-3: 统一版本冲突
pnpm update -r zod@^4.1.13
pnpm update -r uuid@^13.0.0
pnpm update -r lucide-react@^0.560.0
pnpm update -r @types/uuid@^11.0.0

# Day 4-5: 运行测试确保无 Breaking Changes
pnpm test:run
pnpm build
```

### Week 2: Electron 升级
```bash
# Day 1-2: 升级到 Electron 33 (LTS)
pnpm --filter @dailyuse/desktop update electron@^33.0.2
pnpm --filter @dailyuse/desktop build
pnpm --filter @dailyuse/desktop dev

# Day 3: 测试所有 Electron 功能

# Day 4-5: 升级到 Electron 39
pnpm --filter @dailyuse/desktop update electron@^39.2.6
pnpm --filter @dailyuse/desktop build
```

### Week 3: Node.js + 常规更新
```bash
# Day 1: 升级 Node.js 24
nvm install 24.11.1
nvm use 24.11.1

# Day 2: Nx 升级
pnpm nx migrate latest
pnpm nx migrate --run-migrations

# Day 3-4: Vitest + TypeScript
pnpm update -r vitest@^4.0.15
pnpm update -w typescript@~5.9.3

# Day 5: 小版本批量更新
pnpm update -r --latest <packages>
```

---

## ✅ 验证清单

### 每个 Phase 完成后执行:
```bash
# 1. 类型检查
pnpm typecheck

# 2. 单元测试
pnpm test:run

# 3. 构建验证
pnpm build

# 4. E2E 测试
pnpm e2e

# 5. 依赖审计
pnpm audit

# 6. 检查过时包
pnpm outdated
```

---

## 📊 预期结果

### 升级后的版本
```
Node.js: 22.20.0 → 24.11.1 ✅
Electron: 30.5.1 → 39.2.6 ✅
@types/node: 22.13.14 (保持)
TypeScript: 5.8.3 → 5.9.3 ✅
Nx: 21.4.1 → 22.2.0 ✅
Vitest: 3.2.4 → 4.0.15 ✅
Zod: 3.25.76 → 4.1.13 (统一) ✅
UUID: 11.1.0 → 13.0.0 (统一) ✅
```

### 节省空间
- Monaco Editor: ~50 MB
- 依赖去重: ~360 MB (已在之前清理完成)
- **总计**: ~410 MB

### 性能提升
- Electron 39: 更快的 Chromium 142
- Node.js 24: 更好的 V8 性能
- Vitest 4: 更快的测试执行
- Nx 22: 更智能的缓存

---

## 🚫 延后到专门分支的升级

创建以下独立分支处理:

1. `feat/upgrade-react-19` - React 生态升级
2. `feat/upgrade-tailwind-4` - Tailwind CSS 4 迁移
3. `feat/upgrade-express-5` - Express 5 迁移
4. `feat/upgrade-prisma-7` - Prisma 7 迁移

---

生成时间: 2025-12-11  
状态: 待执行  
预计总时间: 3 周 (分阶段)
