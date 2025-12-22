# 完整部署步骤指南

## 环境配置重构后的部署流程

### 第一步：本地验证（开发环境）

```bash
# 1. 确保代码编译通过
pnpm nx run api:typecheck

# 2. 本地启动测试
cp .env.example .env.local
# 编辑 .env.local 配置数据库连接
pnpm nx serve api

# 验证应该看到：
# API server listening on http://0.0.0.0:3000
# ✅ Database connected successfully
```

### 第二步：构建新镜像

```bash
# 1. 更新版本号（更新 API_TAG）
# 编辑 docker-compose.prod.yml 或 .env.production：
# API_TAG=v1.0.3  (从 v1.0.2 升级)

# 2. 构建 API 镜像
docker build -t dailyuse-api:v1.0.3 -f Dockerfile.api .

# 3. 标记镜像用于推送
docker tag dailyuse-api:v1.0.3 crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:v1.0.3

# 4. 推送到阿里云 ACR
docker push crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:v1.0.3

# 验证推送成功：应该看到 Pushed
```

### 第三步：在生产服务器上准备配置

```bash
# 在服务器上 SSH 连接
ssh user@your-server

# 进入项目目录
cd /path/to/dailyuse-production

# 创建生产环境本地配置文件（包含敏感信息）
cat > .env.production.local << 'EOF'
# 数据库配置
DB_USER=dailyuse
DB_PASSWORD=your-strong-database-password
DB_NAME=dailyuse

# Redis 配置
REDIS_PASSWORD=your-strong-redis-password

# JWT 认证
JWT_SECRET=your-strong-jwt-secret-at-least-32-chars

# CORS 配置
CORS_ORIGIN=https://yourdomain.com

# 其他配置（可选）
LOG_LEVEL=info
OPENAI_API_KEY=sk-your-key (如果使用 AI 功能)
EOF

# 确保只有 root 或部署用户可以读取
chmod 600 .env.production.local
```

### 第四步：更新镜像版本并重新部署

```bash
# 更新 docker-compose.prod.yml 中的 API_TAG
# 方式1：修改文件
sed -i 's/API_TAG=v1.0.2/API_TAG=v1.0.3/g' docker-compose.prod.yml

# 方式2：或者使用环境变量（更推荐）
export API_TAG=v1.0.3
export REGISTRY=crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com
export IMAGE_NAMESPACE=bakersean

# 停止旧容器
docker-compose -f docker-compose.prod.yml --env-file .env.production.local down

# 拉取最新镜像
docker-compose -f docker-compose.prod.yml --env-file .env.production.local pull

# 启动新容器
docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d

# 查看日志验证启动成功
docker-compose -f docker-compose.prod.yml --env-file .env.production.local logs -f api
```

### 第五步：验证部署成功

```bash
# 1. 检查容器状态
docker-compose -f docker-compose.prod.yml ps

# 输出应该显示所有容器都在运行：
# dailyuse-prod-api        Up
# dailyuse-prod-web        Up
# postgres                  Up
# redis                     Up

# 2. 测试健康检查端点
curl http://localhost:3000/healthz
# 应该返回: {"status":"ok"}

# 3. 检查数据库连接
curl http://localhost:3000/readyz
# 应该返回: {"status":"ok","database":"connected"}

# 4. 查看应用信息
curl http://localhost:3000/info
# 应该返回完整的应用信息和版本号

# 5. 查看日志
docker-compose -f docker-compose.prod.yml --env-file .env.production.local logs api | tail -50
```

---

## 快速参考：关键变更

### 新增的环境变量文件
```
.env                    # 共享默认值
.env.production         # 生产环境默认值（可提交）
.env.production.local   # 生产环境敏感配置（.gitignore）
```

### 环境变量加载优先级
```
.env 
  → .env.production （NODE_ENV=production 时）
  → .env.production.local （本地敏感信息）
```

### Docker 启动命令变更

**旧方式：**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**新方式（推荐）：**
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d
```

---

## 常见问题

### Q1: 为什么要重新构建镜像？
**A:** 因为：
- 添加了新依赖 `dotenv-expand`
- 修改了 API 启动逻辑和路由
- 新的环境变量验证系统需要在容器内运行

### Q2: 能否只更新代码而不重建镜像？
**A:** 不行。Docker 镜像是完整的快照，包含依赖和代码。需要重建才能更新。

### Q3: 旧版本容器可以继续运行吗？
**A:** 旧版本（v1.0.2）会继续运行，但需要停止后才能启动新版本（否则端口冲突）。

### Q4: 如何回滚到旧版本？
**A:** 
```bash
# 停止新版本
docker-compose -f docker-compose.prod.yml down

# 修改 docker-compose.prod.yml 中 API_TAG=v1.0.2
# 或使用环境变量 export API_TAG=v1.0.2

# 重新启动旧版本
docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d
```

### Q5: 构建失败怎么办？
**A:**
```bash
# 1. 检查本地编译
pnpm nx run api:typecheck

# 2. 清理 Docker 缓存后重建
docker builder prune
docker build -t dailyuse-api:v1.0.3 -f Dockerfile.api . --no-cache

# 3. 检查 Docker 日志
docker build -t dailyuse-api:v1.0.3 -f Dockerfile.api . --progress=plain
```

---

## 版本管理

### 当前版本历史
- v1.0.1 - 初始版本
- v1.0.2 - 添加基础设施路由
- **v1.0.3** - 环境配置系统重构（当前）

### 版本号升级规则
- **大版本** (1.x.x): 重大功能变更或不兼容改动
- **次版本** (x.1.x): 新增功能，向后兼容
- **修订版本** (x.x.1): Bug 修复或环境配置变更

---

## 监控和告警

部署后建议监控以下指标：

```bash
# 1. 容器资源使用
docker stats dailyuse-prod-api

# 2. API 响应时间
for i in {1..10}; do
  curl -w "Time: %{time_total}s\n" http://localhost:3000/healthz
  sleep 1
done

# 3. 错误日志
docker-compose -f docker-compose.prod.yml logs api | grep -i error

# 4. 数据库连接状态
curl http://localhost:3000/readyz | jq .

# 5. 性能指标
curl http://localhost:3000/metrics/json | jq '.stats'
```

---

## 参考资源

- [环境配置指南](./ENVIRONMENT_CONFIGURATION.md)
- [CORS 配置指南](./CORS_CONFIGURATION.md)
- [docker-compose.prod.yml](../docker-compose.prod.yml)
- [Dockerfile.api](../Dockerfile.api)
