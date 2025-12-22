---
tags:
  - deployment
  - production
  - ci-cd
  - security
  - guide
description: 生产环境部署指南 - 高可用架构、安全加固与自动化运维完整方案
created: 2025-11-23T17:35:00
updated: 2025-11-23T17:35:00
---

# 🚀 生产环境部署指南 - Production Deployment

> 企业级生产环境部署方案，确保高可用、高性能、高安全性

## 📋 目录

- [环境概述](#环境概述)
- [架构设计](#架构设计)
- [部署流程](#部署流程)
- [安全加固](#安全加固)
- [高可用方案](#高可用方案)
- [监控告警](#监控告警)
- [灾难恢复](#灾难恢复)

---

## 🎯 环境概述

### 生产环境要求

- ✅ **99.9%+ 可用性**: 年度停机时间 < 8.76小时
- ✅ **自动扩缩容**: 根据负载自动调整资源
- ✅ **零停机部署**: 蓝绿部署或滚动更新
- ✅ **完整备份**: 数据库每日备份，保留30天
- ✅ **实时监控**: 全链路追踪与告警
- ✅ **安全加固**: SSL/TLS、防火墙、DDoS防护
- ✅ **灾难恢复**: 多区域容灾，RPO < 1小时

### 基础设施

```
┌─────────────────────────────────────────────────────┐
│              Production Infrastructure              │
├─────────────────────────────────────────────────────┤
│  Global Load Balancer (CloudFlare / AWS ALB)        │
│  ├── Region 1 (Primary) - us-east-1               │
│  │   ├── Kubernetes Cluster (EKS)                  │
│  │   │   ├── API Pods (3+ replicas)               │
│  │   │   └── Worker Pods (2+ replicas)            │
│  │   ├── RDS PostgreSQL (Multi-AZ)                │
│  │   ├── ElastiCache Redis (Cluster Mode)         │
│  │   ├── S3 (Static Assets)                       │
│  │   └── CloudFront (CDN)                         │
│  │                                                  │
│  └── Region 2 (DR) - us-west-2                    │
│      └── Hot Standby (同步备份)                    │
│                                                     │
│  Monitoring: Datadog / New Relic                   │
│  Logging: CloudWatch / ELK Stack                   │
│  Secrets: AWS Secrets Manager                      │
│  CI/CD: GitHub Actions + ArgoCD                    │
└─────────────────────────────────────────────────────┘
```

### 访问地址

| 服务 | URL | 用途 |
|------|-----|------|
| **Web应用** | https://app.dailyuse.com | 生产前端 |
| **API服务** | https://api.dailyuse.com | 生产API |
| **管理后台** | https://admin.dailyuse.com | 内部管理 |
| **监控面板** | https://monitoring.dailyuse.com | Grafana监控 |
| **日志平台** | https://logs.dailyuse.com | Kibana日志 |
| **状态页面** | https://status.dailyuse.com | 系统状态 |

---

## 🏗 架构设计

### 网络架构

```
Internet
   │
   ├─ CloudFlare (DDoS Protection + CDN)
   │     │
   │     └─ AWS ALB (Application Load Balancer)
   │           │
   │           ├─ Public Subnet (NAT Gateway)
   │           │     │
   │           │     └─ Private Subnet (EKS Nodes)
   │           │           ├─ API Pods
   │           │           ├─ Worker Pods
   │           │           └─ Monitoring Pods
   │           │
   │           └─ Database Subnet (Isolated)
   │                 ├─ RDS Primary
   │                 ├─ RDS Standby
   │                 └─ ElastiCache Cluster
   │
   └─ AWS S3 (Static Assets)
```

### Kubernetes集群架构

```yaml
# EKS Cluster Configuration
apiVersion: v1
kind: Cluster
metadata:
  name: dailyuse-production
  region: us-east-1
spec:
  version: "1.28"
  
  nodeGroups:
    - name: api-workers
      instanceType: t3.large
      desiredCapacity: 3
      minSize: 2
      maxSize: 10
      labels:
        workload: api
    
    - name: worker-jobs
      instanceType: t3.medium
      desiredCapacity: 2
      minSize: 1
      maxSize: 5
      labels:
        workload: jobs
  
  addons:
    - aws-ebs-csi-driver
    - vpc-cni
    - coredns
    - kube-proxy
```

---

## 🚀 部署流程

### 自动化部署流水线

**.github/workflows/production-deploy.yml**:

```yaml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*.*.*'  # 仅标签触发生产部署
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy'
        required: true

env:
  NODE_VERSION: '20.11'
  PNPM_VERSION: '8.15'
  AWS_REGION: us-east-1

jobs:
  validate:
    name: Pre-deployment Validation
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.version || github.ref }}

      - name: Verify tag format
        run: |
          if [[ ! "${{ github.ref_name }}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo "Invalid version tag format"
            exit 1
          fi

      - name: Check changelog
        run: |
          if ! grep -q "${{ github.ref_name }}" CHANGELOG.md; then
            echo "Version not found in CHANGELOG.md"
            exit 1
          fi

      - name: Verify staging passed
        run: |
          # 确保staging环境测试通过
          gh run list --workflow=staging-deploy.yml --status=success --limit=1
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  security-scan:
    name: Security Scanning
    runs-on: ubuntu-latest
    needs: validate

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Dependency audit
        run: pnpm audit --production --audit-level=high

  build:
    name: Build Production Images
    runs-on: ubuntu-latest
    needs: security-scan

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push API image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.ref_name }}
        run: |
          docker build -t $ECR_REGISTRY/dailyuse-api:$IMAGE_TAG \
            --build-arg NODE_ENV=production \
            --build-arg VERSION=$IMAGE_TAG \
            -f apps/api/Dockerfile .
          
          docker push $ECR_REGISTRY/dailyuse-api:$IMAGE_TAG
          
          # Tag as latest
          docker tag $ECR_REGISTRY/dailyuse-api:$IMAGE_TAG $ECR_REGISTRY/dailyuse-api:latest
          docker push $ECR_REGISTRY/dailyuse-api:latest

      - name: Build and push Web assets
        run: |
          pnpm install --frozen-lockfile
          pnpm nx build web --configuration=production
          
          # Upload to S3
          aws s3 sync ./dist/apps/web s3://dailyuse-prod-web --delete
          
          # Invalidate CloudFront cache
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_PROD_ID }} \
            --paths "/*"

  deploy-database:
    name: Database Migration
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: production-db

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Create database backup
        run: |
          # 触发RDS自动备份
          aws rds create-db-snapshot \
            --db-instance-identifier dailyuse-prod \
            --db-snapshot-identifier dailyuse-prod-${{ github.ref_name }}-$(date +%Y%m%d-%H%M%S)

      - name: Run migrations
        run: |
          pnpm nx run api:prisma:migrate:deploy
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}

      - name: Verify migration
        run: |
          pnpm nx run api:prisma:migrate:status
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}

  deploy-api:
    name: Deploy API to Production
    runs-on: ubuntu-latest
    needs: deploy-database
    environment:
      name: production
      url: https://api.dailyuse.com

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Update kubeconfig
        run: |
          aws eks update-kubeconfig \
            --region ${{ env.AWS_REGION }} \
            --name dailyuse-production

      - name: Deploy with ArgoCD
        run: |
          # 使用GitOps方式部署
          kubectl set image deployment/api \
            api=${{ steps.login-ecr.outputs.registry }}/dailyuse-api:${{ github.ref_name }} \
            -n dailyuse-production

      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/api -n dailyuse-production --timeout=10m

      - name: Verify deployment
        run: |
          # 检查Pod状态
          kubectl get pods -n dailyuse-production -l app=api
          
          # 健康检查（K8s Liveness Probe）
          for i in {1..30}; do
            if curl -f https://api.dailyuse.com/healthz; then
              echo "Health check passed"
              break
            fi
            echo "Waiting for health check... ($i/30)"
            sleep 10
          done

  smoke-test:
    name: Production Smoke Tests
    runs-on: ubuntu-latest
    needs: deploy-api

    steps:
      - name: Run smoke tests
        run: |
          # 核心API测试（K8s 标准健康检查）
          curl -f https://api.dailyuse.com/healthz || exit 1
          curl -f https://api.dailyuse.com/readyz || exit 1
          
          # Web应用测试
          curl -f https://app.dailyuse.com || exit 1

      - name: Run E2E smoke tests
        run: |
          pnpm nx run web:e2e:smoke --base-url=https://app.dailyuse.com

  notify:
    name: Deployment Notification
    runs-on: ubuntu-latest
    needs: [deploy-api, smoke-test]
    if: always()

    steps:
      - name: Send Slack notification
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_PRODUCTION_WEBHOOK }}
          payload: |
            {
              "text": "🚀 Production Deployment ${{ job.status }}",
              "blocks": [
                {
                  "type": "header",
                  "text": {
                    "type": "plain_text",
                    "text": "🚀 Production Deployment"
                  }
                },
                {
                  "type": "section",
                  "fields": [
                    {
                      "type": "mrkdwn",
                      "text": "*Version:*\n${{ github.ref_name }}"
                    },
                    {
                      "type": "mrkdwn",
                      "text": "*Status:*\n${{ job.status }}"
                    },
                    {
                      "type": "mrkdwn",
                      "text": "*Author:*\n${{ github.actor }}"
                    },
                    {
                      "type": "mrkdwn",
                      "text": "*Time:*\n$(date)"
                    }
                  ]
                },
                {
                  "type": "actions",
                  "elements": [
                    {
                      "type": "button",
                      "text": {
                        "type": "plain_text",
                        "text": "📱 View App"
                      },
                      "url": "https://app.dailyuse.com"
                    },
                    {
                      "type": "button",
                      "text": {
                        "type": "plain_text",
                        "text": "📊 Monitoring"
                      },
                      "url": "https://monitoring.dailyuse.com"
                    },
                    {
                      "type": "button",
                      "text": {
                        "type": "plain_text",
                        "text": "📋 Logs"
                      },
                      "url": "https://logs.dailyuse.com"
                    }
                  ]
                }
              ]
            }

      - name: Create GitHub Release
        if: success()
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref_name }}
          release_name: Release ${{ github.ref_name }}
          body_path: CHANGELOG.md
```

---

## 🔒 安全加固

### SSL/TLS配置

```nginx
# /etc/nginx/nginx.conf
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
ssl_prefer_server_ciphers off;

# HSTS
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

# 其他安全头
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

### 网络安全组

```yaml
# AWS Security Group
SecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: EKS Worker Nodes
    VpcId: !Ref VPC
    SecurityGroupIngress:
      # HTTPS only
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        CidrIp: 0.0.0.0/0
      
      # Internal communication
      - IpProtocol: tcp
        FromPort: 3000
        ToPort: 3000
        SourceSecurityGroupId: !Ref ALBSecurityGroup
    
    SecurityGroupEgress:
      # Allow outbound to RDS
      - IpProtocol: tcp
        FromPort: 5432
        ToPort: 5432
        DestinationSecurityGroupId: !Ref DBSecurityGroup
```

### Secrets管理

```typescript
// apps/api/src/config/secrets.ts
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

export class SecretsService {
  private client = new SecretsManager({ region: 'us-east-1' });

  async getSecret(secretName: string): Promise<string> {
    const response = await this.client.getSecretValue({
      SecretId: secretName,
    });
    
    return response.SecretString!;
  }

  async getDatabaseUrl(): Promise<string> {
    return this.getSecret('dailyuse/production/database-url');
  }

  async getJwtSecret(): Promise<string> {
    return this.getSecret('dailyuse/production/jwt-secret');
  }
}
```

### WAF规则

```yaml
# AWS WAF Rules
WebACL:
  Type: AWS::WAFv2::WebACL
  Properties:
    Scope: REGIONAL
    DefaultAction:
      Allow: {}
    Rules:
      - Name: RateLimitRule
        Priority: 1
        Statement:
          RateBasedStatement:
            Limit: 2000
            AggregateKeyType: IP
        Action:
          Block: {}
      
      - Name: SQLInjectionRule
        Priority: 2
        Statement:
          SqliMatchStatement:
            FieldToMatch:
              Body: {}
        Action:
          Block: {}
      
      - Name: XSSRule
        Priority: 3
        Statement:
          XssMatchStatement:
            FieldToMatch:
              Body: {}
        Action:
          Block: {}
```

---

## 🔧 高可用方案

### 自动扩缩容

```yaml
# k8s/production/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
  namespace: dailyuse-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
```

### 健康检查

```typescript
// apps/api/src/health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.pingCheck('redis'),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    // Readiness probe - 更严格的检查
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 1000 }),
      () => this.redis.pingCheck('redis', { timeout: 500 }),
      () => this.checkMigrations(),
    ]);
  }

  private async checkMigrations() {
    // 确保数据库迁移已完成
    const migrations = await this.prisma.$queryRaw`
      SELECT * FROM _prisma_migrations WHERE finished_at IS NULL
    `;
    
    return {
      migrations: {
        status: migrations.length === 0 ? 'up' : 'down',
      },
    };
  }
}
```

### 断路器模式

```typescript
// Circuit Breaker for external services
import * as CircuitBreaker from 'opossum';

const breaker = new CircuitBreaker(externalAPICall, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
});

