# DailyUse 部署指南

这份指南将帮助你部署 DailyUse 应用到生产环境。

## 📋 目录结构

```
├── Dockerfile.api              # API 服务的 Docker 镜像构建配置
├── Dockerfile.web              # Web 前端的 Docker 镜像构建配置  
├── nginx.conf                  # Nginx 配置文件（Web 前端）
├── docker-compose.yml          # 开发环境 Docker Compose 配置
├── docker-compose.prod.yml     # 生产环境 Docker Compose 配置
├── .env.example                # 环境变量示例文件
├── apps/
│   ├── api/
│   │   ├── dist/              # API 构建产物
│   │   ├── prisma/            # 数据库迁移文件
│   │   └── .env               # API 环境变量
│   └── web/
│       └── dist/              # Web 构建产物
└── DEPLOYMENT.md              # 此文件
```

## 🚀 快速开始

### 前提条件

- Docker 和 Docker Compose（版本 3.8+）
- 至少 2GB 的可用磁盘空间
- 网络连接

### 1. 准备环境变量

```bash
# 复制示例文件
cp .env.example .env

# 编辑 .env 文件，修改关键配置
nano .env  # 或使用你喜欢的编辑器
```

关键变量说明：

| 变量 | 说明 | 默认值 | 生产环境注意 |
|------|------|--------|-----------|
| `NODE_ENV` | 运行环境 | `production` | 必须是 `production` |
| `DB_PASSWORD` | 数据库密码 | `postgres` | ⚠️ **必须修改** |
| `JWT_SECRET` | JWT 密钥 | `your-secret-key` | ⚠️ **必须修改** |
| `VITE_API_URL` | API 地址 | `http://localhost:3000` | 修改为实际地址 |

### 2. 启动应用

**开发环境：**
```bash
docker-compose up -d
```

**生产环境：**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3. 验证部署

```bash
# 检查容器状态
docker-compose ps

# 查看日志
docker-compose logs -f api      # API 日志
docker-compose logs -f web      # Web 日志

# 测试 API 健康检查
curl http://localhost:3000/health

# 访问前端
open http://localhost
```

## 📊 服务说明

### API 服务 (Port 3000)

- **映射端口**: 3000
- **健康检查**: `http://localhost:3000/health`
- **环境**: Node.js 20 (Alpine)
- **入口**: `dist/index.js`

**主要功能**：
- RESTful API 服务
- 数据库连接管理
- 认证和授权
- WebSocket 支持（如果配置）

### Web 服务 (Port 80)

- **映射端口**: 80（可改为其他端口）
- **健康检查**: `http://localhost/index.html`
- **环境**: Nginx (Alpine)
- **根目录**: `/usr/share/nginx/html`

**特性**：
- Vue 3 单页应用（SPA）
- 自动 SPA 路由支持
- Gzip 压缩
- 缓存优化
- CORS 支持

### 数据库 (PostgreSQL)

- **映射端口**: 5432（开发）/ 5432（生产）
- **初始用户**: `postgres`
- **数据库名**: `dailyuse`
- **持久化**: Docker 命名卷 `postgres_prod_data`

## 🔧 常见操作

### 查看日志

```bash
# 实时日志
docker-compose logs -f api

# 查看最近 100 行
docker-compose logs --tail=100 api

# 保存日志到文件
docker-compose logs api > api.log
```

### 数据库操作

```bash
# 进入数据库容器
docker-compose exec postgres psql -U postgres -d dailyuse

# 运行迁移
docker-compose exec api pnpm prisma:migrate:deploy

# 重置数据库（谨慎使用！）
docker-compose exec api pnpm prisma:reset
```

### 停止和移除

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（警告：会删除所有数据）
docker-compose down -v
```

### 更新应用

```bash
# 重新构建镜像
docker-compose build --no-cache

# 重新启动服务
docker-compose up -d
```

## 📈 性能优化

### API 性能

1. **连接池配置** (`.env`)
   ```
   DATABASE_POOL_MIN=5
   DATABASE_POOL_MAX=20
   ```

2. **缓存策略**
   - 启用 Redis（如果配置）
   - 使用数据库查询缓存

3. **监控日志**
   ```bash
   docker-compose logs api | grep "ERROR\|WARN"
   ```

### Web 性能

1. **启用 HTTPS**
   - 配置 SSL 证书
   - 在 Nginx 中启用 HTTPS

2. **CDN 集成**
   - 将 `/assets` 目录指向 CDN
   - 使用 CloudFlare 等 CDN 服务

3. **预加载资源**
   - 在 `index.html` 中添加预加载标签
   - 优化关键资源加载顺序

## 🔐 安全建议

### 环境变量安全

```bash
# ❌ 不要这样做
echo "JWT_SECRET=mysecret" > .env

# ✅ 正确做法
# 使用安全的密钥管理服务（如 HashiCorp Vault）
# 或在容器编排平台中使用 secrets（Kubernetes Secrets）
```

### 网络安全

```bash
# 启用防火墙
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 使用 fail2ban 防止暴力破解
sudo apt-get install fail2ban
```

### 定期备份

```bash
# 备份数据库
docker-compose exec postgres pg_dump -U postgres dailyuse > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U postgres dailyuse < backup.sql
```

## 📱 HTTPS/SSL 配置

如需启用 HTTPS，修改 `nginx.conf`：

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... 其他配置
}

# 重定向 HTTP 到 HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

然后更新 docker-compose：

```yaml
volumes:
  - /path/to/ssl/certs:/etc/nginx/ssl:ro
```

## 🐛 故障排除

### 常见问题

#### 1. 连接被拒绝

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**解决**：确保 PostgreSQL 容器正在运行
```bash
docker-compose ps
docker-compose restart postgres
```

#### 2. 内存不足

```
Container exited with code 137
```

**解决**：增加容器内存限制

```yaml
deploy:
  resources:
    limits:
      memory: 1G
```

#### 3. 端口已被占用

```
port is already allocated
```

**解决**：修改 `.env` 中的端口或停止占用该端口的进程

```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

### 健康检查失败

```bash
# 查看健康检查日志
docker-compose logs api | grep health

# 手动测试
curl -v http://localhost:3000/health
```

## 📊 监控和日志

### 使用 Docker 内置监控

```bash
# 查看资源使用
docker stats

# 查看容器详细信息
docker inspect dailyuse-prod-api
```

### 使用第三方工具

推荐使用：
- **Prometheus**: 指标收集
- **Grafana**: 可视化仪表板
- **ELK Stack**: 日志管理（Elasticsearch + Logstash + Kibana）
- **Sentry**: 错误追踪

## 🚀 自动部署

### GitHub Actions 示例

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /app/dailyuse
            docker-compose pull
            docker-compose up -d
```

## 📞 获取帮助

- 查看日志：`docker-compose logs -f api`
- 检查配置：`cat .env`
- 测试连接：`curl -v http://localhost:3000/health`
- 查看文档：https://github.com/yourusername/dailyuse

---

**最后更新**: 2025-12-11
**版本**: 0.1.0
