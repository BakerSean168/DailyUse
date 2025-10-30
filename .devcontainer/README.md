# DailyUse Development Container 配置

此目录包含 GitHub Codespaces 和 VS Code Dev Containers 的完整配置。

## 📦 包含内容

### 1. **devcontainer.json**
主配置文件，定义：
- 基础镜像: `mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm`
- Node.js 版本: 22.20.0
- 必需的 VS Code 扩展
- 端口转发配置
- MCP 工具集成

### 2. **post-create.sh**
容器创建后自动执行的脚本：
- 安装 pnpm@10.18.3
- 安装项目依赖
- 配置 Git
- 创建必要目录
- 设置环境变量

### 3. **mcp-config.json**
Model Context Protocol (MCP) 服务器配置：
- **nx-mcp-server**: Nx 工作区管理
- **playwright-mcp**: 浏览器自动化
- **chrome-devtools**: Chrome DevTools 集成

## 🚀 使用方法

### 方式 1: GitHub Codespaces
1. 在 GitHub 仓库页面点击 "Code" → "Codespaces" → "New codespace"
2. 等待环境自动构建（约 3-5 分钟）
3. 环境就绪后会自动运行 post-create.sh

### 方式 2: VS Code Dev Containers
1. 安装 "Dev Containers" 扩展
2. 克隆仓库到本地
3. 打开 VS Code，按 `F1`
4. 运行命令: "Dev Containers: Reopen in Container"
5. 等待容器构建完成

## 🔧 环境详情

### 系统环境
- OS: Ubuntu 24.04 LTS
- Node.js: 22.20.0
- npm: 10.9.3
- pnpm: 10.18.3
- Docker: 已安装 (Docker-in-Docker)
- Git: 最新版本
- GitHub CLI: 最新版本

### VS Code 扩展
- ✅ GitHub Copilot + Copilot Chat
- ✅ Copilot MCP (Model Context Protocol)
- ✅ Nx Console (Nx 工作区管理)
- ✅ Vue - Volar (Vue 3 支持)
- ✅ Prettier (代码格式化)
- ✅ 中文语言包
- ✅ GitHub Actions
- ✅ Pull Request 管理

### 端口转发
| 端口 | 用途 | 自动转发 |
|------|------|----------|
| 3000 | API Server (Production) | 通知 |
| 3001 | API Dev Server | 通知 |
| 5173 | Web Frontend (Vite) | 通知 |
| 5432 | PostgreSQL Database | 静默 |

## 📚 快速开始命令

```bash
# 启动 API 开发服务器
pnpm exec nx run api:dev

# 启动 Web 前端
pnpm exec nx run web:dev

# 构建所有项目
pnpm exec nx run-many --target=build --all

# 运行测试
pnpm exec nx run-many --target=test --all

# 查看项目依赖图
pnpm exec nx graph

# 运行受影响的测试
pnpm exec nx affected:test
```

## 🛠️ MCP 工具使用

配置中已集成 3 个 MCP 服务器：

### 1. Nx MCP Server
```
用途: Nx 工作区管理
功能:
  - 查看项目结构
  - 运行 Nx 命令
  - 查看项目依赖
  - 生成器支持
```

### 2. Playwright MCP
```
用途: 浏览器自动化测试
功能:
  - E2E 测试执行
  - 页面交互
  - 截图和录屏
```

### 3. Chrome DevTools MCP
```
用途: Chrome 浏览器调试
功能:
  - 网络请求分析
  - 性能分析
  - Console 日志查看
```

## 🔐 环境变量

创建 `.env` 文件（容器会自动从 `.env.example` 复制）：

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dailyuse"
SHADOW_DATABASE_URL="postgresql://user:password@localhost:5432/dailyuse_shadow"

# JWT
JWT_SECRET="your-secret-key"

# Node Environment
NODE_ENV="development"
```

## 🐛 故障排除

### 问题 1: pnpm 安装失败
```bash
# 手动重新安装
npm install -g pnpm@10.18.3
pnpm install
```

### 问题 2: 端口被占用
```bash
# 查看占用端口的进程
lsof -i :3000
# 或
netstat -tulpn | grep 3000

# 杀死进程
kill -9 <PID>
```

### 问题 3: MCP 工具未加载
1. 重新加载 VS Code 窗口: `F1` → "Developer: Reload Window"
2. 检查扩展是否已安装: "automatalabs.copilot-mcp"
3. 查看输出面板: `View` → `Output` → 选择 "Copilot MCP"

### 问题 4: Git safe.directory 错误
```bash
git config --global --add safe.directory /workspaces/DailyUse
```

## 📝 自定义配置

### 修改 Node.js 版本
编辑 `devcontainer.json`:
```json
"features": {
  "ghcr.io/devcontainers/features/node:1": {
    "version": "20.10.0"  // 修改这里
  }
}
```

### 添加新的 VS Code 扩展
编辑 `devcontainer.json`:
```json
"extensions": [
  "existing.extension",
  "new.extension"  // 添加新扩展 ID
]
```

### 添加新的 MCP 服务器
编辑 `mcp-config.json`:
```json
"mcpServers": {
  "new-server": {
    "command": "npx",
    "args": ["-y", "@your/mcp-server"]
  }
}
```

## 🔄 更新配置

修改配置后需要重建容器：
1. `F1` → "Dev Containers: Rebuild Container"
2. 或关闭 Codespace 并创建新的

## 📖 相关文档

- [Dev Containers 官方文档](https://containers.dev/)
- [GitHub Codespaces 文档](https://docs.github.com/en/codespaces)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Nx 文档](https://nx.dev/)

---

**维护者**: DailyUse Team  
**最后更新**: 2025-10-30  
**配置版本**: v1.0