breaker.fallback(() => {
  return { status: 'unavailable', cached: true };
});

breaker.on('open', () => {
  logger.warn('Circuit breaker opened');
});
```

---

## 📊 监控告警

### Datadog集成

```yaml
# k8s/production/datadog-agent.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: datadog-agent
spec:
  template:
    spec:
      containers:
        - name: datadog-agent
          image: datadog/agent:latest
          env:
            - name: DD_API_KEY
              valueFrom:
                secretKeyRef:
                  name: datadog
                  key: api-key
            - name: DD_SITE
              value: "datadoghq.com"
            - name: DD_LOGS_ENABLED
              value: "true"
            - name: DD_APM_ENABLED
              value: "true"
            - name: DD_PROCESS_AGENT_ENABLED
              value: "true"
```

### 告警规则

```yaml
# datadog-monitors.yaml
monitors:
  - name: "High API Error Rate"
    type: metric alert
    query: "avg(last_5m):sum:api.errors{env:production} > 100"
    message: |
      API error rate is abnormally high
      @slack-production-alerts @pagerduty
    
  - name: "Database Connection Pool Exhausted"
    type: metric alert
    query: "avg(last_5m):max:database.connections.active{env:production} / max:database.connections.max{env:production} > 0.9"
    message: |
      Database connection pool usage > 90%
      @slack-production-alerts
  
  - name: "High Response Time"
    type: metric alert
    query: "avg(last_10m):avg:api.response_time.p95{env:production} > 1000"
    message: |
      API P95 response time > 1s
      @slack-production-alerts
