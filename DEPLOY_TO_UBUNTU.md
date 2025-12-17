# DailyUse Ubuntu 服务器部署指南

## 一、服务器准备（Ubuntu 20.04/22.04）

### 1.1 安装 Docker 和 Docker Compose

```bash
# 更新包列表
sudo apt update

# 安装依赖
sudo apt install -y ca-certificates curl gnupg lsb-release

# 添加 Docker 官方 GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 添加 Docker 仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 启动 Docker 并设置开机自启
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
docker compose version
```

### 1.2 配置 Docker 用户权限（可选）

```bash
# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER

# 重新加载用户组（需要退出并重新登录生效）
newgrp docker

# 测试权限
docker ps
```

### 1.3 配置防火墙（UFW）

```bash
# 启用防火墙
sudo ufw enable

# 允许 SSH（重要！避免被锁在外面）
sudo ufw allow 22

# 允许 HTTP 和 HTTPS
sudo ufw allow 80
sudo ufw allow 443

# 查看规则
sudo ufw status
```

---

## 二、域名配置

### 2.1 添加 DNS A 记录

在你的域名管理面板（如阿里云、腾讯云、Cloudflare）添加：

| 类型 | 主机记录 | 记录值 | TTL |
|------|---------|--------|-----|
| A | @ | 你的服务器IP | 600 |
| A | www | 你的服务器IP | 600 |
| A | api | 你的服务器IP | 600 |

**示例（你的域名 bakersean.top）：**
- `bakersean.top` → 你的服务器 IP
- `www.bakersean.top` → 你的服务器 IP
- `api.bakersean.top` → 你的服务器 IP（可选，如果需要单独 API 域名）

### 2.2 验证 DNS 解析

```bash
# 安装 dig 工具
sudo apt install -y dnsutils

# 验证解析
dig bakersean.top +short
dig www.bakersean.top +short
dig api.bakersean.top +short
```

---

## 三、部署应用

### 3.1 上传代码到服务器

**方案 A：使用 Git（推荐）**

```bash
# 在服务器上克隆代码
cd ~
git clone https://github.com/你的用户名/DailyUse.git
cd DailyUse
```

**方案 B：使用 scp 上传**

```bash
# 在本地打包（排除 node_modules）
tar --exclude='node_modules' --exclude='dist' --exclude='.git' -czf dailyuse.tar.gz .

# 上传到服务器
scp dailyuse.tar.gz your-user@your-server-ip:/home/your-user/

# 在服务器上解压
ssh your-user@your-server-ip
cd ~
mkdir DailyUse
tar -xzf dailyuse.tar.gz -C DailyUse
cd DailyUse
```

**方案 C：使用 rsync（最快）**

```bash
# 在本地执行
rsync -avz --exclude 'node_modules' \
           --exclude 'dist' \
           --exclude '.git' \
           --exclude '.nx' \
           -e ssh \
           . your-user@your-server-ip:~/DailyUse/
```

### 3.2 配置环境变量

```bash
cd ~/DailyUse

# 复制环境变量模板
cp .env.example .env

# 编辑配置（重要！）
nano .env  # 或使用 vim
```

**必须修改的关键配置：**

```bash
# 数据库密码（强密码）
DB_PASSWORD=你的超强密码123!@#

# JWT 密钥（长度建议 64+ 字符）
JWT_SECRET=一个非常长的随机字符串用于JWT签名请务必修改

# 生产环境标识
NODE_ENV=production

# 前端 API 配置（使用相对路径，由 Nginx 代理）
VITE_API_BASE_URL=/api/v1
VITE_API_URL=

# 域名配置
APP_DOMAIN=bakersean.top
```

保存并退出（nano 按 `Ctrl+X`，然后按 `Y`，再按 `Enter`）

### 3.3 构建并启动服务

```bash
# 构建镜像
docker compose -f docker-compose.prod.yml build

# 启动服务
docker compose -f docker-compose.prod.yml up -d

# 查看日志（确认启动成功）
docker compose -f docker-compose.prod.yml logs -f
```

**预期输出：**
```
dailyuse-prod-api    | Server started on port 3000
dailyuse-prod-db     | database system is ready to accept connections
dailyuse-prod-web    | /docker-entrypoint.sh: Configuration complete
```

按 `Ctrl+C` 退出日志查看。

### 3.4 运行数据库迁移

```bash
# 等待 5-10 秒让容器完全启动
sleep 10

# 执行数据库迁移
docker compose -f docker-compose.prod.yml exec api pnpm prisma:migrate:deploy

# 或者生成 Prisma 客户端（如果需要）
docker compose -f docker-compose.prod.yml exec api pnpm prisma:generate
```

---

## 四、验证部署

### 4.1 检查容器状态

```bash
docker compose -f docker-compose.prod.yml ps
```

**预期输出：**
```
NAME                   STATUS
dailyuse-prod-db      Up 2 minutes (healthy)
dailyuse-prod-api     Up 2 minutes (healthy)
dailyuse-prod-web     Up 2 minutes
```

### 4.2 测试 API 健康检查

```bash
# 在服务器上测试
curl http://localhost:3000/health

# 从外部测试（替换为你的域名或 IP）
curl http://bakersean.top/api/health
```

**预期响应：**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-17T06:00:00.000Z"
}
```

### 4.3 访问 Web 应用

在浏览器中打开：
- http://bakersean.top （前端）
- http://bakersean.top/api/health （API 健康检查）

如果一切正常，你应该能看到登录页面！

---

## 五、配置 HTTPS（使用 Let's Encrypt）

### 5.1 方案 A：使用 Certbot（推荐）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d bakersean.top -d www.bakersean.top

# 自动续期测试
sudo certbot renew --dry-run
```

