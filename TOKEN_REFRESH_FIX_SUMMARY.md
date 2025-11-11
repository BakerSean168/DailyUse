# Token Refresh 问题修复总结

## 🔍 问题发现

用户在测试 Token 认证时发现：

1. ✅ `access_token` 和 `refresh_token` 在 localStorage 中格式正确（使用 JWT）
2. ✅ CORS 配置已添加 `X-Skip-Auth` 头
3. ❌ 刷新 token 时仍然报 **401 错误**

## 🎯 根本原因

**后端缺少 `/auth/refresh` 路由！**

检查发现：

```bash
$ grep -n "'/refresh'" apps/api/src/modules/authentication/interface/http/authenticationRoutes.ts
# 没有任何输出 - 路由不存在！
```

前端在调用 `POST /auth/refresh`，但后端没有注册这个端点，导致 404 或被处理为 401 错误。

## 🔧 修复方案

### 1. 添加 SessionManagementController 导入

```typescript
// apps/api/src/modules/authentication/interface/http/authenticationRoutes.ts

import { SessionManagementController } from './SessionManagementController'; // ✅ 新增
```

### 2. 注册 Refresh 路由

```typescript
/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: 刷新访问令牌
 *     description: 使用 refresh token 刷新 access token
 */
router.post('/refresh', SessionManagementController.refreshSession); // ✅ 新增
```

完整位置：在 `router.post('/logout-all', ...)` 之后

## 📝 关键理解

### Refresh Token 的认证方式

**问题：** 为什么 refresh 请求会报 401？它需要 token 吗？

**答案：** Refresh 请求**不需要 Access Token**，但**需要 Refresh Token**：

#### 认证流程对比

| 端点            | 认证方式          | Token 位置                      | 是否需要 authMiddleware |
| --------------- | ----------------- | ------------------------------- | ----------------------- |
| `/auth/login`   | 用户名 + 密码     | 请求体                          | ❌ 否                   |
| `/goals`        | Access Token      | `Authorization: Bearer <token>` | ✅ 是                   |
| `/auth/refresh` | **Refresh Token** | **请求体 `{ refreshToken }`**   | ❌ 否                   |

#### Refresh 请求流程

```
前端发送：
POST /auth/refresh
Headers: {
  Content-Type: application/json,
  X-Skip-Auth: true              // 告诉前端拦截器：不要添加 Authorization
}
Body: {
  refreshToken: "refresh_jwt_token"  // ✅ Refresh Token 在这里！
}

后端处理：
1. 不经过 authMiddleware（因为 Access Token 已过期）
2. 从请求体提取 refreshToken
3. 查询数据库：SELECT * FROM sessions WHERE refresh_token_hash = hash(refreshToken)
4. 验证 Session:
   - 是否存在？
   - 是否过期？
   - 是否被撤销？
5. 验证通过 → 生成新的 Access Token 和 Refresh Token
6. 更新 Session 记录
7. 返回新的 Tokens
```

### 为什么不使用 Authorization Header？

1. **Access Token 已过期**
   - 此时的 Access Token 已经无法通过 `authMiddleware` 验证
   - 如果放在 `Authorization` header 中会被拒绝

2. **避免拦截器循环**
   - 前端拦截器会自动给请求添加 `Authorization: Bearer <accessToken>`
   - 使用 `X-Skip-Auth` 标记告诉拦截器跳过这个请求
   - Refresh Token 放在 body 中，不会被拦截器处理

3. **符合 OAuth 2.0 规范**
   - RFC 6749 规定 Refresh Token 应该在请求体中传递
   - 与标准的 Token Refresh 流程保持一致

### 常见误区

❌ **错误理解：** Refresh 请求需要在 header 中传递 Refresh Token

```typescript
// 错误示例
axios.post(
  '/auth/refresh',
  {},
  {
    headers: {
      Authorization: `Bearer ${refreshToken}`, // ❌ 错误！
    },
  },
);
```

✅ **正确理解：** Refresh Token 在请求体中传递

```typescript
// 正确示例
axios.post(
  '/auth/refresh',
  {
    refreshToken: refreshToken, // ✅ 正确！
  },
  {
    headers: {
      'X-Skip-Auth': 'true', // 避免拦截器添加 Access Token
    },
  },
);
```

## 🧪 测试验证

