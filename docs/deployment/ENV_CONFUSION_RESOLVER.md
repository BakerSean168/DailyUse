# ✨ 环境变量配置总结（为你解除困惑）

---

## 🎯 你的问题的答案

> "生产环境使用 Docker Compose 部署需要指定某个 ENV 配置文件吗？他会根据层级关系来决定吗？"

**答案：不需要手动指定！系统会自动根据优先级加载。**

---

## 🔄 自动加载过程

```
你启动应用
    ↓
NODE_ENV=production （从 .env 或系统变量读取）
    ↓
应用自动加载文件，按以下顺序：
    1. .env                    （基础值）
    2. .env.production         （覆盖）
    3. .env.production.local   （最后覆盖，敏感信息在这里）
    ↓
所有值合并 → 应用使用
```

**你不需要做任何额外操作！**

---

## 📁 实际文件结构

### 提交到 Git（安全的公开配置）

```
.env                    # 所有环境共享的基础值
.env.production         # 生产环境的非敏感配置

示例：
.env:
  NODE_ENV=development
  API_PORT=3000
  LOG_LEVEL=info

.env.production:
  NODE_ENV=production
  LOG_LEVEL=warn        ← 覆盖上面的 info
  REDIS_HOST=redis      ← 新增
```

### 不提交到 Git（每台机器独有的敏感信息）

```
.env.production.local   # 只在生产服务器上存在

示例：
  DATABASE_PASSWORD=secure-password-here
  JWT_SECRET=strong-secret-key-here
  REDIS_PASSWORD=redis-password-here
  CORS_ORIGIN=https://yourdomain.com
```

---

## 🚀 简单的部署步骤

### 第一次部署到生产服务器

```bash
# 1. 登录到生产服务器
ssh root@your-server.com

# 2. 进入部署目录
cd /opt/dailyuse

# 3. 复制 Git 仓库中的文件（已经提交的公开配置）
# 这些文件已经在 Git 中了
cat .env
cat .env.production
# 你应该看到这两个文件已经存在

# 4. 创建本地敏感信息文件（只在服务器上）
cat > .env.production.local << 'EOF'
DATABASE_PASSWORD=your-secure-password
JWT_SECRET=your-secret-key
REDIS_PASSWORD=your-redis-password
CORS_ORIGIN=https://yourdomain.com
EOF

chmod 600 .env.production.local

# 5. 启动应用（就这样！不需要指定任何 env 文件）
docker-compose -f docker-compose.prod.yml up -d

# 6. 检查是否成功
sleep 30
docker-compose logs api | head -20
# 应该看到：✅ Environment variables validated successfully
```

---

## 📊 文件说明表

| 文件 | 提交 Git | 内容 | 谁修改 | 何时加载 |
|------|---------|------|--------|---------|
| `.env` | ✅ | 所有环境共享的基础值 | 开发团队 | 所有情况 |
| `.env.production` | ✅ | 生产环境的非敏感值（LOG_LEVEL, REDIS_HOST 等） | 开发团队 | NODE_ENV=production |
| `.env.production.local` | ❌ | 生产服务器的敏感信息（密码、密钥） | 运维人员 | NODE_ENV=production（仅服务器上） |
| `.env.local` | ❌ | 本地开发的敏感信息 | 开发者自己 | 所有环境（仅本地） |

---

## 🎨 实际示例

### 开发环境（你的笔记本）

```bash
# 目录结构
~/DailyUse/
├── .env                （从 Git 克隆）
├── .env.development    （从 Git 克隆）
├── .env.local          （你自己创建，不上传 Git）
└── .env.development.local （你自己创建，不上传 Git）

# 启动开发服务器
NODE_ENV=development pnpm nx serve api

# 加载顺序：.env → .env.development → .env.local → .env.development.local
```

### 生产环境（服务器上）

```bash
# 目录结构
/opt/dailyuse/
├── .env                    （从 Git 克隆）
├── .env.production         （从 Git 克隆）
├── .env.production.local   （运维创建，永不上传 Git）
└── docker-compose.prod.yml （从 Git 克隆）

# 启动生产服务器
docker-compose -f docker-compose.prod.yml up -d

# 加载顺序：.env → .env.production → .env.production.local
# （.env 中已设置 NODE_ENV=production）
```

---

## ✨ 关键要点

### ✅ 已经帮你配置好的

- ✅ `.env` 文件已创建（基础值）
- ✅ `.env.production` 文件已创建（生产特定值）
- ✅ 应用代码会自动加载和合并这些文件
- ✅ 无需在 docker-compose 命令中指定任何东西

