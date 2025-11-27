# API 响应处理系统文档

> **模块**: @dailyuse/utils/response  
> **版本**: 1.0  
> **类型**: 后端工具库

---

## 📋 概述

标准化的 HTTP 响应构建工具，确保 API 响应格式一致，简化 Controller 层的代码。

### 核心特性

- **统一格式**: 所有 API 返回一致的 JSON 结构。
- **类型安全**: 泛型支持，确保 data 字段类型正确。
- **分页支持**: 内置分页响应构建器。
- **Express 集成**: 提供 `ExpressResponseHelper` 简化 Express 使用。

---

## 💻 使用指南

### Express 集成

```typescript
import { ExpressResponseHelper } from '@dailyuse/utils';

// 成功响应
app.get('/api/goals', async (req, res) => {
  const goals = await goalService.findAll();
  ExpressResponseHelper.success(res, goals);
});

// 错误响应
app.get('/api/error', async (req, res) => {
  try {
    throw new Error('Something went wrong');
  } catch (error) {
    ExpressResponseHelper.error(res, error);
  }
});

// 分页响应
app.get('/api/goals/paginated', async (req, res) => {
  const { data, total } = await goalService.findPaginated(req.query);
  ExpressResponseHelper.paginated(res, data, {
    page: req.query.page,
    pageSize: req.query.pageSize,
    total,
  });
});
```

### 响应格式规范

#### 成功响应
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2025-10-28T12:00:00Z"
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  },
  "timestamp": "2025-10-28T12:00:00Z"
}
```

#### 分页响应
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```
