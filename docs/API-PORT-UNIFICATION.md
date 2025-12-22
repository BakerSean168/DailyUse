# API 端口统一配置

## 最终方案

### 统一标准：所有环境都使用 `API_PORT` 环境变量

**[apps/api/src/index.ts](apps/api/src/index.ts)**

```typescript
const PORT = parseInt(process.env.API_PORT || '3000', 10);
```

**特点**:
- 清晰统一：只读 `API_PORT` 环境变量
- 默认 3000：生产标准端口
- 无兼容负担：代码简洁易维护

---

## 环境配置

### 生产环境 (docker-compose.prod.yml)

```yaml
api:
  environment:
    API_PORT: 3000
  ports:
    - "${API_PORT:-3000}:3000"
```

### 开发环境 (本地)

```bash
# 方式 1：使用默认 3000
npm run dev

# 方式 2：自定义端口
API_PORT=3888 npm run dev
```

### K8s 部署

```yaml
containers:
- name: api
  env:
  - name: API_PORT
    value: "3000"
  ports:
  - containerPort: 3000
```

---

## 验证

```bash
# 检查容器日志
docker logs dailyuse-prod-api | grep "API server listening"
# 预期: API server listening on http://localhost:3000

# 健康检查
curl http://localhost:3000/healthz
```

---

**最后更新**: 2025-12-22  
**状态**: ✅ 完成  
**原则**: 清晰统一，无兼容包袱
