---
tags:
  - reference
  - api
  - rest
  - swagger
description: API参考文档 - RESTful API完整接口说明与使用示例
created: 2025-11-23T17:40:00
updated: 2025-11-23T17:40:00
---

# 🔌 API参考文档 - API Reference

> DailyUse RESTful API完整接口文档

## 📋 目录

- [API概述](#api概述)
- [认证授权](#认证授权)
- [通用规范](#通用规范)
- [核心模块API](#核心模块api)
- [错误处理](#错误处理)
- [速率限制](#速率限制)

---

## 🎯 API概述

### 基础信息

| 项目 | 值 |
|------|-----|
| **基础URL** | `https://api.dailyuse.com` |
| **协议** | HTTPS |
| **API版本** | v1 |
| **API前缀** | `/api` |
| **数据格式** | JSON |
| **字符编码** | UTF-8 |
| **Swagger文档** | `https://api.dailyuse.com/api-docs` |

### 快速开始

```bash
# 获取访问令牌
curl -X POST https://api.dailyuse.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# 使用令牌访问API
curl https://api.dailyuse.com/api/goals \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🔐 认证授权

### 认证方式

DailyUse API使用**JWT Bearer Token**认证。

**请求头格式**:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 获取Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**响应**:

```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "张三"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 刷新Token

```http
POST /api/auth/refresh
Cookie: refreshToken=...
```

**响应**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 权限说明

某些端点需要特定权限：

| 权限 | 说明 |
|------|------|
| `goal:read` | 读取目标 |
| `goal:create` | 创建目标 |
| `goal:update` | 更新目标 |
| `goal:delete` | 删除目标 |
| `user:read` | 读取用户信息 |
| `admin:*` | 管理员权限 |

---

## 📐 通用规范

### 请求格式

**Content-Type**: `application/json`

```http
POST /api/goals
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "完成项目开发",
  "description": "在12月前完成所有功能"
}
```

### 响应格式

**成功响应** (2xx):

```json
{
  "data": {
    "id": "goal-123",
    "title": "完成项目开发",
    "createdAt": "2025-11-23T10:00:00.000Z"
  }
}
```

**错误响应** (4xx/5xx):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "标题不能为空",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      }
    ]
  },
  "statusCode": 400,
  "timestamp": "2025-11-23T10:00:00.000Z",
  "path": "/api/goals"
}
```

### HTTP状态码

| 状态码 | 说明 |
|--------|------|
| **200 OK** | 请求成功 |
| **201 Created** | 资源创建成功 |
| **204 No Content** | 请求成功，无返回内容 |
| **400 Bad Request** | 请求参数错误 |
| **401 Unauthorized** | 未认证或Token无效 |
| **403 Forbidden** | 权限不足 |
| **404 Not Found** | 资源不存在 |
| **409 Conflict** | 资源冲突 |
| **422 Unprocessable Entity** | 业务逻辑错误 |
| **429 Too Many Requests** | 请求过于频繁 |
| **500 Internal Server Error** | 服务器错误 |

### 分页

**请求参数**:

```http
GET /api/goals?page=1&limit=20&sortBy=createdAt&order=desc
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码（从1开始） |
| `limit` | number | 20 | 每页数量（1-100） |
| `sortBy` | string | `createdAt` | 排序字段 |
| `order` | string | `desc` | 排序方向（asc/desc） |

**响应格式**:

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 过滤与搜索

```http
GET /api/goals?status=active&search=项目&tags=work,urgent
```

| 参数 | 说明 |
|------|------|
| `status` | 状态过滤 |
| `search` | 全文搜索 |
| `tags` | 标签过滤（逗号分隔） |
| `createdAfter` | 创建时间范围 |

---

## 🎯 核心模块API

### 认证模块 (Authentication)

详见: [[reference/api/authentication|认证API文档]]

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 登出
- `POST /api/auth/refresh` - 刷新Token
- `GET /api/auth/me` - 获取当前用户
- `POST /api/auth/change-password` - 修改密码
- `POST /api/auth/forgot-password` - 忘记密码

### 目标模块 (Goals)

详见: [[reference/api/goal|目标API文档]]

- `GET /api/goals` - 获取目标列表
- `GET /api/goals/:id` - 获取目标详情
- `POST /api/goals` - 创建目标
- `PATCH /api/goals/:id` - 更新目标
- `DELETE /api/goals/:id` - 删除目标
- `POST /api/goals/:id/complete` - 完成目标
- `GET /api/goals/:id/progress` - 获取进度

### 任务模块 (Tasks)

详见: [[reference/api/task|任务API文档]]

- `GET /api/tasks` - 获取任务列表
- `GET /api/tasks/:id` - 获取任务详情
- `POST /api/tasks` - 创建任务
- `PATCH /api/tasks/:id` - 更新任务
- `DELETE /api/tasks/:id` - 删除任务
- `POST /api/tasks/:id/start` - 开始任务
- `POST /api/tasks/:id/complete` - 完成任务
- `POST /api/tasks/:id/defer` - 延期任务

### 日程模块 (Schedule)

详见: [[reference/api/schedule|日程API文档]]

- `GET /api/schedule/events` - 获取日程列表
- `GET /api/schedule/events/:id` - 获取日程详情
- `POST /api/schedule/events` - 创建日程
- `PATCH /api/schedule/events/:id` - 更新日程
- `DELETE /api/schedule/events/:id` - 删除日程
- `GET /api/schedule/calendar` - 获取日历视图
- `POST /api/schedule/events/:id/recurrence` - 设置重复规则

### 提醒模块 (Reminders)

详见: [[reference/api/reminder|提醒API文档]]

- `GET /api/reminders` - 获取提醒列表
- `GET /api/reminders/:id` - 获取提醒详情
- `POST /api/reminders` - 创建提醒
- `PATCH /api/reminders/:id` - 更新提醒
- `DELETE /api/reminders/:id` - 删除提醒
- `POST /api/reminders/:id/snooze` - 延后提醒
- `POST /api/reminders/:id/dismiss` - 忽略提醒

### 通知模块 (Notifications)

详见: [[reference/api/notification|通知API文档]]

- `GET /api/notifications` - 获取通知列表
- `GET /api/notifications/:id` - 获取通知详情
- `PATCH /api/notifications/:id/read` - 标记已读
- `POST /api/notifications/read-all` - 全部标记已读
- `DELETE /api/notifications/:id` - 删除通知
- `GET /api/notifications/unread-count` - 未读数量
- `GET /api/notifications/stream` - SSE实时通知流

---

## ❌ 错误处理

### 错误码规范

```typescript
enum ErrorCode {
  // 通用错误 (1000-1999)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  
  // 认证错误 (2000-2999)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // 业务错误 (3000-3999)
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  
  // 速率限制 (4000-4999)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}
```

### 错误响应示例

**验证错误** (400):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": [
      {
        "field": "title",
        "message": "标题长度必须在1-100个字符之间",
        "value": ""
      },
      {
        "field": "dueDate",
        "message": "截止日期必须是未来时间",
        "value": "2024-01-01"
      }
    ]
  },
  "statusCode": 400,
  "timestamp": "2025-11-23T10:00:00.000Z",
  "path": "/api/goals"
}
```

**权限错误** (403):

```json
{
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "您没有权限执行此操作",
    "requiredPermissions": ["goal:delete"]
  },
  "statusCode": 403,
  "timestamp": "2025-11-23T10:00:00.000Z",
  "path": "/api/goals/goal-123"
}
```

---

## ⏱ 速率限制

### 限制规则

| 端点类型 | 限制 | 窗口期 |
|---------|------|--------|
| **认证端点** | 5次/分钟 | 1分钟 |
| **读操作** | 100次/分钟 | 1分钟 |
| **写操作** | 30次/分钟 | 1分钟 |
| **全局限制** | 1000次/小时 | 1小时 |

### 响应头

每个API响应包含速率限制信息：

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700745600
```

### 超限响应

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "请求过于频繁，请稍后重试",
    "retryAfter": 60
  },
  "statusCode": 429,
  "timestamp": "2025-11-23T10:00:00.000Z"
}
```

---

## 🧪 测试环境

### Staging API

```
Base URL: https://api-staging.dailyuse.app
Swagger: https://api-staging.dailyuse.app/api-docs
```

### 测试账号

```
Email: test@dailyuse.app
Password: TestPassword123!
```

---

## 📚 相关文档

- [[modules/authentication/README|认证模块]]
- [[modules/goal/README|目标模块]]
- [[modules/task/README|任务模块]]
- [[modules/schedule/README|日程模块]]
- [[guides/development/testing|API测试指南]]

---

## 🔗 交互式文档

访问 **Swagger UI** 进行交互式API测试：

- **生产环境**: https://api.dailyuse.com/api-docs
- **Staging环境**: https://api-staging.dailyuse.app/api-docs

---

**最后更新**: 2025-11-23  
**API版本**: v1.0.0  
**维护者**: @BakerSean168