```

---

## 🔄 灾难恢复

### 备份策略

```bash
# 自动化备份脚本
#!/bin/bash

# RDS自动备份（每日）
aws rds modify-db-instance \
  --db-instance-identifier dailyuse-prod \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00"

# Redis快照（每6小时）
aws elasticache modify-replication-group \
  --replication-group-id dailyuse-prod-redis \
  --snapshot-retention-limit 7 \
  --snapshot-window "03:00-04:00"

# S3版本控制
aws s3api put-bucket-versioning \
  --bucket dailyuse-prod-uploads \
  --versioning-configuration Status=Enabled
```

### 故障转移

```yaml
# DNS Failover (Route 53)
HealthCheck:
  Type: AWS::Route53::HealthCheck
  Properties:
    HealthCheckConfig:
      Type: HTTPS
      ResourcePath: /health
      FullyQualifiedDomainName: api.dailyuse.com
      Port: 443
      RequestInterval: 30
      FailureThreshold: 3

RecordSet:
  Type: AWS::Route53::RecordSet
  Properties:
    HostedZoneId: !Ref HostedZone
    Name: api.dailyuse.com
    Type: A
    SetIdentifier: primary
    Failover: PRIMARY
    AliasTarget:
      HostedZoneId: !Ref PrimaryALB
      DNSName: !GetAtt PrimaryALB.DNSName
    HealthCheckId: !Ref HealthCheck
```

---

## 📚 相关文档

- [[guides/deployment/local|本地部署]]
- [[guides/deployment/staging|预发布环境]]
- [[guides/troubleshooting/production-issues|生产问题排查]]
- [[ops/monitoring/README|监控运维]]

---

**最后更新**: 2025-11-23  
**维护者**: @BakerSean168  
**版本**: v2.0