### ⚠️ 你需要做的（仅在生产服务器上）

- 创建 `.env.production.local` 文件（包含密码、密钥）
- 设置文件权限 `chmod 600`
- 在 `.gitignore` 中确认包含 `.env.production.local`
- 启动应用

### ❌ 你不需要做的

- ❌ 不需要在 docker-compose 命令中添加 `--env-file` 参数
- ❌ 不需要手动指定加载哪个 env 文件
- ❌ 不需要修改应用代码
- ❌ 不需要创建多个 docker-compose 文件

---

## 🔍 如何验证配置是否正确加载

```bash
# 方法 1：查看应用日志
docker-compose logs api | grep -i "config\|environment\|loaded"

# 方法 2：进入容器检查
docker exec dailyuse-api env | grep -E "^(NODE_ENV|DATABASE_|REDIS_|JWT_)"

# 方法 3：测试应用
curl http://localhost:3000/healthz
# 如果应用能正常响应，说明配置加载成功
```

---

## 🚨 常见错误和解决

### ❌ 错误：应用启动时报告缺失的环境变量

```
❌ Environment validation failed:
  DATABASE_URL: required field
```

**解决**：检查 .env.production.local 是否存在且包含所需变量

```bash
cat .env.production.local
# 应该看到 DATABASE_URL=...
```

### ❌ 错误：CORS 请求被拒绝

```
Access to XMLHttpRequest blocked by CORS
```

**解决**：检查 .env.production.local 中的 CORS_ORIGIN

```bash
grep CORS_ORIGIN .env.production.local
# 应该看到你的域名，不是 *
```

### ❌ 错误：数据库连接失败

```
Error: connect ECONNREFUSED
```

**解决**：检查 DATABASE_URL 是否正确

```bash
grep DATABASE_URL .env.production.local
# 格式应该是：postgresql://postgres:PASSWORD@postgres:5432/dailyuse
```

---

## 💡 建议工作流

### 第一次设置生产环境

```bash
# 1. SSH 到服务器
ssh root@your-server.com

# 2. Clone 项目或进入部署目录
cd /opt/dailyuse

# 3. 确保有 .env 和 .env.production（从 Git 获得）
ls -l .env .env.production

# 4. 生成强密码
PASSWORD=$(openssl rand -base64 32)
echo "Generated password: $PASSWORD"

# 5. 创建 .env.production.local
cat > .env.production.local << EOF
DATABASE_PASSWORD=$PASSWORD
DATABASE_URL=postgresql://postgres:$PASSWORD@postgres:5432/dailyuse
REDIS_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
REFRESH_TOKEN_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
EOF

chmod 600 .env.production.local

# 6. 启动
docker-compose -f docker-compose.prod.yml up -d

# 7. 验证
sleep 30
docker-compose logs api | head -30
```

### 更新应用（只更新镜像，不改配置）

```bash
# 1. 拉取新镜像
docker-compose -f docker-compose.prod.yml pull

# 2. 重启
docker-compose -f docker-compose.prod.yml up -d --force-recreate

# 3. 验证
docker-compose logs api | head -10

# .env.production.local 保持不变，自动被加载
```

---

## 📚 更多资源

| 文档 | 用途 |
|------|------|
| [ENV_LOADING_MECHANISM.md](ENV_LOADING_MECHANISM.md) | **详细的技术解释**（如果想深入理解） |
| [ENV_QUICK_REFERENCE.md](ENV_QUICK_REFERENCE.md) | **快速参考卡**（生成密码和配置步骤） |
| [configs/ENVIRONMENT_CONFIGURATION.md](configs/ENVIRONMENT_CONFIGURATION.md) | **所有环境变量的完整列表和说明** |
| [03-deploy.md](03-deploy.md) | **完整的部署流程**（包括服务器准备） |

---

## 🎓 总结

你的困惑来自于太多的 `.env*` 文件，现在应该清楚了：

1. **不需要手动指定** env 文件
2. **系统自动加载**基于 NODE_ENV
3. **安全信息单独存放**在 .env.production.local
4. **就这样，启动应用**，一切自动化

下次部署时，只需：
```bash
# 1. 创建 .env.production.local（密码和密钥）
# 2. docker-compose up -d
# 完成！
```

有任何疑问，参考 [ENV_LOADING_MECHANISM.md](ENV_LOADING_MECHANISM.md) 的详细说明。