### 方法 1：使用测试脚本

```bash
./test-token-refresh.sh
```

这个脚本会：

1. ✅ 登录获取 Tokens
2. ✅ 调用 /auth/refresh 刷新 Tokens
3. ✅ 验证新的 Access Token 可用
4. ✅ 对比新旧 Tokens 的差异
5. ✅ 测试无效 Refresh Token 的处理

### 方法 2：手动测试

```bash
# 1. 登录
curl -X POST http://localhost:3888/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test_user", "password": "Test@123456"}'

# 2. 提取 refresh_token 并刷新
curl -X POST http://localhost:3888/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your_refresh_token_here"}'

# 3. 预期响应
{
  "code": 200,
  "data": {
    "sessionUuid": "...",
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token",
    "expiresAt": 1234567890
  },
  "message": "Session refreshed successfully"
}
```

### 方法 3：浏览器测试

```javascript
// 打开浏览器 Console

// 1. 获取 Refresh Token
const refreshToken = localStorage.getItem('refresh_token');

// 2. 调用 Refresh 端点
fetch('http://localhost:3888/api/v1/auth/refresh', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ refreshToken }),
})
  .then((res) => res.json())
  .then((data) => {
    console.log('✅ Refresh Success:', data);
    // 更新 localStorage
    localStorage.setItem('access_token', data.data.accessToken);
    localStorage.setItem('refresh_token', data.data.refreshToken);
  })
  .catch((err) => console.error('❌ Refresh Failed:', err));
```

## 📚 文档更新

已更新文档：

- **主文档**: `/docs/authentication/TOKEN_REFRESH_AND_SKIP_AUTH_HEADER.md`
  - ✅ 添加了完整的 Refresh 认证流程说明
  - ✅ 添加了"问题 4：刷新请求也返回 401 错误"章节
  - ✅ 详细说明了 Refresh Token 的传递方式
  - ✅ 提供了完整的修复指南
  - ✅ 添加了调试步骤和常见错误排查表

- **测试脚本**: `/test-token-refresh.sh`
  - ✅ 自动化测试 Token Refresh 流程
  - ✅ 验证新旧 Tokens 的差异
  - ✅ 测试错误处理

## ✅ 完成清单

- [x] 添加 SessionManagementController 导入
- [x] 注册 `/auth/refresh` 路由
- [x] 添加 Swagger 文档注释
- [x] 更新认证流程文档
- [x] 创建测试脚本
- [x] 解释 Refresh Token 认证方式
- [x] 说明为什么 Refresh Token 在请求体中

## 🎉 修复后的效果

1. **前端自动刷新**
   - Access Token 过期 → 自动调用 `/auth/refresh` → 获取新 Tokens → 重试原始请求
   - 用户无感知，不需要重新登录

2. **安全性保证**
   - Refresh Token 只在必要时使用
   - Access Token 短期有效（1小时）
   - Refresh Token 长期有效（7天）
   - Session 可以被撤销（登出、全设备登出）

3. **错误处理**
   - Refresh Token 过期 → 清理本地 Tokens → 跳转登录页
   - Session 被撤销 → 清理本地 Tokens → 跳转登录页
   - 网络错误 → 显示错误提示

## 🔗 相关资源

- **主文档**: `/docs/authentication/TOKEN_REFRESH_AND_SKIP_AUTH_HEADER.md`
- **测试脚本**: `/test-token-refresh.sh`
- **路由文件**: `/apps/api/src/modules/authentication/interface/http/authenticationRoutes.ts`
- **Controller**: `/apps/api/src/modules/authentication/interface/http/SessionManagementController.ts`
- **Service**: `/apps/api/src/modules/authentication/application/services/SessionManagementApplicationService.ts`
- **前端拦截器**: `/apps/web/src/shared/api/core/interceptors.ts`

## 💡 下一步

1. **测试完整流程**

   ```bash
   # 启动 API 服务器
   nx serve api

   # 运行测试脚本
   ./test-token-refresh.sh
   ```

2. **前端测试**
   - 登录应用
   - 等待 Access Token 过期（或手动删除）
   - 发起需要认证的请求
   - 观察 Network 面板中的自动刷新流程

3. **边缘情况测试**
   - Refresh Token 过期后的处理
   - 全设备登出后的处理
   - 并发请求时的队列机制
