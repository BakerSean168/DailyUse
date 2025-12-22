# 🚀 环境变量快速参考卡

复制此内容并粘贴到生产服务器上：

---

## 步骤 1️⃣：生成强密码和密钥

```bash
# 打开终端，运行以下命令生成 4 个强密码/密钥

# 密码 1：数据库密码
PASSWORD1=$(openssl rand -base64 32)
echo "DATABASE_PASSWORD=$PASSWORD1"

# 密码 2：Redis 密码
PASSWORD2=$(openssl rand -base64 32)
echo "REDIS_PASSWORD=$PASSWORD2"

# 密钥 1：JWT 密钥
SECRET1=$(openssl rand -base64 32)
echo "JWT_SECRET=$SECRET1"

# 密钥 2：刷新令牌密钥
SECRET2=$(openssl rand -base64 32)
echo "REFRESH_TOKEN_SECRET=$SECRET2"
```

---

## 步骤 2️⃣：创建 .env.production.local 文件

```bash
cd /opt/dailyuse

cat > .env.production.local << 'EOF'
# 数据库配置
POSTGRES_PASSWORD=<粘贴密码1>
DATABASE_URL=postgresql://postgres:<粘贴密码1>@postgres:5432/dailyuse

# Redis 配置
REDIS_PASSWORD=<粘贴密码2>

# JWT 认证
JWT_SECRET=<粘贴密钥1>
REFRESH_TOKEN_SECRET=<粘贴密钥2>

# CORS 域名（改为你的域名）
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# 可选：第三方服务
# SENTRY_DSN=https://...
# SMTP_PASSWORD=...
# OPENAI_API_KEY=...
EOF

# 设置文件权限为 600（只有所有者可读）
chmod 600 .env.production.local

# 验证权限
ls -la .env.production.local
# 应该显示：-rw------- ... .env.production.local
```

---

## 步骤 3️⃣：验证配置

```bash
# 启动应用
docker-compose -f docker-compose.prod.yml up -d

# 等待 30 秒
sleep 30

# 查看日志（应该看到 ✅ Environment variables validated successfully）
docker-compose logs api | head -30
```

---

## 文件清单

```bash
# 应该在 /opt/dailyuse 目录下有这些文件

ls -la /opt/dailyuse/

# 期望输出：
# -rw-r--r-- .env                    ✅ （可以提交 Git）
# -rw-r--r-- .env.production         ✅ （可以提交 Git）
# -rw------- .env.production.local   ✅ （不要提交 Git，权限 600）
# -rw-r--r-- docker-compose.prod.yml ✅ （可以提交 Git）
```

---

## 环境变量加载顺序

```
启动应用 (NODE_ENV=production)
    ↓
读取 .env                          ← 基础配置
    ↓ 覆盖
读取 .env.production               ← 生产特定
    ↓ 覆盖
读取 .env.production.local         ← 敏感信息（密码、密钥）
    ↓
应用启动，使用合并后的配置
```

**关键点**：你**不需要**手动指定 env 文件，系统会根据 `NODE_ENV=production` 自动加载正确的文件。

---

## 常见问题

### Q: 我是否需要在 docker-compose 命令中指定 --env-file？

**A**: 不需要！直接执行：

```bash
docker-compose -f docker-compose.prod.yml up -d

# Docker Compose 自动加载 .env
# 你的应用再根据 NODE_ENV 加载 .env.production 和 .env.production.local
```

### Q: .env.production.local 在 Git 中被忽略了吗？

**A**: 检查一下：

```bash
# 查看 .gitignore
cat .gitignore | grep "env"

# 应该看到：
# .env.local
# .env.*.local

# 如果没有，添加：
echo ".env.production.local" >> .gitignore
```

### Q: 如何更新部分配置而不重启应用？

**A**: 编辑 .env.production.local 后必须重启：

```bash
# 编辑配置
nano .env.production.local

# 重启应用
docker-compose down
docker-compose up -d

# 或更快的方式
docker-compose restart api
```

### Q: 如何备份生产配置？

**A**: 保存 .env.production.local 的安全备份：

```bash
# 备份到安全位置
cp .env.production.local /secure/backup/location/.env.production.local.bak
chmod 600 /secure/backup/location/.env.production.local.bak

# 验证备份内容
cat /secure/backup/location/.env.production.local.bak | head
```

---

## 🔒 安全检查清单

- [ ] .env.production.local 的权限是 600
- [ ] .env.production.local 在 .gitignore 中
- [ ] 没有在代码中硬编码任何密钥
- [ ] 密码包含大小写字母、数字、特殊符号
- [ ] 应用启动日志中没有打印敏感信息
- [ ] CORS_ORIGIN 设置了具体域名（不是 *）
- [ ] 已生成强密钥（至少 32 个字符）

---

## 更多帮助

- 详细说明：[环境变量加载机制](ENV_LOADING_MECHANISM.md)
- 所有变量参考：[configs/ENVIRONMENT_CONFIGURATION.md](configs/ENVIRONMENT_CONFIGURATION.md)
- 故障排除：[05-troubleshooting.md](05-troubleshooting.md)
