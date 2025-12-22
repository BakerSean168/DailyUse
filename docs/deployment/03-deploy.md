# 🚀 部署到生产环境

**预计耗时**：15 分钟  
**适合**：运维人员或需要完整部署过程的开发者

---

## 前置条件

- ✅ 镜像已构建推送（见 [02-build.md](02-build.md)）
- ✅ Ubuntu 22.04 服务器（或其他 Linux）
- ✅ 服务器已安装：Docker, Docker Compose
- ✅ 防火墙规则已配置：22 (SSH), 80 (HTTP), 443 (HTTPS), 5432 (PostgreSQL)

---

## 第一步：准备服务器

### 连接到服务器
```bash
ssh root@your.server.ip
```

### 创建部署目录
```bash
mkdir -p /opt/dailyuse/{data,logs}
cd /opt/dailyuse

# 创建必需的目录
mkdir -p data/postgres
mkdir -p data/redis
mkdir -p logs/api
```

### 配置日志轮转
```bash
cat > /etc/logrotate.d/dailyuse << 'EOF'
/opt/dailyuse/logs/**/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
EOF
```

---

## 第二步：准备环境配置

### 创建 .env 文件
```bash
cat > /opt/dailyuse/.env << 'EOF'
# 应用基础设置
NODE_ENV=production
API_PORT=3000
API_HOSTNAME=0.0.0.0
LOG_LEVEL=warn

# 数据库
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=dailyuse
DATABASE_USER=postgres
DATABASE_PASSWORD=your_secure_password_here
DATABASE_URL=postgresql://postgres:your_secure_password_here@postgres:5432/dailyuse

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
CORS_CREDENTIALS=true

# 镜像信息
API_IMAGE=crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:latest
EOF

chmod 600 .env  # 安全权限
```

### 创建 docker-compose.prod.yml（如未存在）
```bash
# 从本地复制（如已有）
# scp docker-compose.prod.yml root@your.server.ip:/opt/dailyuse/
```

---

## 第三步：执行部署

### 方法 1：自动部署脚本（推荐）

**从本地开发机执行：**
```bash
cd d:\myPrograms\DailyUse

.\scripts\deploy-prod.ps1 `
  -ServerIP "your.server.ip" `
  -Version "v1.0.3"
```

脚本自动完成：
- ✓ SSH 连接验证
- ✓ 镜像拉取
- ✓ 容器启动
- ✓ 健康检查
- ✓ 日志验证

### 方法 2：手动部署

**在服务器上执行：**

```bash
cd /opt/dailyuse

# 1. 登录 Docker Registry
docker login crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com
# 输入用户名和密码

# 2. 拉取最新镜像
docker pull crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:latest

# 3. 停止旧容器
docker-compose -f docker-compose.prod.yml down

# 4. 启动新容器
docker-compose -f docker-compose.prod.yml up -d

# 5. 查看日志确认启动
docker-compose logs -f api
# 按 Ctrl+C 退出日志查看
```

---

## 第四步：验证部署

```bash
# 等待 30 秒让应用完全启动
sleep 30

# 检查容器运行状态
docker-compose ps
# 所有容器应该显示 healthy 或 Up

# 检查健康检查端点
curl http://localhost:3000/healthz
# 预期响应：
# {"status":"ok","uptime":123,"version":"1.0.3",...}

# 检查数据库连接
curl http://localhost:3000/api/health/db
# 预期：{"connected":true,"version":"14.5",...}

# 检查日志
docker-compose logs api | head -50
```

---

## 第五步：配置反向代理（Nginx）

### 创建 Nginx 配置
```bash
cat > /etc/nginx/sites-available/dailyuse << 'EOF'
upstream dailyuse_api {
    server localhost:3000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 日志
    access_log /var/log/nginx/dailyuse.access.log;
    error_log /var/log/nginx/dailyuse.error.log;

    # 代理设置
    location / {
        proxy_pass http://dailyuse_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

ln -s /etc/nginx/sites-available/dailyuse /etc/nginx/sites-enabled/

# 验证配置
nginx -t

# 重新加载
systemctl reload nginx
```

---

## 第六步：配置 SSL 证书（Let's Encrypt）

```bash
# 安装 Certbot
apt-get update && apt-get install -y certbot python3-certbot-nginx

# 申请证书
certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# 自动续期（cron）
certbot renew --dry-run  # 测试
crontab -e
# 添加行：0 3 * * * certbot renew --quiet
```

---

## ⚠️ 常见部署问题

### 镜像拉取失败
```bash
# 检查 Docker 登录
docker logout
docker login crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com

# 重试拉取
docker pull crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:latest
```

### 容器启动但无法连接
```bash
# 检查端口
netstat -tuln | grep 3000

# 检查防火墙
sudo ufw allow 3000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 检查日志
docker-compose logs api
```

### 数据库连接超时
```bash
# 检查 .env 中的数据库 URL
cat .env | grep DATABASE_URL

# 检查 PostgreSQL 容器
docker-compose logs postgres

# 重新初始化数据库
docker-compose down
rm -rf data/postgres/*
docker-compose up -d
sleep 10
docker-compose logs postgres
```

---

## 📋 部署检查清单

- [ ] 服务器已连接并配置
- [ ] .env 文件已创建并设置正确密码
- [ ] Docker 已登录
- [ ] 镜像成功拉取
- [ ] 容器成功启动（所有服务 healthy）
- [ ] 健康检查端点返回正确响应
- [ ] 数据库已初始化
- [ ] Nginx 反向代理已配置
- [ ] SSL 证书已安装
- [ ] CORS 域名在 .env 中配置正确

---

更多帮助见 [04-verify.md](04-verify.md) 和 [05-troubleshooting.md](05-troubleshooting.md)。
