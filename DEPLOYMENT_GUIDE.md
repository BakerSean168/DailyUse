# 🚀 DailyUse 服务器部署指南

> 单服务器全栈部署方案（PostgreSQL + Redis + API + Web + Nginx Proxy Manager）

---

## 📋 目录

- [部署架构](#部署架构)
- [服务器要求](#服务器要求)
- [部署步骤](#部署步骤)
- [Nginx Proxy Manager 配置](#nginx-proxy-manager-配置)
- [运维管理](#运维管理)
- [故障排查](#故障排查)

---

## 🏗 部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                         互联网                               │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS (443)
                       │
            ┌──────────▼──────────┐
            │ Nginx Proxy Manager │  (反向代理 + SSL 证书)
            │   docker.io:81      │
            └──────────┬──────────┘
                       │
       ┌───────────────┼───────────────┐
       │ 内网 HTTP     │               │ 内网 HTTP
       │ :8080         │               │ :3000
       │               │               │
┌──────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
│ Web 前端    │ │ API 后端  │ │ 基础设施    │
│ (Nginx)     │ │ (Node.js) │ │             │
│ dailyuse-   │ │ dailyuse- │ │ PostgreSQL  │
│ web:v1.0.0  │ │ api:v1.0.0│ │ :5432       │
└─────────────┘ └─────┬─────┘ │             │
                      │        │ Redis       │
                      │        │ :6379       │
                      └────────►             │
                               └─────────────┘
                          dailyuse-network (内部网络)
```

---

## 💻 服务器要求

### 最低配置
- **CPU**: 2 核
- **内存**: 4GB
- **磁盘**: 40GB SSD
- **操作系统**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **网络**: 公网 IP + 域名（用于 HTTPS）

### 推荐配置
- **CPU**: 4 核
- **内存**: 8GB
- **磁盘**: 80GB SSD
- **带宽**: 5Mbps+

### 软件依赖
- Docker 20.10+
- Docker Compose 2.0+
- (可选) Git

---

## 📦 部署步骤

### 第 1 步：安装 Docker 和 Docker Compose

```bash
# 安装 Docker（Ubuntu/Debian）
curl -fsSL https://get.docker.com | bash
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker compose version

# 重新登录以应用用户组权限
exit
# 重新 SSH 登录
```

### 第 2 步：安装 Nginx Proxy Manager（推荐）

Nginx Proxy Manager (NPM) 是一个图形化的反向代理和 SSL 证书管理工具，比手动配置 Nginx 简单得多。

```bash
# 创建 NPM 目录
sudo mkdir -p /opt/nginx-proxy-manager
cd /opt/nginx-proxy-manager

# 创建 docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  app:
    image: 'jc21/nginx-proxy-manager:latest'
    restart: unless-stopped
    ports:
      - '80:80'      # HTTP（自动重定向到 HTTPS）
      - '81:81'      # NPM 管理界面
      - '443:443'    # HTTPS
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
networks:
  default:
    name: nginx-proxy-manager
    external: false
EOF

# 启动 NPM
docker compose up -d

# 查看日志
docker compose logs -f
```

**首次登录 NPM 管理界面：**
- 访问: `http://your-server-ip:81`
- 默认账号: `admin@example.com`
- 默认密码: `changeme`
- 登录后立即修改密码和邮箱

### 第 3 步：部署 DailyUse 应用

```bash
# 创建项目目录
sudo mkdir -p /opt/dailyuse
cd /opt/dailyuse

# 方式 A：从 Git 仓库拉取（推荐）
git clone https://github.com/yourname/dailyuse.git .

# 方式 B：手动上传文件
# 将以下文件上传到服务器的 /opt/dailyuse 目录:
# - docker-compose.prod.yml
# - .env.prod.example

# 创建配置文件
cp .env.prod.example .env

# 编辑配置文件（必须修改密码和域名！）
nano .env
```

**编辑 `.env` 文件示例：**

```bash
# 镜像配置
REGISTRY=docker.io
IMAGE_NAMESPACE=dailyuse          # 替换为你的 Docker Hub 用户名
TAG=v1.0.0

# 数据库配置（生成强密码）
DB_NAME=dailyuse
DB_USER=dailyuse
DB_PASSWORD=$(openssl rand -base64 32)    # 替换为实际密码

# Redis 配置（生成强密码）
REDIS_PASSWORD=$(openssl rand -base64 32)  # 替换为实际密码

# JWT 密钥（生成强密钥）
JWT_SECRET=$(openssl rand -hex 64)         # 替换为实际密钥

# 端口配置（避免与 NPM 冲突）
API_PORT=3000
WEB_PORT=8080      # 使用 8080 避免与 NPM 的 80 端口冲突

# CORS 配置（替换为你的实际域名）
CORS_ORIGIN=https://yourdomain.com

# 前端 API 地址（替换为你的实际域名）
VITE_API_URL=https://api.yourdomain.com
```

### 第 4 步：启动应用

```bash
cd /opt/dailyuse

# 拉取最新镜像
docker compose -f docker-compose.prod.yml --env-file .env pull

# 启动所有服务
docker compose -f docker-compose.prod.yml --env-file .env up -d

# 查看服务状态
docker compose -f docker-compose.prod.yml ps

# 查看日志
docker compose -f docker-compose.prod.yml logs -f
```

**预期输出：**
```
NAME                    IMAGE                                  STATUS
dailyuse-prod-api       dailyuse/dailyuse-api:v1.0.0           Up (healthy)
dailyuse-prod-db        postgres:16-alpine                     Up (healthy)
dailyuse-prod-redis     redis:7-alpine                         Up (healthy)
dailyuse-prod-web       dailyuse/dailyuse-web:v1.0.0           Up (healthy)
```

### 第 5 步：初始化数据库（首次部署）

```bash
# 进入 API 容器
docker exec -it dailyuse-prod-api sh

# 运行 Prisma 数据库迁移
cd /app
npx prisma migrate deploy

# 如果有初始数据脚本，运行种子数据
npx prisma db seed   # 可选

# 退出容器
exit
```

---

## 🔒 Nginx Proxy Manager 配置

### 1. 配置 Web 前端反向代理

1. 登录 NPM 管理界面: `http://your-server-ip:81`
2. 点击 **"Proxy Hosts"** → **"Add Proxy Host"**
3. 填写配置:

   **Details 标签:**
   - **Domain Names**: `yourdomain.com` (和 `www.yourdomain.com`)
   - **Scheme**: `http`
   - **Forward Hostname/IP**: `dailyuse-prod-web` (容器名) 或 `172.20.0.5` (容器 IP)
   - **Forward Port**: `80`
   - **Cache Assets**: ✅ 开启
   - **Block Common Exploits**: ✅ 开启
   - **Websockets Support**: ❌ 关闭

   **SSL 标签:**
   - ✅ **Request a new SSL Certificate**
   - **Email**: 你的邮箱（用于 Let's Encrypt 通知）
   - ✅ **Force SSL** (强制 HTTPS)
   - ✅ **HTTP/2 Support**
   - ✅ **HSTS Enabled** (推荐)

4. 点击 **Save**，等待 Let's Encrypt 证书签发（约 30 秒）

### 2. 配置 API 后端反向代理

1. 点击 **"Add Proxy Host"**
2. 填写配置:

   **Details 标签:**
   - **Domain Names**: `api.yourdomain.com`
   - **Scheme**: `http`
   - **Forward Hostname/IP**: `dailyuse-prod-api`
   - **Forward Port**: `3000`
   - **Cache Assets**: ❌ 关闭（API 响应动态生成）
   - **Block Common Exploits**: ✅ 开启
   - **Websockets Support**: ✅ 开启（如果 API 使用 WebSocket/SSE）

   **Custom Locations（可选）:**
   如果需要为 API 的不同路径设置不同的缓存策略:
   - Location: `/healthz`
   - Forward Scheme: `http`
   - Forward Host: `dailyuse-prod-api`
   - Forward Port: `3000`

   **SSL 标签:**
   - ✅ **Request a new SSL Certificate**
   - ✅ **Force SSL**
   - ✅ **HTTP/2 Support**
   - ✅ **HSTS Enabled**

3. 点击 **Save**

### 3. 验证部署

```bash
# 测试 Web 前端
curl -I https://yourdomain.com
# 应返回 200 OK

# 测试 API 健康检查（K8s Liveness Probe）
curl https://api.yourdomain.com/healthz
# 应返回 {"status":"ok"}

# 测试 API 就绪检查（K8s Readiness Probe，包含依赖检查）
curl https://api.yourdomain.com/readyz
# 应返回 {"status":"ok","checks":{"database":{"status":"ok","latencyMs":...}},"timestamp":"..."}

# 查看应用信息
curl https://api.yourdomain.com/info
# 应返回版本、环境、运行时间等信息
```

---

## 🛠 运维管理

### 查看服务状态

```bash
cd /opt/dailyuse

# 查看容器状态
docker compose -f docker-compose.prod.yml ps

# 查看资源使用情况
docker stats --no-stream

# 查看实时日志
docker compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker compose -f docker-compose.prod.yml logs -f api
```

### 更新应用到新版本

```bash
cd /opt/dailyuse

# 1. 修改 .env 文件中的 TAG
nano .env
# TAG=v1.0.1

# 2. 拉取新镜像
docker compose -f docker-compose.prod.yml --env-file .env pull

# 3. 重启服务（零停机更新可用 Docker Swarm 或 K8s）
docker compose -f docker-compose.prod.yml --env-file .env up -d

# 4. 验证新版本
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api
```

### 数据库备份

```bash
# 备份数据库到文件
docker exec dailyuse-prod-db pg_dump -U dailyuse dailyuse > backup_$(date +%Y%m%d_%H%M%S).sql

# 压缩备份文件
gzip backup_*.sql

# 恢复数据库
docker exec -i dailyuse-prod-db psql -U dailyuse dailyuse < backup.sql
```

### 定期清理

```bash
# 清理未使用的镜像、容器、网络
docker system prune -a --volumes

# 仅清理停止的容器和未使用的网络
docker container prune
docker network prune
```

---

## 🔍 故障排查

### 问题 1: 容器无法启动

```bash
# 查看容器日志
docker compose -f docker-compose.prod.yml logs api

# 检查容器状态
docker compose -f docker-compose.prod.yml ps

# 进入容器内部调试
docker exec -it dailyuse-prod-api sh
```

**常见原因:**
- 环境变量配置错误（检查 `.env` 文件）
- 端口冲突（修改 `.env` 中的端口配置）
- 数据库连接失败（检查 `DATABASE_URL`）

### 问题 2: Nginx 502 Bad Gateway

```bash
# 检查 API 容器是否运行
docker ps | grep dailyuse-prod-api

# 检查 API 健康状态
docker compose -f docker-compose.prod.yml ps api

# 查看 API 日志
docker compose -f docker-compose.prod.yml logs api

# 测试 API 内部端口
curl http://localhost:3000/health
```

**常见原因:**
- API 容器未启动或健康检查失败
- NPM 中配置的 Forward Hostname/IP 错误
- API 容器内部端口不是 3000

### 问题 3: 数据库连接失败

```bash
# 检查数据库容器状态
docker compose -f docker-compose.prod.yml ps postgres

# 进入数据库容器测试连接
docker exec -it dailyuse-prod-db psql -U dailyuse -d dailyuse

# 查看数据库日志
docker compose -f docker-compose.prod.yml logs postgres
```

**常见原因:**
- `DB_PASSWORD` 在 `.env` 中配置错误
- 数据库未完成初始化（等待健康检查通过）
- `DATABASE_URL` 格式错误

### 问题 4: SSL 证书签发失败

**常见原因:**
- 域名 DNS 未正确指向服务器 IP（检查 A 记录）
- 80/443 端口被防火墙屏蔽（检查服务器防火墙和云服务商安全组）
- Let's Encrypt 速率限制（每周最多签发 50 个证书）

**解决方法:**
```bash
# 检查 DNS 解析
nslookup yourdomain.com

# 检查端口是否开放
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# 查看 NPM 日志
cd /opt/nginx-proxy-manager
docker compose logs -f
```

### 问题 5: 前端显示白屏或资源 404

**检查 Nginx 配置:**
```bash
# 查看镜像内的 nginx.conf
docker run --rm dailyuse/dailyuse-web:v1.0.0 cat /etc/nginx/nginx.conf

# 检查 dist 文件是否存在
docker run --rm dailyuse/dailyuse-web:v1.0.0 ls -la /usr/share/nginx/html
```

**常见原因:**
- `nginx.conf` 中 `root` 指令位置错误（应在 `server` 块顶层）
- 镜像构建时未正确复制 `dist/` 目录

---

## 📚 参考资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Nginx Proxy Manager 文档](https://nginxproxymanager.com/)
- [Let's Encrypt 文档](https://letsencrypt.org/docs/)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [Redis 文档](https://redis.io/docs/)

---

## 🆘 获取帮助

如遇到问题，请提供以下信息：

1. **服务器环境**:
   ```bash
   docker --version
   docker compose version
   uname -a
   ```

2. **服务状态**:
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```

3. **日志输出**:
   ```bash
   docker compose -f docker-compose.prod.yml logs --tail=100
   ```

4. **配置文件**（隐藏敏感信息）:
   ```bash
   cat .env | sed 's/PASSWORD=.*/PASSWORD=***/' | sed 's/SECRET=.*/SECRET=***/'
   ```
