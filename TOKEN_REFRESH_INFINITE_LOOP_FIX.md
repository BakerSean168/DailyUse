# Token Refresh 无限循环修复报告

## 🔴 问题诊断

### 问题1：SSE Token 过期无限循环
**症状**：
```
[SSE Client] ⚠️ Access token 已过期，需要刷新
[SSE Client] 📝 Token 即将过期，等待刷新后重连
[SSE Client] 🔄 Token 刷新完成，尝试重新连接
[SSE Client] ⚠️ Access token 已过期，需要刷新
... (无限循环)
```

**根本原因**：
1. SSE 连接前检测到 Access Token 过期
2. `scheduleTokenRefreshReconnect()` 等待 2 秒后重试
3. 2 秒后 token 仍然过期（因为自动刷新失败）
4. 再次调用 `scheduleTokenRefreshReconnect()` → **无限循环**

### 问题2：Refresh Token 500 错误
**错误信息**：
```
POST http://localhost:3888/api/v1/auth/refresh 500 (Internal Server Error)
{
  "code": 500,
  "success": false,
  "message": "Session refresh failed",
  "timestamp": 1763111591690
}
```

**根本原因**：
后端查询数据库时发现：
```typescript
const session = await this.sessionRepository.findByRefreshToken(request.refreshToken);
if (!session) {
  throw new Error('Session not found or expired'); // ← 这里抛出异常
}
```

**可能的原因**：
1. **Refresh Token 已过期**（7 天期限已到）
2. **Session 已被删除**（数据库清理或手动删除）
3. **Refresh Token 不匹配**（数据库中找不到对应记录）

## ✅ 解决方案

### 修复1：SSE 客户端 - 停止无限循环，等待事件触发

**修改文件**：`apps/web/src/modules/notification/infrastructure/sse/SSEClient.ts`

**修改前**：
```typescript
private scheduleTokenRefreshReconnect(): void {
  console.log('[SSE Client] 📝 Token 即将过期，等待刷新后重连');
  
  // 等待 2 秒让 interceptor 自动刷新 token
  this.reconnectTimer = setTimeout(() => {
    if (!this.isDestroyed) {
      console.log('[SSE Client] 🔄 Token 刷新完成，尝试重新连接');
      this.reconnectAttempts = 0;
      this.disconnect();
      this.connectInBackground(); // ← 这里导致无限循环
    }
  }, 2000);
}
```

**修改后**：
```typescript
private scheduleTokenRefreshReconnect(): void {
  console.log('[SSE Client] 📝 Token 已过期，等待系统自动刷新后重连（监听 auth:token-refreshed 事件）');
  
  // 🔥 不再自动重试！等待 auth:token-refreshed 事件触发重连
  // 清除现有连接
  if (this.eventSource) {
    this.eventSource.close();
    this.eventSource = null;
  }
  
  this.isConnecting = false;
  
  // 清除定时器
  if (this.reconnectTimer) {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }
  if (this.connectTimeout) {
    clearTimeout(this.connectTimeout);
    this.connectTimeout = null;
  }
}
```

**效果**：
- ✅ 停止无限循环
- ✅ 等待 `auth:token-refreshed` 事件触发重连
- ✅ 如果 Refresh Token 也过期，不会卡死，会正常跳转登录页

### 修复2：用户需要重新登录

**原因**：Refresh Token 已过期（7 天期限），无法自动刷新

**解决步骤**：
1. 清除浏览器存储的旧 token
2. 重新登录
3. 获取新的 Access Token 和 Refresh Token

**操作方法**：
```javascript
// 在浏览器控制台执行
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');
location.href = '/auth/login';
```

或者等待自动跳转（Axios 拦截器检测到 Refresh Token 失败后会自动清除并跳转登录页）。

## 🔍 深层问题分析

### 为什么 Refresh Token 会过期？

**Refresh Token 生命周期**：
```typescript
// 后端生成 Refresh Token 时设置 7 天有效期
const refreshTokenPayload = {
  accountUuid: account.uuid,
  type: 'refresh',
  iat: Math.floor(Date.now() / 1000),
  jti: refreshToken.jti,
  iss: 'dailyuse-api',
  aud: 'dailyuse-client',
  purpose: 'token-refresh',
  exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 天
};
```

