# Electron 开发常见问题详解

本文档详细记录了在 DailyUse Desktop 开发过程中遇到的环境配置问题及其解决方案。

---

## 目录

1. [Electron 镜像配置问题](#1-electron-镜像配置问题)
2. [better-sqlite3 原生模块编译问题](#2-better-sqlite3-原生模块编译问题)
3. [ESM 模式下的 __dirname 问题](#3-esm-模式下的-__dirname-问题)

---

## 1. Electron 镜像配置问题

### 问题现象

```
Error: Electron failed to install correctly, please delete node_modules/electron and try installing again
```

运行 `pnpm install` 后，Electron 包虽然下载了，但是 Electron 的二进制文件（`electron.exe`）没有下载成功。

### 问题原因

Electron 的安装分为两个阶段：

1. **npm 包安装**：下载 `electron` 这个 npm 包（JavaScript 代码）
2. **二进制文件下载**：Electron 的 `postinstall` 脚本会从 GitHub Releases 下载对应平台的二进制文件

```
Electron 安装流程
┌─────────────────────────────────────────────────────────────┐
│  pnpm install                                                │
│      │                                                       │
│      ▼                                                       │
│  ┌─────────────────────────────────────┐                    │
│  │ 阶段1: 下载 npm 包                   │                    │
│  │ 来源: registry.npmmirror.com        │ ✅ 成功             │
│  └─────────────────────────────────────┘                    │
│      │                                                       │
│      ▼                                                       │
│  ┌─────────────────────────────────────┐                    │
│  │ 阶段2: postinstall 下载二进制文件    │                    │
│  │ 来源: github.com/electron/...       │ ❌ 网络问题失败      │
│  └─────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

由于 npm 包来自淘宝镜像（`registry.npmmirror.com`），下载很快。但是 Electron 二进制文件默认从 **GitHub Releases** 下载（`https://github.com/electron/electron/releases/download/...`），在国内网络环境下经常失败或超时。

### 解决方案

配置 Electron 专用镜像，让 `postinstall` 脚本从国内镜像下载二进制文件：

```bash
# 设置 Electron 镜像
pnpm config set electron_mirror "https://npmmirror.com/mirrors/electron/"

# 或者通过环境变量
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
```

### 配置说明

| 配置项 | 作用 | 默认值 | 推荐值 |
|--------|------|--------|--------|
| `registry` | npm 包下载地址 | `https://registry.npmjs.org` | `https://registry.npmmirror.com` |
| `electron_mirror` | Electron 二进制下载地址 | GitHub Releases | `https://npmmirror.com/mirrors/electron/` |

### 验证安装

```bash
# 检查 Electron 二进制文件是否存在
Test-Path "node_modules\.pnpm\electron@30.5.1\node_modules\electron\dist\electron.exe"

# 手动重新运行 Electron 安装脚本
cd node_modules\.pnpm\electron@30.5.1\node_modules\electron
node install.js
```

---

## 2. better-sqlite3 原生模块编译问题

### 问题现象

```
Error: Could not locate the bindings file. Tried:
 → .../better-sqlite3/build/better_sqlite3.node
 → .../better-sqlite3/build/Release/better_sqlite3.node
 → .../better-sqlite3/lib/binding/node-v123-win32-x64/better_sqlite3.node
```

应用启动时，`better-sqlite3` 找不到编译好的 `.node` 文件。

### 什么是原生模块（Native Module）

Node.js 原生模块是使用 C/C++ 编写的扩展模块，需要编译成特定平台的二进制文件（`.node` 文件）才能使用。

```
原生模块 vs 纯 JavaScript 模块

┌─────────────────────────────────────────────────────────────┐
│  纯 JavaScript 模块 (如 lodash)                             │
│  ┌─────────────┐                                            │
│  │ index.js    │ ──────────────► Node.js 直接执行           │
│  └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  原生模块 (如 better-sqlite3)                               │
│  ┌─────────────┐    编译      ┌──────────────────────┐      │
│  │ C++ 源码    │ ─────────►  │ better_sqlite3.node  │      │
│  │ src/*.cpp   │   (node-gyp) │ (平台特定二进制)      │      │
│  └─────────────┘              └──────────────────────┘      │
│                                        │                    │
│                                        ▼                    │
│                               Node.js 通过 N-API 调用       │
└─────────────────────────────────────────────────────────────┘
```

### 为什么需要重新编译

**问题核心**：Node.js 和 Electron 使用不同的 V8 引擎版本和 ABI（应用二进制接口）。

```
版本不匹配问题

┌─────────────────────────────────────────────────────────────┐
│  系统 Node.js v22.20.0                                      │
│  ├── V8 版本: 12.4.x                                        │
│  └── ABI 版本: 123 (node-v123)                              │
│                                                              │
│  Electron v30.5.1 (内置 Node.js v20.16.0)                   │
│  ├── V8 版本: 11.8.x                                        │
│  └── ABI 版本: 121 (electron-v121)                          │
└─────────────────────────────────────────────────────────────┘

pnpm install 时:
  better-sqlite3 针对系统 Node.js (ABI 123) 编译 ✅

Electron 运行时:
  Electron 期望 ABI 121 的模块 ❌ → 加载失败！
```

当你运行 `pnpm install` 时，原生模块会针对你**系统的 Node.js 版本**编译。但是 Electron 应用运行时使用的是 **Electron 内置的 Node.js**，两者的 ABI 不兼容，导致模块加载失败。

### 什么是"重新编译"

重新编译是指使用 `electron-rebuild` 工具，针对 **Electron 的 Node.js 版本**重新编译原生模块：

```bash
# 重新编译 better-sqlite3
pnpm exec electron-rebuild -f -w better-sqlite3
```

这个命令做了以下事情：

1. **检测 Electron 版本**：读取 `node_modules/electron/package.json`
2. **下载对应的 Node.js 头文件**：从 `electronjs.org` 下载
3. **使用 node-gyp 重新编译**：编译出兼容 Electron 的 `.node` 文件
4. **替换原有的编译产物**：更新 `build/Release/` 目录

```
重新编译流程

┌─────────────────────────────────────────────────────────────┐
│  electron-rebuild -f -w better-sqlite3                       │
│                                                              │
│  1. 检测 Electron 版本                                       │
│     └── electron@30.5.1 → Node ABI: 121                     │
│                                                              │
│  2. 下载 Electron Node.js 头文件                             │
│     └── https://electronjs.org/headers/v30.5.1/...          │
│                                                              │
│  3. 使用 node-gyp 重新编译                                   │
│     └── node-gyp rebuild --target=30.5.1 --arch=x64         │
│                                                              │
│  4. 生成 Electron 兼容的 .node 文件                          │
│     └── build/Release/better_sqlite3.node (ABI 121)         │
└─────────────────────────────────────────────────────────────┘
```

### 常见原生模块

| 模块名 | 用途 | 是否需要 electron-rebuild |
|--------|------|--------------------------|
| `better-sqlite3` | SQLite 数据库 | ✅ 是 |
| `sharp` | 图片处理 | ✅ 是 |
| `node-pty` | 终端模拟 | ✅ 是 |
| `fsevents` | macOS 文件监听 | ✅ 是 |
| `bcrypt` | 密码哈希 | ✅ 是 |

### 自动化配置

在 `package.json` 中添加 postinstall 脚本：

```json
{
  "scripts": {
    "postinstall": "electron-rebuild -f -w better-sqlite3"
  }
}
```

---

## 3. ESM 模式下的 __dirname 问题

### 问题现象

```
ReferenceError: __dirname is not defined
    at createWindow (file:///D:/.../main-B6VZI-n2.js:28463:35)
```

在创建 Electron 窗口时，使用 `__dirname` 获取当前目录路径失败。

### 问题原因

Node.js 有两种模块系统：

| 特性 | CommonJS (CJS) | ECMAScript Modules (ESM) |
|------|----------------|-------------------------|
| 文件扩展名 | `.js`, `.cjs` | `.mjs`, `.js` (type: module) |
| 导入语法 | `require()` | `import` |
| 导出语法 | `module.exports` | `export` |
| `__dirname` | ✅ 内置可用 | ❌ 不可用 |
| `__filename` | ✅ 内置可用 | ❌ 不可用 |
| `require` | ✅ 可用 | ❌ 不可用 |
| `import.meta.url` | ❌ 不可用 | ✅ 可用 |

```
CommonJS vs ESM

┌─────────────────────────────────────────────────────────────┐
│  CommonJS (传统方式)                                         │
│                                                              │
│  // main.js                                                  │
│  const path = require('path');                               │
│  console.log(__dirname);  // ✅ /path/to/directory          │
│  console.log(__filename); // ✅ /path/to/directory/main.js  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ESM (现代方式)                                              │
│                                                              │
│  // main.mjs 或 "type": "module" 的 .js 文件                │
│  import path from 'path';                                    │
│  console.log(__dirname);  // ❌ ReferenceError               │
│  console.log(__filename); // ❌ ReferenceError               │
│                                                              │
│  // 但是有 import.meta.url                                   │
│  console.log(import.meta.url);                               │
│  // ✅ file:///path/to/directory/main.mjs                   │
└─────────────────────────────────────────────────────────────┘
```

### 为什么项目使用 ESM

1. **Vite 默认使用 ESM**：Vite 构建工具默认输出 ESM 格式
2. **现代 JavaScript 标准**：ESM 是 ECMAScript 官方模块系统
3. **Tree Shaking 支持**：ESM 支持静态分析，便于移除未使用的代码
4. **顶层 await**：ESM 支持在模块顶层使用 `await`

### 解决方案

使用 `import.meta.url` 和 `fileURLToPath` 来获取等效的 `__dirname`：

```typescript
// main.ts
import path from 'path';
import { fileURLToPath } from 'url';

// ESM 兼容的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 现在可以正常使用了
const preloadPath = path.join(__dirname, 'preload.mjs');
```

### 工作原理

```
URL 转换流程

import.meta.url
  │
  │  "file:///D:/myPrograms/DailyUse/apps/desktop/dist-electron/main.js"
  │
  ▼
fileURLToPath(import.meta.url)
  │
  │  "D:\\myPrograms\\DailyUse\\apps\\desktop\\dist-electron\\main.js"
  │
  ▼
path.dirname(__filename)
  │
  │  "D:\\myPrograms\\DailyUse\\apps\\desktop\\dist-electron"
  │
  ▼
__dirname ✅
```

### 完整示例

```typescript
/**
 * Electron Main Process Entry Point
 * ESM 兼容版本
 */

import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM 兼容的 __dirname 和 __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // 使用 __dirname 构建路径
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // 使用 __dirname 构建路径
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(createWindow);
```

---

## 总结

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| Electron 安装失败 | 二进制文件从 GitHub 下载失败 | 配置 `electron_mirror` 使用国内镜像 |
| better-sqlite3 加载失败 | Node.js ABI 版本不匹配 | 使用 `electron-rebuild` 重新编译 |
| `__dirname` 未定义 | ESM 模式不提供内置变量 | 使用 `import.meta.url` + `fileURLToPath` |

### 推荐的项目配置

```json
// package.json
{
  "scripts": {
    "postinstall": "electron-rebuild -f -w better-sqlite3"
  }
}
```

```bash
# .npmrc 或 pnpm 全局配置
registry=https://registry.npmmirror.com/
electron_mirror=https://npmmirror.com/mirrors/electron/
```

---

**文档创建日期**: 2025-01-16  
**适用版本**: Electron 30.x, better-sqlite3 11.x, Node.js 22.x
