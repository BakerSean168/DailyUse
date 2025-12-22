#!/bin/bash
# 🚀 DailyUse 部署快速命令参考
# 保存此文件用于快速复制粘贴

# ============================================================================
# 【本地】第一步：验证编译（所有平台）
# ============================================================================

# 验证 TypeScript 编译
pnpm nx run api:typecheck

# 如果上面命令失败，尝试清除缓存后重试
rm -rf node_modules/.cache
pnpm nx run api:typecheck


# ============================================================================
# 【本地】第二步：构建并推送镜像
# ============================================================================

# Windows PowerShell
cd d:\myPrograms\DailyUse
.\deploy-prod.ps1 -Version v1.0.3

# 或手动步骤：
# 1. 登录阿里云
docker login crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com

# 2. 构建镜像
docker build -t dailyuse-api:v1.0.3 \
  -f Dockerfile.api \
  --build-arg NODE_ENV=production \
  --build-arg BUILD_VERSION=v1.0.3 \
  --build-arg BUILD_TIMESTAMP=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
  --build-arg GIT_COMMIT=$(git rev-parse --short HEAD) \
  .

# 3. 标记镜像
docker tag dailyuse-api:v1.0.3 \
  crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:v1.0.3
docker tag dailyuse-api:v1.0.3 \
  crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:latest

# 4. 推送镜像
docker push crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:v1.0.3
docker push crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:latest


# ============================================================================
# 【服务器】第三步：环境准备
# ============================================================================

# SSH 连接服务器
ssh user@your-server-ip

# 进入部署目录
cd /path/to/deployment

# 创建生产环境配置文件
cat > .env.production.local << 'EOF'
# 应用配置
NODE_ENV=production
API_PORT=3000
API_HOST=0.0.0.0
LOG_LEVEL=info
TZ=Asia/Shanghai

# 数据库配置
DATABASE_URL="postgresql://dailyuse:your-password@postgres:5432/dailyuse"
DB_NAME=dailyuse
DB_USER=dailyuse
DB_PASSWORD=your-password
DB_PORT=5432

# Redis 配置
REDIS_URL="redis://redis:6379/0"
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# JWT 配置
JWT_SECRET=your-very-long-and-strong-secret-key-minimum-32-characters
JWT_EXPIRY=7d
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRY=30d

# CORS 配置
CORS_ORIGIN="https://yourdomain.com,https://www.yourdomain.com"

# Docker 镜像版本
API_TAG=v1.0.3
WEB_TAG=v1.0.3
EOF

# 设置权限
chmod 600 .env.production.local

# 验证配置
cat .env.production.local


# ============================================================================
# 【服务器】第四步：停止旧服务
# ============================================================================

cd /path/to/deployment

# 停止所有容器
docker-compose -f docker-compose.prod.yml down

# 验证容器已停止
docker ps | grep dailyuse


# ============================================================================
# 【服务器】第五步：拉取新镜像
# ============================================================================

# 登录阿里云（如未登录）
docker login crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com

# 拉取新镜像
docker-compose -f docker-compose.prod.yml --env-file .env.production.local pull

# 验证镜像已拉取
docker image ls | grep dailyuse-api


# ============================================================================
# 【服务器】第六步：启动新服务
# ============================================================================

cd /path/to/deployment

# 启动服务
docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d

# 查看启动日志
docker-compose -f docker-compose.prod.yml logs -f --tail=100

# 等待应用初始化（30 秒）
sleep 30


# ============================================================================
# 【服务器】第七步：验证部署成功
# ============================================================================

# 查看容器状态（应全为 Up）
docker-compose -f docker-compose.prod.yml ps

# 健康检查
curl -v http://localhost:3000/healthz
# 预期：{"status":"ok","timestamp":"..."}

# 就绪检查
curl -v http://localhost:3000/readyz
# 预期：{"ready":true,"checks":{"database":"ok","redis":"ok"}}

# 应用信息
curl http://localhost:3000/api/info
# 预期：{"version":"v1.0.3","environment":"production",...}

# 查看 API 日志
docker-compose -f docker-compose.prod.yml logs api --tail=50

# 查看数据库日志
docker-compose -f docker-compose.prod.yml logs postgres --tail=20


# ============================================================================
# 【故障排查】常用命令
# ============================================================================

# 查看所有日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定容器日志
docker-compose -f docker-compose.prod.yml logs api -f
docker-compose -f docker-compose.prod.yml logs postgres -f
docker-compose -f docker-compose.prod.yml logs redis -f

# 进入容器（调试）
docker-compose -f docker-compose.prod.yml exec api sh
docker-compose -f docker-compose.prod.yml exec postgres psql -U dailyuse -d dailyuse

# 检查资源使用
docker stats

# 强制重启容器
docker-compose -f docker-compose.prod.yml restart api

# 重建镜像
docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d --build

# 查看环境变量
docker-compose -f docker-compose.prod.yml exec api env | grep -E "NODE_ENV|API_PORT|CORS"


# ============================================================================
# 【回滚】紧急回滚到旧版本
# ============================================================================

# 1. 停止新版本
docker-compose -f docker-compose.prod.yml down

# 2. 修改版本号
sed -i 's/API_TAG=v1.0.3/API_TAG=v1.0.2/g' .env.production.local

# 3. 拉取旧版本
docker-compose -f docker-compose.prod.yml --env-file .env.production.local pull

# 4. 启动旧版本
docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d

# 5. 验证
curl http://localhost:3000/api/info


# ============================================================================
# 【维护】常见维护命令
# ============================================================================

# 查看运行中的容器
docker-compose -f docker-compose.prod.yml ps

# 查看卷（持久数据）
docker volume ls | grep dailyuse

# 查看网络
docker network ls | grep dailyuse

# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 查看镜像信息
docker image inspect crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:v1.0.3


# ============================================================================
# 【监控】性能监控命令
# ============================================================================

# 实时资源监控
docker stats

# CPU 使用分布
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# 检查磁盘使用
df -h

# 查看 Docker 日志大小
docker ps -q | xargs docker inspect --format='{{.LogPath}}' | xargs ls -lh


# ============================================================================
# 【备份】数据库备份（生产重要！）
# ============================================================================

# 备份 PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U dailyuse -d dailyuse > backup-$(date +%Y%m%d-%H%M%S).sql

# 恢复 PostgreSQL
cat backup-20250111-120000.sql | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U dailyuse -d dailyuse


# ============================================================================
# 【文档参考】相关文档位置
# ============================================================================

# 快速部署：QUICK_DEPLOY.md
# 完整指南：BUILD_AND_DEPLOY.md
# 检查清单：DEPLOYMENT_CHECKLIST.md
# 部署就绪：DEPLOYMENT_READY.md
# 环境配置：docs/guides/ENVIRONMENT_CONFIGURATION.md
# CORS配置：docs/guides/CORS_CONFIGURATION.md
# 完整部署：docs/guides/DEPLOYMENT_GUIDE.md


# ============================================================================
# 【快速参考】关键信息
# ============================================================================

# 镜像仓库：crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com
# 命名空间：bakersean
# 镜像名：dailyuse-api
# 版本号：v1.0.3

# Docker Compose：docker-compose.prod.yml
# 配置文件：.env.production.local

# API 端口：3000
# 数据库：PostgreSQL (port 5432)
# 缓存：Redis (port 6379)

# 健康检查：/healthz
# 就绪检查：/readyz
# 应用信息：/api/info