**可能导致过期的场景**：
1. **用户 7 天未登录**：最常见的情况
2. **系统时间不同步**：服务器和客户端时间差异导致提前过期
3. **Session 被清理**：数据库定期清理过期 Session
4. **手动登出**：用户在其他设备登出，Session 被撤销

### 后端 Session 查询失败的可能原因

**查询逻辑**：
```typescript
// SessionManagementApplicationService.ts
const session = await this.sessionRepository.findByRefreshToken(request.refreshToken);
if (!session) {
  throw new Error('Session not found or expired'); // 500 错误
}
```

**数据库查询**：
```typescript
// AuthSessionRepository.ts
async findByRefreshToken(refreshToken: string): Promise<AuthSession | null> {
  const sessionData = await this.prisma.authSession.findFirst({
    where: {
      refreshToken: refreshToken,
      revokedAt: null, // 未被撤销
    },
  });
  
  if (!sessionData) {
    return null; // ← 这里返回 null
  }
  
  return AuthSession.reconstitute(sessionData);
}
```

**可能原因**：
1. ❌ **数据库中没有匹配的记录**
2. ❌ **Session 已被撤销**（`revokedAt` 不为 null）
3. ❌ **Refresh Token 字符串不匹配**（复制粘贴错误或损坏）

## 📝 最佳实践建议

### 1. 改进 Token 过期处理

**问题**：后端返回 500 错误不够友好，应该返回 401 Unauthorized

**建议修改**：
```typescript
// SessionManagementApplicationService.ts
async refreshSession(request: RefreshSessionRequest): Promise<RefreshSessionResponse> {
  try {
    const session = await this.sessionRepository.findByRefreshToken(request.refreshToken);
    if (!session) {
      // 🔥 抛出特定的错误类型，而不是通用 Error
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    
    // ...
  } catch (error) {
    if (error instanceof UnauthorizedException) {
      // 返回 401 而不是 500
      throw error;
    }
    
    logger.error('[SessionManagementApplicationService] Session refresh failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
```

### 2. 添加 Refresh Token 过期提醒

**前端添加友好提示**：
```typescript
// interceptors.ts
private async handleUnauthorized(): Promise<void> {
  LogManager.warn('Refresh Token 已过期，需要重新登录');

  // 清除令牌
  AuthManager.clearTokens();

  // 🔔 显示友好提示
  window.dispatchEvent(
    new CustomEvent('auth:session-expired', {
      detail: { 
        message: '登录已过期（7天），请重新登录',
        reason: 'refresh-token-expired'
      },
    }),
  );

  // 跳转登录页
  const { default: router } = await import('@/shared/router');
  await router.push({
    path: '/auth/login',
    query: { 
      redirect: router.currentRoute.value.fullPath,
      reason: 'session-expired' 
    },
  });
}
```

### 3. 实现 Refresh Token 自动续期

**问题**：当前 Refresh Token 固定 7 天，如果用户每天都使用，仍然会在第 7 天过期

**建议方案**：Sliding Window（滑动窗口）
```typescript
// SessionManagementApplicationService.ts
async refreshSession(request: RefreshSessionRequest): Promise<RefreshSessionResponse> {
  const session = await this.sessionRepository.findByRefreshToken(request.refreshToken);
  
  // 检查 Refresh Token 还剩多少天
  const daysUntilExpiry = (session.refreshTokenExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  
  // 如果剩余时间少于 3 天，生成新的 Refresh Token
  let newRefreshToken = session.refreshToken;
  if (daysUntilExpiry < 3) {
    console.log('[SessionManagementApplicationService] 🔄 Refresh Token 即将过期，生成新的');
    newRefreshToken = this.generateRefreshToken(session.accountUuid);
    session.refreshRefreshToken(newRefreshToken);
  }
  
  // ...
}
```

**效果**：
- 用户每次刷新 Access Token 时，如果 Refresh Token 快过期了，自动续期
- 只要用户持续使用，Refresh Token 永远不会过期
- 停止使用超过 7 天才会真正过期

