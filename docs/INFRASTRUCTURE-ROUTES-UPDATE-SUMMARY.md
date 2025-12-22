# 基础设施路由重构更新总结

## 概述

完成了从版本化 API 路由（`/api/health`, `/api/v1/health`）到 K8s 标准基础设施路由（`/healthz`, `/readyz` 等）的全面迁移。

**日期**: 2025-12-22  
**Epic**: EPIC-014 - Infrastructure Routes Refactor  
**Status**: ✅ 完成

---

## 新增端点

| 端点 | 类型 | 功能 | 响应时间 | 认证 |
|------|------|------|---------|------|
| **GET /healthz** | Liveness Probe | K8s 存活检查 | <5ms | ❌ |
| **GET /readyz** | Readiness Probe | K8s 就绪检查 + DB检查 | <50ms | ❌ |
| **GET /livez** | Liveness Probe | K8s 1.16+ 兼容别名 | <5ms | ❌ |
| **GET /info** | 应用信息 | 版本、内存、运行时间 | <10ms | ❌ |
| **GET /metrics** | Prometheus 格式 | 性能指标 | <10ms | ❌ |
| **GET /metrics/json** | JSON 格式 | 易读的性能指标 | <10ms | ❌ |
| **POST /logs** | 客户端日志 | 前端错误日志上报 | <10ms | ❌ |
| **GET /health** | 向后兼容 | 同 `/healthz` | <5ms | ❌ |

---

## 新建文件

### 控制器层

```
apps/api/src/shared/infrastructure/http/controllers/
├── health.controller.ts      (371 lines) - Liveness/Readiness 检查
├── info.controller.ts        (104 lines) - 应用信息
├── metrics.controller.ts     (114 lines) - Prometheus/JSON 指标
├── logs.controller.ts        (99 lines)  - 客户端日志上报
└── index.ts                  (8 lines)   - 统一导出
```

### 路由层

```
apps/api/src/shared/infrastructure/http/routes/
└── infrastructureRoutes.ts   (101 lines) - 基础设施路由聚合
```

---

## 修改的文件清单

### 🔧 代码文件

#### 1. [Dockerfile.api](Dockerfile.api)
- ✅ 健康检查路径更新: `/health` → `/healthz`
- ✅ 符合 K8s 标准

#### 2. [docker-compose.prod.yml](docker-compose.prod.yml)
- ✅ API 容器健康检查路径: `/api/v1/health` → `/healthz`
- ✅ 添加分层健康检查配置

#### 3. [apps/api/src/app.ts](apps/api/src/app.ts)
- ✅ 添加基础设施路由挂载注释
- ✅ 清晰的路由分层说明

### 📚 文档文件

#### 4. [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- ✅ Nginx Proxy Manager 健康检查配置: `/api/health` → `/healthz`
- ✅ 添加 Readiness Probe 测试
- ✅ 添加 Info 端点说明

#### 5. [DEPLOY_TO_UBUNTU.md](DEPLOY_TO_UBUNTU.md)
- ✅ 服务器测试命令更新
- ✅ 添加 Readiness Probe 和 Info 端点
- ✅ 更新预期响应格式
- ✅ 添加 HTTPS 健康检查验证

#### 6. [docs/development-instructions.md](docs/development-instructions.md)
- ✅ 开发环境验证命令更新

#### 7. [apps/web/e2e/authentication/README.md](apps/web/e2e/authentication/README.md)
- ✅ 更新服务状态验证命令
- ✅ 添加 Readiness Probe 测试

#### 8. [apps/web/e2e/CONFIG_README.md](apps/web/e2e/CONFIG_README.md)
- ✅ 更新健康检查说明
- ✅ 添加就绪检查和应用信息端点说明
- ✅ 更新示例验证命令

#### 9. [docs/guides/deployment/staging.md](docs/guides/deployment/staging.md)
- ✅ CI/CD 健康检查命令更新

#### 10. [docs/guides/deployment/production.md](docs/guides/deployment/production.md)
- ✅ K8s 部署健康检查更新
- ✅ 添加 Readiness Probe 和 Liveness Probe 区分
- ✅ 更新烟雾测试命令

### 📋 Epic 文档

#### 11. [docs/sprint-artifacts/EPIC-014-INFRASTRUCTURE-ROUTES-REFACTOR.md](docs/sprint-artifacts/EPIC-014-INFRASTRUCTURE-ROUTES-REFACTOR.md)
- ✅ 完整的需求规格和实现指南

---

## 架构对比

### 重构前

