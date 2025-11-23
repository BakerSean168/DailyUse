---
tags:
  - deployment
  - staging
  - ci-cd
  - guide
description: 预发布环境部署指南 - CI/CD流水线配置与Staging环境管理
created: 2025-11-23T17:30:00
updated: 2025-11-23T17:30:00
---

# 🎭 预发布环境部署指南 - Staging Deployment

> 使用CI/CD自动化部署到Staging环境，验证功能完整性后再发布生产

## 📋 目录

- [环境概述](#环境概述)
- [CI/CD流水线](#cicd流水线)
- [部署流程](#部署流程)
- [环境配置](#环境配置)
- [监控与日志](#监控与日志)
- [回滚策略](#回滚策略)

---

## 🎯 环境概述

### Staging环境特点

Staging环境是生产环境的完整镜像，用于：

- ✅ **功能验证**: 在类生产环境测试新功能
- ✅ **集成测试**: 运行E2E测试套件
- ✅ **性能测试**: 验证性能优化效果
- ✅ **UAT测试**: 用户验收测试
- ✅ **数据迁移预演**: 测试数据库迁移脚本

### 环境架构

```
┌─────────────────────────────────────────────┐
│          Staging Environment                │
├─────────────────────────────────────────────┤
│  Load Balancer (Nginx)                      │
│  ├── API Server (Node.js)                   │
│  ├── Web Server (Static)                    │
│  └── Desktop Server (Static)                │
│                                             │
│  Database (PostgreSQL)                      │
│  Cache (Redis)                              │
│  Storage (S3 Compatible)                    │
│  Monitoring (Prometheus + Grafana)          │
└─────────────────────────────────────────────┘
```

### 访问地址

| 服务 | URL | 用途 |
|------|-----|------|
| **Web应用** | https://staging.dailyuse.app | 前端应用 |
| **API服务** | https://api-staging.dailyuse.app | 后端API |
| **API文档** | https://api-staging.dailyuse.app/api-docs | Swagger文档 |
| **监控面板** | https://monitoring-staging.dailyuse.app | Grafana监控 |
| **日志平台** | https://logs-staging.dailyuse.app | Kibana日志 |

---

## 🔄 CI/CD流水线

### GitHub Actions工作流

**.github/workflows/staging-deploy.yml**:

```yaml
name: Deploy to Staging

on:
  push:
    branches:
      - develop
  pull_request:
    types: [closed]
    branches:
      - develop

env:
  NODE_VERSION: '20.11'
  PNPM_VERSION: '8.15'

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: dailyuse_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint code
        run: pnpm nx run-many --target=lint --all

      - name: Type check
        run: pnpm nx run-many --target=type-check --all

      - name: Run unit tests
        run: pnpm nx run-many --target=test --all --parallel=4 --coverage

      - name: Run integration tests
        run: pnpm nx run api:test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/dailyuse_test
          REDIS_URL: redis://localhost:6379

      - name: Run E2E tests
        run: pnpm nx run web:e2e
        env:
          BASE_URL: http://localhost:4200

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  build:
    name: Build Applications
    runs-on: ubuntu-latest
    needs: test

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build API
        run: pnpm nx build api --configuration=staging

      - name: Build Web
        run: pnpm nx build web --configuration=staging

      - name: Build Desktop
        run: pnpm nx build desktop --configuration=staging

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: |
            dist/apps/api
            dist/apps/web
            dist/apps/desktop
          retention-days: 7

  deploy-api:
    name: Deploy API to Staging
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: staging
      url: https://api-staging.dailyuse.app

    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts

      - name: Deploy to Docker Registry
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          
          # Build Docker image
          docker build -t dailyuse/api:staging-${{ github.sha }} ./apps/api
          docker push dailyuse/api:staging-${{ github.sha }}
          
          # Tag as latest staging
          docker tag dailyuse/api:staging-${{ github.sha }} dailyuse/api:staging-latest
          docker push dailyuse/api:staging-latest

      - name: Deploy to Kubernetes
        uses: azure/k8s-deploy@v4
        with:
          manifests: |
            k8s/staging/api-deployment.yaml
            k8s/staging/api-service.yaml
          images: dailyuse/api:staging-${{ github.sha }}
          namespace: dailyuse-staging

      - name: Run database migrations
        run: |
          kubectl exec -n dailyuse-staging deployment/api -- pnpm prisma migrate deploy

      - name: Wait for deployment
        run: |
          kubectl wait --for=condition=available --timeout=300s \
            deployment/api -n dailyuse-staging

      - name: Health check
        run: |
          curl -f https://api-staging.dailyuse.app/health || exit 1

  deploy-web:
    name: Deploy Web to Staging
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: staging
      url: https://staging.dailyuse.app

    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts

      - name: Deploy to S3
        run: |
          aws s3 sync ./dist/apps/web s3://dailyuse-staging-web --delete
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_STAGING_ID }} --paths "/*"
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: us-east-1

  smoke-test:
    name: Smoke Tests
    runs-on: ubuntu-latest
    needs: [deploy-api, deploy-web]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Run smoke tests
        run: |
          pnpm install --frozen-lockfile
          pnpm nx run web:e2e:smoke --base-url=https://staging.dailyuse.app

  notify:
    name: Notify Deployment
    runs-on: ubuntu-latest
    needs: [deploy-api, deploy-web, smoke-test]
    if: always()

    steps:
      - name: Send Slack notification
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "text": "Staging Deployment ${{ job.status }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Staging Deployment*\nStatus: ${{ job.status }}\nCommit: ${{ github.sha }}\nAuthor: ${{ github.actor }}"
                  }
                },
                {
                  "type": "actions",
                  "elements": [
                    {
                      "type": "button",
                      "text": {
                        "type": "plain_text",
                        "text": "View Web App"
                      },
                      "url": "https://staging.dailyuse.app"
                    },
                    {
                      "type": "button",
                      "text": {
                        "type": "plain_text",
                        "text": "View API Docs"
                      },
                      "url": "https://api-staging.dailyuse.app/api-docs"
                    }
                  ]
                }
              ]
            }
```

---

## 🚀 部署流程

### 自动部署触发

```bash
# 1. 合并代码到develop分支
git checkout develop
git merge feature/new-feature
git push origin develop

# 2. GitHub Actions自动触发部署流水线
# 3. 等待约10-15分钟完成部署
# 4. 收到Slack通知
```

### 手动部署

```bash
# 触发手动部署
gh workflow run staging-deploy.yml

# 查看部署状态
gh run list --workflow=staging-deploy.yml

# 查看部署日志
gh run view <run-id> --log
```

### 部署步骤详解

**1. 代码检查与测试** (5分钟)
- Lint检查
- 类型检查
- 单元测试
- 集成测试
- E2E测试

**2. 构建应用** (3分钟)
- 构建API（NestJS）
- 构建Web（Vite）
- 构建Desktop（Electron）

**3. 部署API** (4分钟)
- 构建Docker镜像
- 推送到镜像仓库
- 部署到Kubernetes
- 运行数据库迁移
- 健康检查

**4. 部署Web** (2分钟)
- 上传静态文件到S3
- 刷新CDN缓存

**5. 冒烟测试** (2分钟)
- 运行核心功能测试
- 验证API可用性
- 验证Web可访问性

---

## ⚙️ 环境配置

### Kubernetes配置

**k8s/staging/api-deployment.yaml**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: dailyuse-staging
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: dailyuse/api:staging-latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "staging"
            
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: database-credentials
                  key: url
            
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: redis-credentials
                  key: url
            
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: jwt-credentials
                  key: secret
          
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
```

**k8s/staging/api-service.yaml**:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: dailyuse-staging
spec:
  selector:
    app: api
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
```

### 环境变量

**Staging环境变量** (存储在GitHub Secrets):

```env
# 数据库
DATABASE_URL=postgresql://user:pass@staging-db.cluster.us-east-1.rds.amazonaws.com:5432/dailyuse_staging

# Redis
REDIS_URL=redis://staging-redis.cluster.use1.cache.amazonaws.com:6379

# JWT
JWT_SECRET=staging-super-secret-key-change-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# API
API_PORT=3000
API_PREFIX=api
API_BASE_URL=https://api-staging.dailyuse.app

# CORS
CORS_ORIGINS=https://staging.dailyuse.app

# 日志
LOG_LEVEL=info
LOG_FORMAT=json

# 邮件
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=${SENDGRID_API_KEY}
EMAIL_FROM=noreply@dailyuse.app

# 文件上传
UPLOAD_PROVIDER=s3
S3_BUCKET=dailyuse-staging-uploads
S3_REGION=us-east-1

# 监控
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ENVIRONMENT=staging
```

### Nginx配置

**/etc/nginx/sites-available/staging.dailyuse.app**:

```nginx
upstream api {
    server localhost:3000;
}

server {
    listen 80;
    listen [::]:80;
    server_name staging.dailyuse.app;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name staging.dailyuse.app;

    # SSL证书
    ssl_certificate /etc/letsencrypt/live/staging.dailyuse.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.dailyuse.app/privkey.pem;

    # 静态文件
    root /var/www/dailyuse-staging/web;
    index index.html;

    # Gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api {
        proxy_pass http://api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 健康检查
    location /health {
        access_log off;
        return 200 "OK";
    }
}
```

---

## 📊 监控与日志

### Prometheus监控

**prometheus.yml**:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'api'
    static_configs:
      - targets: ['api:3000']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

### Grafana面板

**关键指标**:

- **API性能**:
  - 请求速率 (req/s)
  - 响应时间 (P50, P95, P99)
  - 错误率 (4xx, 5xx)

- **数据库**:
  - 连接数
  - 查询时间
  - 慢查询数

- **Redis**:
  - 命中率
  - 内存使用
  - 连接数

- **系统资源**:
  - CPU使用率
  - 内存使用率
  - 磁盘IO

### 日志聚合

**Elasticsearch + Kibana**:

```typescript
// apps/api/src/logger/winston.config.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

export const winstonConfig = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: {
        node: process.env.ELASTICSEARCH_URL,
        auth: {
          username: process.env.ELASTICSEARCH_USER,
          password: process.env.ELASTICSEARCH_PASS,
        },
      },
      index: 'dailyuse-staging-logs',
    }),
  ],
};
```

---

## 🔄 回滚策略

### 快速回滚

```bash
# 回滚到上一个版本
kubectl rollout undo deployment/api -n dailyuse-staging

# 回滚到特定版本
kubectl rollout undo deployment/api -n dailyuse-staging --to-revision=2

# 查看回滚历史
kubectl rollout history deployment/api -n dailyuse-staging
```

### 数据库回滚

```bash
# 查看迁移历史
pnpm nx run api:prisma:migrate:status

# 回滚到特定迁移
pnpm nx run api:prisma:migrate:resolve --rolled-back 20250101000000_migration_name

# 重新应用迁移
pnpm nx run api:prisma:migrate:deploy
```

### 蓝绿部署

**k8s/staging/blue-green-deployment.yaml**:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: dailyuse-staging
spec:
  selector:
    app: api
    version: blue  # 切换为green进行蓝绿部署
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
```

---

## 📚 相关文档

- [[guides/deployment/local|本地部署]]
- [[guides/deployment/production|生产环境部署]]
- [[guides/troubleshooting/deployment-errors|部署问题排查]]

---

**最后更新**: 2025-11-23  
**维护者**: @BakerSean168  
**版本**: v2.0