### 4. 添加 Session 过期监控

**后端添加监控日志**：
```typescript
// SessionManagementApplicationService.ts
async refreshSession(request: RefreshSessionRequest): Promise<RefreshSessionResponse> {
  const session = await this.sessionRepository.findByRefreshToken(request.refreshToken);
  
  if (!session) {
    // 📊 记录 Session 查询失败的详细信息
    logger.warn('[SessionManagementApplicationService] ❌ Session not found', {
      refreshTokenPrefix: request.refreshToken.substring(0, 20) + '...',
      timestamp: new Date().toISOString(),
      // 可以添加到监控系统（如 Sentry、DataDog）
    });
    
    throw new Error('Session not found or expired');
  }
  
  // 📊 记录 Refresh Token 剩余有效期
  const expiryInfo = {
    refreshTokenExpiresAt: session.refreshTokenExpiresAt,
    daysUntilExpiry: (session.refreshTokenExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  };
  logger.info('[SessionManagementApplicationService] Refresh Token 状态', expiryInfo);
  
  // ...
}
```

## 🎯 立即行动清单

### 短期修复（已完成）✅
- [x] 修复 SSE 客户端无限循环
- [x] 停止 `scheduleTokenRefreshReconnect` 自动重试
- [x] 等待 `auth:token-refreshed` 事件触发重连

### 用户操作（需要立即执行）🔴
1. **清除浏览器存储的旧 token**
   ```javascript
   localStorage.clear(); // 或者只清除 access_token 和 refresh_token
   ```

2. **重新登录**
   - 访问 `/auth/login`
   - 输入账号密码
   - 获取新的 Access Token 和 Refresh Token

3. **验证修复效果**
   - 登录后刷新页面
   - 控制台不应再出现无限循环
   - SSE 连接应该成功建立
   - Dashboard 应该显示 6 个 Widget

### 长期优化（后续实现）📅
1. **后端改进**
   - [ ] Refresh Token 失败返回 401 而不是 500
   - [ ] 实现 Refresh Token 自动续期（Sliding Window）
   - [ ] 添加 Session 过期监控和告警

2. **前端改进**
   - [ ] 添加 Session 过期友好提示
   - [ ] 在登录页显示过期原因
   - [ ] 添加"记住我"功能（延长 Refresh Token 有效期）

3. **安全增强**
   - [ ] 迁移到 httpOnly Cookie 存储 Refresh Token
   - [ ] 实现 CSRF Token 保护
   - [ ] 添加设备指纹验证

## 🔬 调试方法

### 检查 Token 是否过期
```javascript
// 在浏览器控制台执行
const accessToken = localStorage.getItem('access_token');
const refreshToken = localStorage.getItem('refresh_token');

function decodeToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    const expired = payload.exp < now;
    const remaining = payload.exp - now;
    
    console.log({
      type: payload.type,
      accountUuid: payload.accountUuid,
      exp: new Date(payload.exp * 1000).toLocaleString(),
      expired: expired,
      remainingSeconds: remaining,
      remainingDays: (remaining / (24 * 60 * 60)).toFixed(2)
    });
  } catch (e) {
    console.error('Token 解析失败:', e);
  }
}

console.log('Access Token:');
decodeToken(accessToken);

console.log('\nRefresh Token:');
decodeToken(refreshToken);
```

### 检查后端 Session 记录
```sql
-- 在数据库中查询 Session
SELECT 
  uuid,
  account_uuid,
  refresh_token,
  refresh_token_expires_at,
  revoked_at,
  created_at,
  TIMESTAMPDIFF(DAY, NOW(), refresh_token_expires_at) AS days_until_expiry
FROM auth_sessions
WHERE account_uuid = 'YOUR_ACCOUNT_UUID'
ORDER BY created_at DESC
LIMIT 5;
```

---

**修复时间**：2025-11-14  
**问题严重性**：🔴 高（影响用户体验，导致无限循环）  
**修复状态**：✅ 前端修复完成，等待用户重新登录验证
