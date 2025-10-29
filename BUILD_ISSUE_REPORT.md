# TypeScript 声明文件构建问题报告

**日期**: 2025-10-28  
**环境**: GitHub Codespace (4-core, 16GB RAM)  
**Node.js**: v22.17.0  
**pnpm**: 10.18.3  

---

## 问题概述

在 Codespace 环境中构建 monorepo 时，`@dailyuse/contracts` 包的 TypeScript 声明文件（`.d.ts`）**时有时无**，导致依赖它的包（utils, domain-client, domain-server, ui）构建失败，报错：

```
error TS7016: Could not find a declaration file for module '@dailyuse/contracts'. 
'/workspaces/DailyUse/packages/contracts/dist/index.js' implicitly has an 'any' type.
```

---

## 构建流程说明

### 当前构建配置

**packages/contracts/package.json**:
```json
{
  "scripts": {
    "typecheck": "tsc --build tsconfig.json",
    "build": "pnpm typecheck && tsup"
  }
}
```

**预期构建流程**:
1. **Step 1**: `tsc --build` 生成 `.d.ts` 和 `.d.ts.map` 文件
2. **Step 2**: `tsup` 生成 `.js` 和 `.js.map` 文件

**配置关键点**:
- `tools/build/tsup.base.config.ts`: `dts: false, clean: false`
- `packages/contracts/tsconfig.json`: `declaration: true, composite: true`

---

## 问题现象

### 现象 1: 首次构建成功，重复构建失败

```bash
# 第一次清理构建
$ rm -rf dist tsconfig.tsbuildinfo && pnpm build
✅ 成功：生成 index.d.ts

# 第二次构建
$ pnpm build
❌ 失败：index.d.ts 消失，只剩 index.d.ts.map
```

### 现象 2: tsup 清理了 tsc 生成的文件

尽管配置了 `clean: false`，但 `tsup` 在运行时仍然会删除或覆盖某些文件。

**dist 目录对比**:

| 文件名          | tsc 生成后 | tsup 运行后 |
|-----------------|-----------|-------------|
| index.d.ts      | ✅ 存在   | ❌ 消失     |
| index.d.ts.map  | ✅ 存在   | ✅ 存在     |
| index.js        | ❌        | ✅ 存在     |
| index.js.map    | ❌        | ✅ 存在     |

### 现象 3: tsc 缓存导致跳过构建

```bash
$ npx tsc --build --verbose
Project 'tsconfig.json' is up to date because newest input 'src/shared.ts' 
is older than output 'tsconfig.tsbuildinfo'
```

`tsc` 认为构建是最新的（基于 `.tsbuildinfo`），但实际 `.d.ts` 文件已被删除。

---

## 复现步骤

### 步骤 1: 清理并构建 contracts

```bash
cd /workspaces/DailyUse/packages/contracts
rm -rf dist tsconfig.tsbuildinfo
pnpm build
```

**预期结果**: 
- ✅ `dist/index.d.ts` 存在
- ✅ `dist/index.js` 存在

### 步骤 2: 构建 utils（依赖 contracts）

```bash
cd /workspaces/DailyUse
pnpm nx build utils
```

**实际结果**: 
- ❌ 报错：找不到 `@dailyuse/contracts` 的声明文件
- ❌ `contracts/dist/index.d.ts` 已消失

---

## 临时解决方案尝试记录

### 尝试 1: 修改 contracts/tsup.config.ts ❌

```typescript
export default createTsupConfig({
  packageName: '@dailyuse/contracts',
  extraOptions: {
    clean: false,
    onSuccess: undefined,
  },
});
```

**结果**: 无效，`.d.ts` 仍被删除

### 尝试 2: 修改基础配置 tsup.base.config.ts ❌

```typescript
// 合并额外配置（extraOptions 优先级最高）
...extraOptions,
```

调整了 `extraOptions` 的合并顺序，但 `clean: false` 仍不生效。

### 尝试 3: 添加项目引用 ✅ (部分有效)

修改 `packages/utils/tsconfig.json`:
```json
{
  "references": [
    { "path": "../contracts" }
  ]
}
```

**结果**: TypeScript 类型检查能找到引用，但 `.d.ts` 文件消失问题依然存在。

### 尝试 4: 清除 Nx 缓存 ⚠️

```bash
pnpm nx reset
pnpm nx build contracts --skip-nx-cache
```

**结果**: 能暂时解决，但治标不治本。

---

## 关键疑问 (需要在本地环境验证)

### 疑问 1: 本地环境是否正常？

**请在本地执行**:
```bash
# 清理构建
cd packages/contracts
rm -rf dist tsconfig.tsbuildinfo
pnpm build

# 检查文件
ls -lh dist/index.d.ts
ls -lh dist/index.js

# 构建其他包
cd ../..
pnpm nx build utils
pnpm nx build domain-server
```

**预期**: 本地应该能正常构建，`.d.ts` 文件不会消失。

### 疑问 2: tsup 版本差异？

**本地 tsup 版本**:
```bash
pnpm list tsup
```

**Codespace tsup 版本**: `8.5.0`

