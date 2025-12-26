# 多环境开发指南

本项目支持多种开发环境配置，允许你在本地开发时连接不同的后端服务。

## 环境配置文件

### 可用环境

- **`.env`** - 基础配置文件（所有环境都会加载）
- **`.env.development`** - 开发环境配置（本地后端，localhost:3888）
- **`.env.vps`** - VPS 环境配置（远程后端）
- **`.env.staging`** - 预发布环境配置
- **`.env.production`** - 生产环境配置

## 使用方法

### 方法 1：使用 pnpm 脚本（推荐）

在项目根目录运行以下命令：

```bash
# 使用本地后端开发
pnpm dev:web:local

# 使用 VPS 后端开发
pnpm dev:web:vps

# 使用预发布环境开发
pnpm dev:web:staging
```

### 方法 2：使用 Nx 命令

```bash
# 本地开发
pnpm nx dev web --configuration=local

# VPS 开发
pnpm nx dev web --configuration=vps

# 预发布开发
pnpm nx dev web --configuration=staging
```

### 方法 3：使用 PowerShell 脚本（Windows）

```powershell
# 本地开发
.\dev.ps1 -Environment local

# VPS 开发
.\dev.ps1 -Environment vps

# 预发布开发
.\dev.ps1 -Environment staging
```

### 方法 4：使用 Shell 脚本（Linux/macOS）

```bash
# 本地开发
./dev.sh local

# VPS 开发
./dev.sh vps

# 预发布开发
./dev.sh staging
```

## 配置详情

### 本地开发 (.env.development)

```env
VITE_API_BASE_URL=http://localhost:3888/api/v1
VITE_UPLOAD_BASE_URL=http://localhost:3888/api/v1/upload
VITE_LOG_LEVEL=debug
VITE_ENABLE_DEVTOOLS=true
```

**使用场景**：
- 本地启动后端服务（API 项目）
- 完整的开发体验，包括热重载和开发工具

**启动命令**：
```bash
# 终端 1：启动 API 后端
pnpm dev:api

# 终端 2：启动 Web 前端
pnpm dev:web:local
```

### VPS 开发 (.env.vps)

```env
VITE_API_BASE_URL=http://YOUR_VPS_IP:3888/api/v1
VITE_UPLOAD_BASE_URL=http://YOUR_VPS_IP:3888/api/v1/upload
VITE_LOG_LEVEL=info
VITE_ENABLE_DEVTOOLS=false
```

**使用场景**：
- 连接远程 VPS 上的后端服务
- 测试与生产环境相似的配置
- 团队协作开发，共享同一个后端实例

**配置步骤**：
1. 打开 `apps/web/.env.vps`
2. 将 `YOUR_VPS_IP` 替换为实际的 VPS IP 地址或域名
3. 运行开发服务器：`pnpm dev:web:vps`

### 预发布环境 (.env.staging)

```env
VITE_API_BASE_URL=https://staging-api.example.com/api/v1
VITE_UPLOAD_BASE_URL=https://staging-api.example.com/api/v1/upload
VITE_LOG_LEVEL=info
VITE_ENABLE_DEVTOOLS=false
```

**使用场景**：
- 测试即将上线的功能
- 在生产前进行最后的验证
- 演示给产品经理或客户

## 环境变量说明

### API 配置

| 变量 | 说明 | 示例 |
|------|------|------|
| `VITE_API_BASE_URL` | API 服务器地址 | `http://localhost:3888/api/v1` |
| `VITE_UPLOAD_BASE_URL` | 文件上传服务地址 | `http://localhost:3888/api/v1/upload` |

### 开发工具

| 变量 | 说明 | 值 |
|------|------|-----|
| `VITE_LOG_LEVEL` | 日志级别 | `debug` / `info` / `warn` / `error` |
| `VITE_ENABLE_DEVTOOLS` | 启用浏览器开发工具集成 | `true` / `false` |

## 切换环境

### 快速切换

在开发过程中，如果需要快速切换环境：

1. **停止当前开发服务器** (Ctrl+C)
2. **运行新的命令**：
   ```bash
   pnpm dev:web:vps
   ```
3. **浏览器会自动重新加载**

### 验证当前环境

打开浏览器控制台（F12），查看网络请求中的 API 地址：

```javascript
// 在浏览器控制台中查看
console.log(import.meta.env.VITE_API_BASE_URL)
```

## 常见问题

### Q: 如何添加新的环境？

1. 创建新的环境文件，如 `apps/web/.env.custom`
2. 在 `apps/web/project.json` 中的 `dev` target 添加新的 configuration：
   ```json
   "configurations": {
     "custom": {}
   }
   ```
3. 在 `package.json` 中添加脚本：
   ```json
   "dev:web:custom": "pnpm nx dev web --configuration=custom"
   ```

### Q: 为什么我的 API 请求失败？

1. 确认 API 服务器正在运行
2. 检查 API 地址是否正确：
   ```javascript
   console.log(import.meta.env.VITE_API_BASE_URL)
   ```
3. 检查浏览器网络标签，查看实际请求的 URL

### Q: VPS 地址经常变化，如何管理？

1. 在 `.env.vps` 中使用域名而不是 IP 地址
2. 或在 `.env.local` 中覆盖（该文件已被 gitignore）：
   ```bash
   # .env.local（不提交到 Git）
   VITE_API_BASE_URL=http://新的IP:3888/api/v1
   ```

### Q: 如何在生产构建时指定环境？

```bash
# 使用预发布配置构建
NODE_ENV=staging pnpm build:web

# 使用生产配置构建
NODE_ENV=production pnpm build:web
```

## 开发工作流示例

### 场景 1：与本地后端开发

```bash
# 终端 1 - 启动数据库
pnpm docker:dev:up

# 终端 2 - 启动 API 后端
pnpm dev:api

# 终端 3 - 启动 Web 前端
pnpm dev:web:local
```

### 场景 2：测试 VPS 部署的版本

```bash
# 连接到 VPS 后端，本地开发前端
pnpm dev:web:vps

# 在浏览器中测试新功能与远程后端的交互
```

### 场景 3：演示功能给产品经理

```bash
# 连接到预发布环境
pnpm dev:web:staging

# 使用最新的功能演示
```

## 最佳实践

1. **本地开发优先**：大部分开发工作应该使用 `dev:web:local`，这样最快
2. **定期测试 VPS**：在完成功能后，切换到 `dev:web:vps` 验证
3. **使用预发布环境**：上线前用 `dev:web:staging` 做最后检查
4. **记录常用配置**：在 `.env.local` 中保存个人偏好的配置（该文件已被忽略）

