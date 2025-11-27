# 前端 API 工具系统文档

> **模块**: @dailyuse/utils/frontend  
> **版本**: 1.0  
> **类型**: 前端工具库

---

## 📋 概述

提供了一套用于处理 API 请求的辅助工具，简化了 Axios/Fetch 的使用，统一了认证、重试和错误处理逻辑。

### 核心功能

- **环境配置**: 自动获取 API Base URL, Timeout 等配置。
- **认证头**: 快速生成 Bearer Token Header。
- **重试机制**: 智能的指数退避重试策略。
- **错误处理**: 网络错误检测。

---

## 💻 使用指南

### 基础用法

```typescript
import { 
  getEnvironmentConfig, 
  createAuthHeader, 
  shouldRetry, 
  exponentialBackoff 
} from '@dailyuse/utils';

// 1. 获取配置
const config = getEnvironmentConfig();
// => { apiBaseUrl: 'http://localhost:3000/api/v1', ... }

// 2. 构建请求头
const headers = createAuthHeader(userToken);
```

### 实现重试逻辑

```typescript
async function fetchWithRetry(url: string, options: any) {
  let attempt = 0;
  const maxAttempts = 3;

  while (true) {
    try {
      return await fetch(url, options);
    } catch (error) {
      attempt++;
      if (!shouldRetry(error, attempt, maxAttempts)) throw error;
      
      // 等待后重试
      const delay = exponentialBackoff(attempt);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

---

## 📝 最佳实践

1.  **统一配置**: 使用 `getEnvironmentConfig` 获取 API 地址，避免硬编码。
2.  **智能重试**: 仅对网络错误或 5xx 错误进行重试，避免对 4xx 错误重试。
3.  **指数退避**: 使用 `exponentialBackoff` 避免重试风暴。
