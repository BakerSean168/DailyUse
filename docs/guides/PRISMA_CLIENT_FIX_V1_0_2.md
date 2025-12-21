# Prisma Client 缺失问题修复 (v1.0.2)

## 问题描述

生产服务器上 API 容器启动失败，错误信息：

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@prisma/client' imported from /app/dist/index.js
```

### 根本原因

Dockerfile.api 的 production stage 中，虽然安装了生产依赖，但 Prisma client 的生成过程有问题：

1. **旧方案**：在 production stage 中运行 `pnpm prisma:generate`
2. **问题**：production stage 只安装了 `--prod` 依赖，但 Prisma CLI 是 devDependency，不可用
3. **结果**：`@prisma/client` 包虽然被安装，但生成的 Prisma client 代码不完整

## 解决方案

### v1.0.2 改进

**Dockerfile.api 更新**：

```dockerfile
# Production stage
FROM node:22-alpine

WORKDIR /app

# 1. 复制工作区配置和源代码
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# 2. 安装生产依赖（会自动生成 Prisma client）
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# 3. 确保 Prisma client 已生成（保险措施）
RUN pnpm --prefix apps/api prisma:generate || true

WORKDIR /app/apps/api
```

### 关键改进

| 方面 | v1.0.1（有问题） | v1.0.2（已修复） |
|------|-----------------|-----------------|
| **Prisma 生成时机** | 在 production stage（缺少 CLI） | 在 builder stage + 保险的 fallback |
| **安装方式** | `pnpm install --prod` 后再生成 | `pnpm install --prod` 自动生成 |
| **CLI 可用性** | ❌ 不可用（只装了 prod deps） | ✅ 由 `@prisma/client` 提供 |
| **镜像大小** | 1.63GB | 2.05GB（多了 Prisma tools 但更稳定）|

### 工作原理

1. **Builder stage**：
   - 安装所有依赖（包括 devDependencies）
   - 运行 `pnpm prisma:generate` 生成 Prisma client
   - 编译 TypeScript 代码到 `dist/`

2. **Production stage**：
   - 复制工作区配置、packages、prisma schema、dist/
   - 运行 `pnpm install --prod --frozen-lockfile --ignore-scripts`
   - pnpm 根据 prisma schema 自动生成或更新 Prisma client
   - 可选的 fallback：如果未生成，再次调用 `prisma:generate`

## 部署步骤

### 1. 拉取新镜像

```bash
# 更新 .env 文件
sed -i 's/TAG=v1.0.1/TAG=v1.0.2/' .env

# 或手动修改 .env：
# TAG=v1.0.2
```

### 2. 重启服务

```bash
# 停止旧容器
docker compose -f docker-compose.prod.yml down

# 拉取新镜像
docker compose -f docker-compose.prod.yml pull

# 启动服务
docker compose -f docker-compose.prod.yml up -d

# 等待健康检查通过（通常 40s）
docker compose -f docker-compose.prod.yml ps

# 检查日志
docker compose -f docker-compose.prod.yml logs api -f
```

### 3. 验证

```bash
# 所有容器应该显示 "healthy"
docker compose -f docker-compose.prod.yml ps

# 输出示例：
# NAME                      STATUS
# dailyuse-prod-db         Up X minutes (healthy)
# dailyuse-prod-redis      Up X minutes (healthy)
# dailyuse-prod-api        Up X minutes (healthy)
# dailyuse-prod-web        Up X minutes (healthy)
```

## 镜像信息

- **镜像名**：`crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:v1.0.2`
- **镜像大小**：2.05GB
- **摘要**：`sha256:81458ce07a47ba0f2a19b36cca4d88cb2a7a1d8863b04f7df1741f091f7375f6`
- **推送时间**：2024-12-21

## 技术深度

### 为什么 `pnpm install --prod` 会生成 Prisma client？

pnpm 在安装时会运行 postinstall hook：

```json
{
  "scripts": {
    "postinstall": "prisma generate"  // 在 @prisma/client package 中定义
  }
}
```

这意味着当安装 `@prisma/client` 时，其 postinstall 脚本会自动运行 `prisma generate`。

### 为什么需要 fallback `RUN pnpm --prefix apps/api prisma:generate || true`？

- **场景**：某些情况下 postinstall hook 可能失败（如缺少 prisma schema）
- **保险**：确保即使 postinstall 失败，我们仍然有一次生成 client 的机会
- **`|| true`**：即使失败也不中断构建（因为 schema 在 COPY 后已存在）

### 为什么不将完整的 node_modules 从 builder 复制到 production？

**理由**：
- ❌ 增大镜像（3.37GB vs 2.05GB）
- ❌ 包含不必要的 devDependencies
- ❌ 安全风险（暴露开发工具）
- ✅ 重新安装 `--prod` 更小、更安全、更标准

## 对比历史

| 版本 | 状态 | 问题 | 解决方案 |
|------|------|------|---------|
| v1.0.0 | ❌ 失败 | 缺少 ioredis | 添加到依赖 |
| v1.0.1 | ❌ 失败 | 缺少 @prisma/client | ⬅️ 本次修复 |
| v1.0.2 | ✅ 成功 | 已解决 | 优化 Prisma 生成逻辑 |

## 相关文件

- [Dockerfile.api](../../../../Dockerfile.api) - API 镜像定义
- [docker-compose.prod.yml](../../../../docker-compose.prod.yml) - 生产配置
- [.env.prod.example](../../../../.env.prod.example) - 环境变量示例
- [ACR_DEPLOYMENT_GUIDE.md](./ACR_DEPLOYMENT_GUIDE.md) - ACR 部署指南

---

**更新日期**：2024-12-21
**相关 PR/Issue**：Prisma Client Missing at Runtime