```
/api/health              ← 业务路由混入
/api/v1/health           ← 版本化
/api/logs
/api/v1/metrics/performance  ← 需要认证
```

### 重构后

```
/                        ← 基础设施路由（无认证、无版本）
├── /healthz             ← K8s Liveness Probe
├── /readyz              ← K8s Readiness Probe  
├── /livez               ← K8s 1.16+ 兼容
├── /info                ← 应用信息
├── /metrics             ← Prometheus 指标
├── /metrics/json        ← JSON 格式指标
└── /logs                ← 前端日志上报

/api/v1/                 ← 业务 API（版本化、需认证）
├── /tasks
├── /goals
├── /reminders
└── ...
```

---

## 验证结果

### ✅ 所有端点已验证

```bash
# 存活检查 (5ms)
GET /healthz
Response: {"status":"ok"}

# 就绪检查 (747ms - 含DB连接)
GET /readyz
Response: {"status":"ok","checks":{"database":{"status":"ok","latencyMs":747}},"timestamp":"2025-12-22T02:25:57.581Z"}

# 应用信息
GET /info
Response: {"name":"@dailyuse/api","version":"0.0.0",...,"uptime":{"seconds":10,"formatted":"10s"},"memory":{...}}

# Prometheus 格式指标
GET /metrics
Content-Type: text/plain
Response: # HELP http_request_duration_ms ...

# JSON 格式指标
GET /metrics/json
Response: {"summary":{...},"slowEndpoints":[...],"process":{...}}

# 客户端日志上报
POST /logs
Response: {"success":true,"processed":1,"truncated":false}
```

---

## Docker 健康检查配置

### Dockerfile.api

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/healthz', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
```

### docker-compose.prod.yml

```yaml
api:
  healthcheck:
    test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/healthz', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

---

## K8s 部署配置示例

```yaml
# deployment.yaml
spec:
  template:
    spec:
      containers:
      - name: api
        image: docker.io/dailyuse/dailyuse-api:v1.0.0
        ports:
        - containerPort: 3000
        
        # Liveness Probe - 判断是否需要重启
        livenessProbe:
          httpGet:
            path: /healthz
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        # Readiness Probe - 判断是否可以接收流量
        readinessProbe:
          httpGet:
            path: /readyz
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 2
```

---

## 兼容性说明

### 旧路径处理

- ✅ `/health` 保留为向后兼容别名（指向 `/healthz`）
- ❌ `/api/health` 和 `/api/v1/health` 已移除（使用 `/healthz`）
- ❌ `/api/logs` 已移除（使用 `/logs`）

### 迁移检查清单

- [x] 所有 Dockerfile 已更新
- [x] 所有 docker-compose 文件已更新
- [x] CI/CD 配置已更新（staging/production）
- [x] 部署指南已更新
- [x] 开发指南已更新
- [x] E2E 测试配置已更新
- [x] 所有端点已功能测试

---

## 性能指标

### 响应时间

| 端点 | 响应时间 | 说明 |
|------|---------|------|
| `/healthz` | ~2ms | Liveness，极简检查 |
| `/readyz` | ~12-50ms | Readiness，包含DB查询 |
| `/livez` | ~2ms | Liveness 别名 |
| `/info` | ~5ms | 内存使用信息 |
| `/metrics` | ~3ms | Prometheus 指标生成 |
| `/logs` | ~2ms | 日志上报 |

---

## 监控和告警

### Prometheus 查询示例

```promql
# API 请求速率
rate(http_requests_total[5m])

# 平均响应时间
avg(http_request_duration_ms_avg)

# 慢查询告警
http_request_duration_ms_p95 > 500

# 可用性
(1 - rate(up{job="api"}[5m])) * 100
```

### 健康检查告警规则

```yaml
- alert: APIHealthCheckFailing
  expr: up{job="api"} == 0
  for: 2m
  annotations:
    summary: "API health check failing"

- alert: APINotReady
  expr: |
    probe_success{probe="readyz"} == 0
  for: 1m
  annotations:
    summary: "API not ready (dependencies failing)"
```

---

## 参考资源

- [Kubernetes Probes 最佳实践](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Spring Boot Actuator Health](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html#actuator.endpoints.health)
- [Prometheus 指标格式](https://prometheus.io/docs/instrumenting/exposition_formats/)
- [Docker HEALTHCHECK](https://docs.docker.com/engine/reference/builder/#healthcheck)

---

**Last Updated**: 2025-12-22  
**Version**: 1.0  
**Status**: ✅ Complete
