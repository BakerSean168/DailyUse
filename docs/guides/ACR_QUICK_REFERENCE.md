# ACR 快速参考

## 镜像信息

```
Registry:   crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com
Namespace:  bakersean
Region:     cn-hangzhou (杭州)
```

## 快速部署

### 1. 准备环境
```bash
cp .env.prod.example .env
# 编辑 .env，设置密码和 ACR 配置
```

### 2. 启动服务
```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

### 3. 检查状态
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

## 常用命令

```bash
# 查看镜像列表
docker images | grep crpi

# 构建和推送新版本
./build-and-push.ps1 -ACR -Tag v1.0.2 -Push

# 更新镜像版本
# 1. 修改 .env 中的 TAG=v1.0.2
# 2. 重启服务
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# 查看服务日志
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f postgres
docker compose -f docker-compose.prod.yml logs -f redis

# 进入容器
docker compose -f docker-compose.prod.yml exec api sh
docker compose -f docker-compose.prod.yml exec postgres psql -U dailyuse

# 清理停止的容器
docker compose -f docker-compose.prod.yml down -v  # 注意：会删除数据卷！
```

## docker-compose.prod.yml 配置

所有镜像都使用环境变量，自动从 `.env` 读取配置：

```yaml
# PostgreSQL - 从 ${REGISTRY}/${IMAGE_NAMESPACE}/postgres:16-alpine 拉取
postgres:
  image: ${REGISTRY:-docker.io}/${IMAGE_NAMESPACE:-bakersean}/postgres:16-alpine

# Redis - 从 ${REGISTRY}/${IMAGE_NAMESPACE}/redis:7-alpine 拉取  
redis:
  image: ${REGISTRY:-docker.io}/${IMAGE_NAMESPACE:-bakersean}/redis:7-alpine

# API - 从 ${REGISTRY}/${IMAGE_NAMESPACE:-dailyuse}/dailyuse-api:${TAG} 拉取
api:
  image: ${REGISTRY:-docker.io}/${IMAGE_NAMESPACE:-dailyuse}/dailyuse-api:${TAG:-v1.0.0}

# Web - 从 ${REGISTRY}/${IMAGE_NAMESPACE:-dailyuse}/dailyuse-web:${TAG} 拉取
web:
  image: ${REGISTRY:-docker.io}/${IMAGE_NAMESPACE:-dailyuse}/dailyuse-web:${TAG:-v1.0.0}
```

**环境变量优先级**：`.env` 文件 > 默认值

## .env.prod.example 中的 ACR 配置

```dotenv
# 使用 ACR 镜像仓库
REGISTRY=crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com
IMAGE_NAMESPACE=bakersean
TAG=v1.0.1

# PostgreSQL
DB_NAME=dailyuse
DB_USER=dailyuse
DB_PASSWORD=<强密码>
DB_PORT=5432

# Redis
REDIS_PASSWORD=<强密码>
REDIS_PORT=6379

# API
API_PORT=3000
API_LOG_LEVEL=info

# Web
WEB_PORT=8080

# 应用
NODE_ENV=production
```

## 已推送的镜像

### 应用镜像
- ✅ `crpi-.../bakersean/dailyuse-api:v1.0.1`
- ✅ `crpi-.../bakersean/dailyuse-web:v1.0.1`

### 基础镜像
- ✅ `crpi-.../bakersean/postgres:16-alpine` (395MB)
- ✅ `crpi-.../bakersean/redis:7-alpine` (60MB)
- ✅ `crpi-.../bakersean/nginx:alpine` (81MB)

## 故障排查

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 镜像拉取失败 | `.env` 未配置或错误 | 检查 REGISTRY 和 IMAGE_NAMESPACE |
| 容器启动失败 | 缺少密码环境变量 | 确保 DB_PASSWORD 和 REDIS_PASSWORD 已设置 |
| 慢速拉取 | 使用了 Docker Hub | 确认 REGISTRY 指向 ACR 地址 |
| 依赖服务未启动 | 健康检查失败 | 查看 `docker compose logs postgres` |

## 相关文档

- [完整部署指南](./ACR_DEPLOYMENT_GUIDE.md) - 详细的部署和配置说明
- [Docker 构建指南](./DOCKER_BUILD_GUIDE.md) - 深度讲解 Docker 构建原理
- [docker-compose.prod.yml](../../docker-compose.prod.yml) - 完整配置文件
- [.env.prod.example](../../.env.prod.example) - 环境变量示例
