# 🔨 构建 Docker 镜像

**预计耗时**：10 分钟  
**适合**：需要详细构建说明的运维人员

---

## 第一步：验证环境

```bash
# 检查 Docker
docker --version  # >= 20.10

# 检查 pnpm
pnpm --version  # >= 10.0

# 检查 Git
git --version   # >= 2.0

# 验证 Docker 登录
docker login crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com
```

---

## 第二步：验证本地编译

```bash
# TypeScript 编译检查
pnpm nx run api:typecheck
# 预期：Successfully ran target typecheck
```

---

## 第三步：构建镜像

### 1. 构建镜像
```bash
docker build -t dailyuse-api:v1.0.3 \
  -f Dockerfile.api \
  --build-arg NODE_ENV=production \
  .
```

### 2. 标记镜像
```bash
docker tag dailyuse-api:v1.0.3 \
  crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:v1.0.3
docker tag dailyuse-api:v1.0.3 \
  crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:latest
```

### 3. 推送到阿里云
```bash
docker push crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:v1.0.3
docker push crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:latest
```

---

## 第四步：验证构建成功

```bash
# 检查本地镜像
docker image ls | grep dailyuse-api
# ✓ 应该显示 v1.0.3 和 latest 标签

# 本地测试（可选）
docker run -d --name test-api \
  -e NODE_ENV=production \
  -p 3000:3000 \
  crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:v1.0.3

sleep 3
curl http://localhost:3000/healthz
# 预期：{"status":"ok",...}

docker rm -f test-api
```

---

## ⚠️ 常见构建问题

### 编译失败
```bash
pnpm install
rm -rf node_modules/.cache
pnpm nx run api:typecheck
```

### 磁盘空间不足
```bash
docker system prune -a
df -h
```

### 登录失败
```bash
docker logout
docker login crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com
```

---

详细说明见 [README.md](README.md)。更多帮助见 [05-troubleshooting.md](05-troubleshooting.md)。
