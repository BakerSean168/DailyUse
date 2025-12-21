# ⚡ 快速升级到 v1.0.2

如果你在 v1.0.1 上遇到了 `ERR_MODULE_NOT_FOUND: Cannot find package '@prisma/client'` 错误，请立即按照以下步骤升级到 v1.0.2。

## 问题

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@prisma/client' imported from /app/dist/index.js
```

## 快速修复（5 分钟）

### 步骤 1：更新 .env 文件

编辑 `.env` 文件，修改 TAG 为 v1.0.2：

```bash
sed -i 's/TAG=v1.0.1/TAG=v1.0.2/' .env
```

或手动编辑 `.env`：

```dotenv
TAG=v1.0.2
```

### 步骤 2：重启服务

```bash
# 停止旧容器
docker compose -f docker-compose.prod.yml down

# 拉取新镜像（从 ACR）
docker compose -f docker-compose.prod.yml pull

# 启动新服务
docker compose -f docker-compose.prod.yml up -d

# 等待约 40 秒（健康检查）
sleep 40

# 检查状态
docker compose -f docker-compose.prod.yml ps
```

### 步骤 3：验证成功

```bash
# 所有容器应该显示 "healthy"
$ docker compose -f docker-compose.prod.yml ps
NAME                      STATUS
dailyuse-prod-db         Up 1 minute (healthy)
dailyuse-prod-redis      Up 1 minute (healthy)
dailyuse-prod-api        Up 1 minute (healthy) ✅
dailyuse-prod-web        Up 1 minute (healthy)

# 查看 API 日志确认启动成功
docker compose -f docker-compose.prod.yml logs api | tail -20
```

## 镜像详情

| 属性 | 值 |
|------|-----|
| 镜像地址 | `crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:v1.0.2` |
| 大小 | 2.05GB |
| Prisma | ✅ 已修复 |
| 依赖项 | ✅ 完整 |

## 发生了什么？

### v1.0.1 的问题
- Prisma client 生成逻辑不完善
- 导致运行时缺少必要的 Prisma 包

### v1.0.2 的改进
- ✅ 在 builder stage 完整生成 Prisma client
- ✅ production stage 中使用 `pnpm install --prod` 自动生成客户端
- ✅ 添加了保险的 fallback 机制
- ✅ 确保所有依赖完整可用

详见：[PRISMA_CLIENT_FIX_V1_0_2.md](./PRISMA_CLIENT_FIX_V1_0_2.md)

## 如果升级失败

### 错误：镜像拉取超时

```bash
# 检查网络和 ACR 连接
docker pull crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:v1.0.2

# 强制重新拉取
docker pull --no-cache crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:v1.0.2
```

### 错误：容器仍然启动失败

```bash
# 查看详细日志
docker compose -f docker-compose.prod.yml logs api -f

# 检查数据库是否健康
docker compose -f docker-compose.prod.yml logs postgres

# 检查 Redis 是否健康
docker compose -f docker-compose.prod.yml logs redis
```

### 紧急回滚到 v1.0.0

```bash
# 修改 .env
sed -i 's/TAG=v1.0.2/TAG=v1.0.0/' .env

# 重启
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

## 需要帮助？

查看完整文档：
- [ACR_DEPLOYMENT_GUIDE.md](./ACR_DEPLOYMENT_GUIDE.md) - 详细部署指南
- [PRISMA_CLIENT_FIX_V1_0_2.md](./PRISMA_CLIENT_FIX_V1_0_2.md) - 技术细节
- [ACR_QUICK_REFERENCE.md](./ACR_QUICK_REFERENCE.md) - 快速参考

---

**预计时间**：5 分钟
**风险等级**：🟢 低（只是更新镜像，数据库不受影响）
