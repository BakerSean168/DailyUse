# ✅ 验证部署

**预计耗时**：5 分钟  
**适合**：所有人员（快速健康检查）

---

## 快速验证（必做）

### 1️⃣ 检查容器运行状态
```bash
docker-compose ps
```

**预期输出：**
```
NAME                COMMAND             STATUS              PORTS
dailyuse-api        node dist/index.js  Up (healthy)        0.0.0.0:3000->3000/tcp
postgres            postgres            Up (healthy)        5432/tcp
redis               redis-server        Up (healthy)        6379/tcp
```

**❌ 如果显示 "Exited" 或 "Unhealthy"：**
```bash
docker-compose logs api        # 查看错误信息
docker-compose down
docker-compose up -d
sleep 10
docker-compose ps              # 再次检查
```

---

### 2️⃣ 检查健康端点

```bash
# API 健康检查
curl http://localhost:3000/healthz
```

**✅ 成功响应示例：**
```json
{
  "status": "ok",
  "uptime": 1234,
  "timestamp": "2024-01-15T10:30:45.123Z",
  "version": "1.0.3",
  "environment": "production"
}
```

**❌ 失败处理：**
```bash
curl -i http://localhost:3000/healthz
# 状态码应该是 200，否则见下面的故障排除
```

---

### 3️⃣ 检查数据库连接

```bash
curl http://localhost:3000/api/health/db
```

**✅ 成功响应：**
```json
{
  "connected": true,
  "database": "dailyuse",
  "version": "14.5"
}
```

**❌ 如果返回 false：**
```bash
# 检查环境变量
grep DATABASE_URL /opt/dailyuse/.env

# 检查数据库日志
docker-compose logs postgres

# 检查网络连接
docker exec dailyuse-api ping postgres -c 1
```

---

### 4️⃣ 检查 Redis 连接

```bash
curl http://localhost:3000/api/health/redis
```

**✅ 成功响应：**
```json
{
  "connected": true,
  "version": "7.0",
  "used_memory": "1.5M"
}
```

---

## 详细验证（可选）

### 检查日志文件

```bash
# API 日志（最后 50 行）
docker-compose logs api | tail -50

# 所有容器日志
docker-compose logs | tail -100

# 实时日志查看（Ctrl+C 退出）
docker-compose logs -f api
```

### 检查磁盘占用

```bash
# 磁盘使用情况
docker system df

# 清理过期数据
docker system prune
docker image prune -a
```

### 检查网络连通性

```bash
# 测试容器间通信
docker exec dailyuse-api curl http://postgres:5432 -v

# 测试外部访问
curl -H "Host: yourdomain.com" http://localhost:3000/healthz

# 检查防火墙
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

## 性能基准

### 响应时间目标

| 端点 | 目标时间 | 检查命令 |
|------|--------|--------|
| `/healthz` | < 50ms | `curl -w "@curl-format.txt" http://localhost:3000/healthz` |
| `/api/health/db` | < 100ms | `for i in {1..10}; do curl http://localhost:3000/api/health/db; done` |
| `/api/users` | < 200ms | 根据查询复杂度 |

### 检查性能

```bash
# 使用 Apache Bench 进行负载测试
ab -n 100 -c 10 http://localhost:3000/healthz

# 预期：
# - Requests per second: 50+
# - Failed requests: 0
# - Longest request: < 200ms
```

---

## 端到端验证流程

### 测试账户创建
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }'
```

**✅ 预期响应：**
```json
{
  "userId": "uuid-here",
  "email": "test@example.com",
  "token": "jwt-token-here"
}
```

### 测试登录
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

### 测试 CORS（使用浏览器）

```javascript
// 在浏览器控制台执行
fetch('http://localhost:3000/healthz')
  .then(r => r.json())
  .then(d => console.log('✅ CORS OK:', d))
  .catch(e => console.error('❌ CORS Failed:', e))
```

---

## 监控设置（生产环境）

### 配置容器重启策略
```yaml
# docker-compose.prod.yml
services:
  api:
    restart: unless-stopped  # 自动重启
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 配置日志轮转
```bash
# 防止日志无限增长
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "10"
  }
}
EOF

systemctl restart docker
```

---

## 验证检查清单

### 第一阶段：容器运行
- [ ] 所有容器状态为 "Up" 或 "healthy"
- [ ] 没有 "Exited" 或 "Unhealthy" 的容器
- [ ] 容器内存占用合理（< 1GB）

### 第二阶段：连通性
- [ ] `/healthz` 返回 200 + JSON
- [ ] `/api/health/db` 返回 "connected: true"
- [ ] `/api/health/redis` 返回 "connected: true"

### 第三阶段：功能测试
- [ ] 账户创建成功
- [ ] 用户登录成功
- [ ] 无 CORS 错误
- [ ] 无认证错误

### 第四阶段：性能基准
- [ ] 响应时间 < 200ms（平均）
- [ ] 无过期错误
- [ ] 日志中无警告

---

## 如果验证失败

1. 见 [05-troubleshooting.md](05-troubleshooting.md)
2. 检查 [03-deploy.md](03-deploy.md) 的部署步骤
3. 查看容器日志：`docker-compose logs api`

---

更多帮助见 [README.md](README.md) 或 [05-troubleshooting.md](05-troubleshooting.md)。