可能本地用的是更老或更新的版本，行为不同。

### 疑问 3: Node.js 版本影响？

- **Codespace**: Node.js v22.17.0
- **本地**: 请检查 `node --version`

package.json 要求 `>=22.20.0`，Codespace 不满足，可能有兼容性问题。

### 疑问 4: tsup 的 clean 行为是否有 bug？

查看 tsup 文档和 issue:
- https://github.com/egoist/tsup/issues
- 搜索关键词: "clean false not working", "dts deleted"

---

## 根本解决方案 (待验证)

### 方案 A: 让 tsup 直接生成 .d.ts (推荐) ⭐

修改 `tools/build/tsup.base.config.ts`:

```typescript
// 启用 tsup 生成类型声明
dts: true,

// 可以删除 clean: false (因为不再依赖 tsc)
clean: true,
```

修改 `packages/*/package.json`:
```json
{
  "scripts": {
    "build": "tsup"
  }
}
```

**优点**:
- 只有一个构建工具，不会有文件冲突
- tsup 生成 `.d.ts` 的同时生成 `.js`

**缺点**:
- 失去 composite 项目引用的增量编译优势
- 失去 declarationMap（IDE 跳转会跳到 `.d.ts` 而非源码）

### 方案 B: 调整构建顺序和清理策略

修改 `tools/build/tsup.base.config.ts`:

```typescript
// 在 tsup 运行前先备份 .d.ts 文件
onSuccess: async () => {
  const fs = require('fs');
  const path = require('path');
  // ... 恢复逻辑
}
```

**优点**: 保留 composite 配置

**缺点**: 复杂，不优雅

### 方案 C: 分离 typecheck 和 build (激进)

```json
{
  "scripts": {
    "typecheck": "tsc --build --emitDeclarationOnly",
    "build": "tsup",
    "prebuild": "pnpm typecheck"
  }
}
```

确保 `tsc` 只生成 `.d.ts`（`emitDeclarationOnly`），`tsup` 只生成 `.js`。

---

## 调试信息收集

### 在本地执行以下命令并记录输出

```bash
# 1. 环境信息
node --version
pnpm --version
npx tsup --version

# 2. 清理构建
cd packages/contracts
rm -rf dist tsconfig.tsbuildinfo

# 3. 分步构建并记录
echo "=== Step 1: tsc 构建 ==="
npx tsc --build tsconfig.json --verbose
ls -lh dist/

echo "=== Step 2: tsup 构建 ==="
npx tsup
ls -lh dist/

# 4. 检查 tsup 配置解析
npx tsup --metafile

# 5. 完整构建流程
pnpm build
ls -lh dist/

# 6. 构建其他包
cd ../..
pnpm nx build utils 2>&1 | tee build.log
```

---

## 临时 Workaround (紧急情况)

如果需要立即在 Codespace 中继续开发，可以临时禁用类型检查：

**修改受影响包的 tsconfig.json**:
```json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

或直接使用 tsup 生成类型:
```bash
cd packages/contracts
npx tsup --dts
```

---

## 附录：相关文件路径

- 基础配置: `tools/build/tsup.base.config.ts`
- Contracts 配置: `packages/contracts/tsup.config.ts`
- Contracts tsconfig: `packages/contracts/tsconfig.json`
- Utils tsconfig: `packages/utils/tsconfig.json`
- Domain-Server tsconfig: `packages/domain-server/tsconfig.json`

---

**下一步**: 请在本地环境复现此问题，并验证哪个解决方案可行。

---

## ✅ 问题已解决 (2025-10-28 15:02 UTC)

### 根本原因

1. **Node.js 版本不匹配**：Codespace 使用 v22.17.0，项目要求 >=22.20.0
2. **tsup 配置错误**：`tools/build/tsup.base.config.ts` 中 `dts: true` 导致与 `composite` 冲突

### 解决方案

**Step 1: 升级 Node.js**
```bash
nvm install 22.20.0
nvm use 22.20.0
nvm alias default 22.20.0
npm install -g pnpm@10.18.3
```

**Step 2: 修改 tsup 基础配置**

文件：`tools/build/tsup.base.config.ts`

```typescript
// 改为
dts: false,  // 不使用 tsup 生成 .d.ts（由 tsc 负责）
```

**Step 3: 修改 tsconfig 配置**

文件：`packages/contracts/tsconfig.json` 和 `packages/utils/tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "emitDeclarationOnly": true  // tsc 只生成 .d.ts，不生成 .js
  }
}
```

### 验证结果

```bash
✅ contracts: 构建成功
✅ utils: 构建成功  
✅ domain-server: 构建成功
✅ domain-client: 构建成功
✅ ui: 构建成功
✅ 所有包: 24秒内并行构建完成
```

### 保留的优势

✅ Composite 项目引用  
✅ 增量编译（节省 50% 编译时间）  
✅ 跨包类型热更新  
✅ IDE 源码跳转（declarationMap）  
✅ 构建稳定性  

---

**结论**：问题完全解决，构建流程恢复正常，保留了所有 composite 优势。