### 5.2 方案 B：使用 Nginx Proxy Manager（图形化界面）

修改 `docker-compose.prod.yml`：

```yaml
services:
  nginx-proxy-manager:
    image: jc21/nginx-proxy-manager:latest
    container_name: nginx-proxy-manager
    restart: always
    ports:
      - "80:80"
      - "81:81"  # 管理界面
      - "443:443"
    volumes:
      - nginx-data:/data
      - nginx-letsencrypt:/etc/letsencrypt
    environment:
      DB_SQLITE_FILE: "/data/database.sqlite"

  web:
    # 不再暴露 80 端口
    # ports:
    #   - "80:80"

volumes:
  nginx-data:
  nginx-letsencrypt:
```

然后：
1. 访问 `http://你的服务器IP:81`
2. 默认账号：`admin@example.com` / `changeme`
3. 添加 Proxy Host，配置 SSL 证书

---

## 六、常用运维命令

### 6.1 容器管理

```bash
# 查看日志
docker compose -f docker-compose.prod.yml logs -f [service-name]

# 重启服务
docker compose -f docker-compose.prod.yml restart [service-name]

# 停止所有服务
docker compose -f docker-compose.prod.yml down

# 更新代码后重新部署
git pull
docker compose -f docker-compose.prod.yml up -d --build

# 清理未使用的镜像
docker system prune -a
```

### 6.2 数据库管理

```bash
# 连接到数据库
docker compose -f docker-compose.prod.yml exec postgres psql -U dailyuse -d dailyuse

# 备份数据库
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U dailyuse dailyuse > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker compose -f docker-compose.prod.yml exec -T postgres psql -U dailyuse dailyuse < backup.sql
```

### 6.3 查看资源使用

```bash
# 实时查看容器资源
docker stats

# 查看磁盘使用
df -h
docker system df
```

---

## 七、故障排查

### 7.1 Web 前端无法连接 API

**症状：** 浏览器控制台显示 `ERR_CONNECTION_REFUSED` 或 `timeout`

**排查步骤：**

1. 检查 API 容器是否启动：
```bash
docker compose -f docker-compose.prod.yml ps api
docker compose -f docker-compose.prod.yml logs api
```

2. 检查 API 健康：
```bash
curl http://localhost:3000/health
```

3. 检查 Nginx 配置：
```bash
docker compose -f docker-compose.prod.yml exec web cat /etc/nginx/nginx.conf
```

4. 确认环境变量：
```bash
cat .env | grep VITE_API
```

### 7.2 数据库连接失败

**症状：** API 日志显示 `ECONNREFUSED` 或 `password authentication failed`

**排查步骤：**

1. 检查数据库容器：
```bash
docker compose -f docker-compose.prod.yml logs postgres
```

2. 验证连接：
```bash
docker compose -f docker-compose.prod.yml exec postgres pg_isready
```

3. 检查密码：
```bash
cat .env | grep DB_PASSWORD
```

### 7.3 端口被占用

**症状：** 启动时报错 `port is already allocated`

**解决方法：**

```bash
# 查看占用端口的进程
sudo netstat -tulpn | grep :80
sudo lsof -i :80

# 停止占用端口的服务
sudo systemctl stop nginx  # 如果有系统 nginx
sudo systemctl disable nginx
```

---

## 八、性能优化建议

### 8.1 数据库优化

```bash
# 增加 PostgreSQL 内存配置
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U dailyuse -c "ALTER SYSTEM SET shared_buffers = '256MB';"
```

### 8.2 启用 CDN（可选）

使用 Cloudflare 或阿里云 CDN 加速静态资源：
1. 将域名 DNS 托管到 Cloudflare
2. 启用 CDN 和 HTTPS
3. 配置缓存规则

### 8.3 监控和日志

```bash
# 安装 Portainer（Docker 图形化管理）
docker volume create portainer_data
docker run -d -p 9000:9000 \
  --name=portainer --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest

# 访问 http://你的IP:9000
```

---

## 九、安全清单

- [ ] 修改 `.env` 中的所有默认密码
- [ ] 禁用 PostgreSQL 的外部访问（不暴露 5432 端口）
- [ ] 配置 UFW 防火墙
- [ ] 配置 HTTPS（Let's Encrypt）
- [ ] 定期更新系统和 Docker 镜像
- [ ] 设置自动备份数据库
- [ ] 配置日志轮转（防止磁盘满）
- [ ] 监控服务器资源（CPU、内存、磁盘）

---

## 十、快速命令参考

```bash
# 一键部署
cd ~/DailyUse && \
cp .env.example .env && \
nano .env && \
docker compose -f docker-compose.prod.yml up -d --build && \
docker compose -f docker-compose.prod.yml logs -f

# 一键停止
docker compose -f docker-compose.prod.yml down

# 一键更新
git pull && \
docker compose -f docker-compose.prod.yml up -d --build

# 一键备份数据库
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U dailyuse dailyuse > ~/backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 需要帮助？

- 查看日志：`docker compose -f docker-compose.prod.yml logs -f`
- 检查容器：`docker compose -f docker-compose.prod.yml ps`
- 重启服务：`docker compose -f docker-compose.prod.yml restart`

**常见问题文档：** [DEPLOYMENT.md](./DEPLOYMENT.md)
