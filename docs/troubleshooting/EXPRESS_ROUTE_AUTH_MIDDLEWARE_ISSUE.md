# Express 路由顺序导致的认证拦截问题

## 问题详情

### 问题现象
前端通过 SSE (Server-Sent Events) 连接后端时，始终返回 401 Unauthorized 错误：
```json
{
  "success": false,
  "message": "缺少认证令牌，请提供有效的Authorization header"
}
```

### 请求信息
- **URL**: `http://localhost:3888/api/v1/sse/notifications/events?token=<JWT_TOKEN>`
- **方法**: GET
- **认证方式**: Token 通过 URL 参数传递（因为 EventSource API 不支持自定义请求头）
- **错误信息**: 来自 `authMiddleware`，但该中间件不应该拦截 SSE 路由

### 问题分析

#### 初步诊断
1. **Token 有效性**: 解码 JWT token 确认未过期，payload 包含正确的 `accountUuid`
2. **路由配置**: SSE 路由已经配置为独立路径 `/sse/notifications`，理论上不应该被 `/notifications` 路由拦截
3. **日志追踪**: 添加调试日志后发现：
   - ✅ 请求到达 `app` 层：`🔍 [DEBUG] 收到请求`
   - ✅ 请求进入 API Router：`📍 [API Router] 进入 API Router`
   - ❌ **请求未到达 SSE 路由器**：没有看到 `🎯 [SSE Router] 路由器被访问!`
   - ❌ **请求未到达 sseAuthMiddleware**：没有看到 `[SSE Auth] 开始验证`

#### 根本原因定位
通过打印 API Router 的路由栈发现问题：

```javascript
🔍 [Debug] API Router 的路由栈:
  0: Middleware <anonymous>
  1: Route /health [get]
  2: Router mounted at /^\/accounts\/?(?=\/|$)/i
  3: Router mounted at /^\/auth\/?(?=\/|$)/i
  4: Middleware authMiddleware
  5: Router mounted at /^\/tasks\/?(?=\/|$)/i
  ...
  10: Router mounted at /^\/?(?=\/|$)/i          // ← 空路径路由 1
  11: Middleware authMiddleware                  // ← 全局认证中间件！
  12: Router mounted at /^\/weight-snapshots\/?(?=\/|$)/i
  ...
  23: Router mounted at /^\/?(?=\/|$)/i          // ← 空路径路由 2
  24: Router mounted at /^\/?(?=\/|$)/i          // ← 空路径路由 3
  ...
  29: Router mounted at /^\/sse\/?(?=\/|$)/i     // ← SSE 路由
  30: Middleware authMiddleware
  31: Router mounted at /^\/notifications\/?(?=\/|$)/i
```

**关键发现**：
- **第 10-11 行**：一个空路径 `''` 的路由器后面跟着 `authMiddleware`
- **第 23-24 行**：另外两个空路径路由器
- **第 29 行**：SSE 路由器在这些空路径路由器**之后**注册

### 问题根源

Express 路由匹配是**顺序敏感**的，使用空路径 `''` 注册的路由器会匹配**所有路径**。

在 `app.ts` 中发现了多个空路径路由注册：

```typescript
// ❌ 问题代码 1：空路径 + authMiddleware
api.use('', authMiddleware, weightSnapshotRouter);

// ❌ 问题代码 2：空路径路由（在 SSE 之前）
api.use('', focusSessionRouter);

// ❌ 问题代码 3：空路径路由（在 SSE 之前）
api.use('', repositoryNewRouter);
api.use('', resourceNewRouter);

// ✅ SSE 路由（但注册在空路径路由之后）
api.use('/sse', notificationSSERouter);
```

**问题链路**：
1. 请求 `/api/v1/sse/notifications/events` 到达 API Router
2. Express 按顺序匹配路由
3. 遇到第一个空路径路由 `api.use('', authMiddleware, ...)` 
4. 空路径正则 `/^\/?(?=\/|$)/i` 匹配所有路径
5. `authMiddleware` 被执行，检查 `Authorization` header
6. header 中没有 Bearer token（因为 token 在 URL 参数中）
7. 返回 401 错误，**请求被提前拦截，永远不会到达 SSE 路由器**

### 额外发现的问题

#### 问题 1：路由路径配置不一致
最初 SSE 路由配置为：
```typescript
// app.ts
api.use('/notifications/sse', notificationSSERouter);

// sseRoutes.ts
router.get('/events', ...)
```

这导致完整路径为 `/api/v1/notifications/sse/events`，但被 `/notifications` 路由拦截。

#### 问题 2：路由基础路径不匹配
后来改为：
```typescript
// app.ts
api.use('/sse/notifications', notificationSSERouter);

// sseRoutes.ts  
router.get('/events', ...)
```

Express 路由匹配逻辑：`app.use('/sse/notifications', router)` 只会将 `/sse/notifications` 后面的路径传递给 router。但我们的请求是 `/sse/notifications/events`，在 router 内部路径变成 `/events`，理论上应该匹配。但由于空路径路由在前面，请求被提前拦截。

---

## 解决方案

### 最终修复

#### 1. 移除空路径路由上的 authMiddleware
将使用空路径的路由移动到路由栈的**最后**，避免拦截其他路由：

```typescript
// ✅ 修复后：指定明确路径
api.use('/weight-snapshots', authMiddleware, weightSnapshotRouter);
```

#### 2. 调整路由注册顺序
将空路径路由移到所有具体路径路由之后：

```typescript
// app.ts
// ... 其他具体路径的路由 ...

// ✅ SSE 路由（使用具体路径）
api.use('/sse', notificationSSERouter);

// ✅ 通知路由
api.use('/notifications', authMiddleware, notificationRouter);

// ✅ 空路径路由放在最后（避免拦截其他路由）
api.use('', focusSessionRouter);
api.use('', repositoryNewRouter);
api.use('', resourceNewRouter);
```

#### 3. 统一 SSE 路由路径
```typescript
// app.ts
api.use('/sse', notificationSSERouter);

// sseRoutes.ts
router.get('/notifications/events', sseAuthMiddleware, ...)
```

最终路径：`/api/v1/sse/notifications/events` ✅

#### 4. 添加自定义认证中间件
SSE 路由使用专门的 `sseAuthMiddleware`，从 URL 参数中提取 token：

```typescript
const sseAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 从 URL 参数中获取 token
  const token = req.query.token as string;
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '缺少认证令牌，请在URL参数中提供 token',
    });
  }

  // 验证 JWT token
  const secret = process.env.JWT_SECRET || 'default-secret';
  const decoded = jwt.verify(token, secret) as any;
  
  // 将用户信息添加到请求对象
  (req as AuthenticatedRequest).user = {
    accountUuid: decoded.accountUuid,
    tokenType: decoded.type,
    exp: decoded.exp,
  };
  
  return next();
};
```

### 验证修复

重启 API 服务器后，路由栈显示正确顺序：

```javascript
🔍 [Debug] API Router 的路由栈:
  ...
  29: Router mounted at /^\/sse\/?(?=\/|$)/i           // ← SSE 路由在前
  30: Middleware authMiddleware
  31: Router mounted at /^\/notifications\/?(?=\/|$)/i
  32: Router mounted at /^\/?(?=\/|$)/i                // ← 空路径路由在后
  33: Router mounted at /^\/?(?=\/|$)/i
  34: Router mounted at /^\/?(?=\/|$)/i
```

测试请求日志：
```
🔍 [DEBUG] 收到请求: { path: '/api/v1/sse/notifications/events' }
📍 [API Router] 进入 API Router: { path: '/sse/notifications/events' }
🎯 [SSE Router] 路由器被访问! { path: '/notifications/events' }
[SSE Auth] 开始验证
[SSE Auth] Token解码成功
[SSE Auth] Token验证成功
[SSE] 新的SSE连接请求
[SSE Manager] 新连接建立
```

SSE 连接成功建立！✅

---

## 实战经验

### 调试技巧

#### 1. 添加全局请求日志
在关键位置添加日志中间件，追踪请求流转：

```typescript
// app 层
app.use((req, res, next) => {
  if (req.path.includes('sse') || req.path.includes('notifications')) {
    console.log('🔍 [DEBUG] 收到请求:', {
      method: req.method,
      path: req.path,
      url: req.url,
      query: req.query,
    });
  }
  next();
});

// API Router 层
api.use((req, res, next) => {
  console.log('📍 [API Router] 进入 API Router:', {
    path: req.path,
    baseUrl: req.baseUrl,
  });
  next();
});

// 具体路由器层
router.use((req, res, next) => {
  console.log('🎯 [SSE Router] 路由器被访问!', {
    path: req.path,
  });
  next();
});
```

#### 2. 打印路由栈
在应用启动时打印完整的路由栈，排查路由顺序问题：

```typescript
console.log('🔍 [Debug] API Router 的路由栈:');
api.stack.forEach((layer: any, index: number) => {
  if (layer.route) {
    console.log(`  ${index}: Route ${layer.route.path} [${Object.keys(layer.route.methods).join(', ')}]`);
  } else if (layer.name === 'router') {
    console.log(`  ${index}: Router mounted at ${layer.regexp}`);
  } else {
    console.log(`  ${index}: Middleware ${layer.name}`);
  }
});
```

#### 3. 逐层排查
- **第一层**：请求是否到达 Express 应用？
- **第二层**：请求是否进入 API Router？
- **第三层**：请求是否到达具体的路由器？
- **第四层**：请求是否到达路由处理函数？

通过在每一层添加日志，快速定位问题所在层级。

### 避坑指南

#### 1. 避免使用空路径注册路由
❌ **错误示例**：
```typescript
api.use('', someRouter);
api.use('', authMiddleware, anotherRouter);
```

✅ **正确示例**：
```typescript
api.use('/some-path', someRouter);
api.use('/another-path', authMiddleware, anotherRouter);
```

#### 2. 将空路径路由放在最后
如果必须使用空路径（例如某些遗留代码），将其注册在所有具体路径之后：

```typescript
// 先注册所有具体路径
api.use('/users', userRouter);
api.use('/posts', postRouter);
api.use('/sse', sseRouter);

// 最后注册空路径（fallback 路由）
api.use('', legacyRouter);
```

#### 3. 注意路由注册顺序
Express 路由是**顺序敏感**的：
- 先注册的路由优先匹配
- 一旦匹配成功，后续路由不会被检查（除非调用 `next()`）
- 中间件会按注册顺序依次执行

#### 4. 为不同认证方式使用不同路由前缀
```typescript
// JWT Bearer Token 认证
api.use('/api', authMiddleware, apiRoutes);

// URL 参数 Token 认证
api.use('/sse', sseAuthMiddleware, sseRoutes);

// 无需认证
api.use('/public', publicRoutes);
```

#### 5. 使用 Router 分组管理路由
```typescript
// 创建分组 router
const protectedRoutes = Router();
protectedRoutes.use(authMiddleware);
protectedRoutes.use('/users', userRouter);
protectedRoutes.use('/posts', postRouter);

const publicRoutes = Router();
publicRoutes.use('/auth', authRouter);
publicRoutes.use('/docs', docsRouter);

// 挂载到主应用
api.use(protectedRoutes);
api.use(publicRoutes);
```

---

## 经验总结

### Express 路由机制核心原理

#### 1. 路由匹配规则
Express 使用 `path-to-regexp` 库将路径字符串转换为正则表达式：
- `/users` → `/^\/users\/?(?=\/|$)/i`
- `/users/:id` → `/^\/users\/(?:([^\/]+?))\/?(?=\/|$)/i`
- `''` (空路径) → `/^\/?(?=\/|$)/i` （**匹配所有路径！**）

#### 2. 中间件执行顺序
```typescript
app.use(middleware1);           // 1. 全局中间件
app.use('/path', middleware2);  // 2. 路径特定中间件
app.use('/path', router);       // 3. 子路由器

router.use(middleware3);        // 4. 路由器级中间件
router.get('/sub', handler);    // 5. 路由处理函数
```

#### 3. 路径继承
```typescript
// app.ts
app.use('/api/v1', apiRouter);

// apiRouter
apiRouter.use('/users', userRouter);

// userRouter
userRouter.get('/:id', handler);

// 最终路径：/api/v1/users/:id
```

在每一层，`req.path` 会被重写为剩余路径：
- App 层：`req.path = '/api/v1/users/123'`
- API Router 层：`req.path = '/users/123'`，`req.baseUrl = '/api/v1'`
- User Router 层：`req.path = '/123'`，`req.baseUrl = '/api/v1/users'`

### 最佳实践

#### 1. 路由组织原则
- **明确性**：每个路由使用明确的路径，避免空路径
- **层次性**：使用路径前缀区分不同模块（`/api/v1/users`、`/api/v1/posts`）
- **一致性**：统一的认证中间件挂载方式
- **可维护性**：将路由定义与业务逻辑分离

#### 2. 认证中间件配置模式

**模式 1：路由级认证**（推荐）
```typescript
api.use('/protected', authMiddleware, protectedRouter);
api.use('/public', publicRouter);
```

**模式 2：Router 级认证**
```typescript
const protectedRouter = Router();
protectedRouter.use(authMiddleware);
protectedRouter.get('/resource', handler);

api.use('/protected', protectedRouter);
```

**模式 3：路由处理函数级认证**（最灵活）
```typescript
router.get('/public', publicHandler);
router.get('/protected', authMiddleware, protectedHandler);
router.get('/admin', authMiddleware, adminMiddleware, adminHandler);
```

#### 3. SSE 路由配置最佳实践
```typescript
// 1. 使用独立路径前缀
api.use('/sse', sseRouter);

// 2. 使用专门的认证中间件
router.get('/events', sseAuthMiddleware, sseHandler);

// 3. 从 URL 参数提取 token（EventSource 不支持自定义 header）
const token = req.query.token as string;

// 4. 设置正确的响应头
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
```

### 技术债务处理建议

本次问题暴露了代码中存在的技术债务：

#### 1. 立即修复
- ✅ 移除所有空路径路由上的 `authMiddleware`
- ✅ 为所有路由指定明确的路径前缀
- ✅ 调整路由注册顺序

#### 2. 短期改进
- 🔄 重构 `focusSessionRouter`、`repositoryNewRouter`、`resourceNewRouter`，为它们指定明确的路径
- 🔄 统一认证中间件的使用方式
- 🔄 添加路由单元测试，验证路由匹配逻辑

#### 3. 长期优化
- 📋 引入 API 版本控制策略（`/api/v1`、`/api/v2`）
- 📋 使用 OpenAPI 规范定义所有路由
- 📋 实现自动化路由文档生成
- 📋 添加路由性能监控

---

## 信息参考

### 官方文档
- [Express 路由指南](https://expressjs.com/en/guide/routing.html)
- [Express 中间件](https://expressjs.com/en/guide/using-middleware.html)
- [Express Router API](https://expressjs.com/en/4x/api.html#router)
- [path-to-regexp 库](https://github.com/pillarjs/path-to-regexp)

### 相关技术
- [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [JWT (JSON Web Tokens)](https://jwt.io/)

### 类似问题案例
- [Express middleware order matters](https://stackoverflow.com/questions/15601703/difference-between-app-use-and-app-get-in-express-js)
- [Express route matching with empty path](https://github.com/expressjs/express/issues/2596)
- [SSE authentication patterns](https://stackoverflow.com/questions/28176933/http-authorization-header-in-eventsource-server-sent-events)

### 调试工具
- [Express Debug Mode](https://expressjs.com/en/guide/debugging.html)：`DEBUG=express:* node app.js`
- Chrome DevTools Network 面板：查看 EventSource 连接状态
- [Postman](https://www.postman.com/)：测试 API 端点
- [curl](https://curl.se/)：命令行测试工具

### 项目内部文档
- `/docs/architecture-api.md` - API 架构设计文档
- `/docs/modules/notification/` - 通知模块文档
- `/apps/api/src/shared/middlewares/authMiddleware.ts` - 认证中间件实现
- `/apps/api/src/modules/notification/interface/http/sseRoutes.ts` - SSE 路由实现

---

## 附录：完整修复代码

### app.ts (关键部分)
```typescript
// API v1 router
const api = Router();

// ========== 具体路径路由（按字母顺序） ==========

// 账户路由
api.use('/accounts', accountRouter);

// 认证路由（无需认证）
api.use('/auth', authenticationRouter);

// 编辑器路由
api.use('/editor', authMiddleware, editorRouter);

// 目标路由
api.use('/goals', authMiddleware, goalRouter);
api.use('/goal-folders', authMiddleware, goalFolderRouter);

// 性能指标路由
api.use('/metrics', authMiddleware, metricsRouter);

// 通知路由
api.use('/notifications', authMiddleware, notificationRouter);

// 提醒路由
api.use('/reminders', authMiddleware, reminderRouter);
api.use('/reminder-groups', authMiddleware, reminderGroupRouter);

// 仓储路由
api.use('/repositories', authMiddleware, repositoryRouter);

// 调度路由
api.use('/schedules', authMiddleware, scheduleRouter);

// 设置路由
api.use('/settings', authMiddleware, settingRouter);

// SSE 路由（使用自定义认证）
api.use('/sse', notificationSSERouter);

// 任务路由
api.use('/tasks', authMiddleware, taskRouter);

// 权重快照路由
api.use('/weight-snapshots', authMiddleware, weightSnapshotRouter);

// ========== 空路径路由（放在最后，避免拦截其他路由） ==========

// 专注周期路由（遗留代码，待重构）
api.use('', focusSessionRouter);

// 新版仓储路由（待重构为明确路径）
api.use('', repositoryNewRouter);
api.use('', resourceNewRouter);

// 挂载到主应用
app.use('/api/v1', api);
```

### sseRoutes.ts (关键部分)
```typescript
import type { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('SSERoutes');
const router: ExpressRouter = Router();

/**
 * SSE Token 验证中间件
 * 从 URL 参数中提取 token 并验证
 */
const sseAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  logger.info('[SSE Auth] 开始验证', {
    method: req.method,
    url: req.url,
    hasToken: !!req.query.token,
  });

  try {
    const token = req.query.token as string;

    if (!token) {
      logger.warn('[SSE Auth] 缺少token参数');
      return res.status(401).json({
        success: false,
        message: '缺少认证令牌，请在URL参数中提供 token',
      });
    }

    const secret = process.env.JWT_SECRET || 'default-secret';
    const decoded = jwt.verify(token, secret) as any;

    if (!decoded.accountUuid) {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌：缺少用户信息',
      });
    }

    (req as AuthenticatedRequest).user = {
      accountUuid: decoded.accountUuid,
      tokenType: decoded.type,
      exp: decoded.exp,
    };
    (req as AuthenticatedRequest).accountUuid = decoded.accountUuid;

    logger.info('[SSE Auth] Token验证成功', {
      accountUuid: decoded.accountUuid,
    });

    return next();
  } catch (error) {
    logger.error('[SSE Auth] 认证中间件错误:', error);
    return res.status(500).json({
      success: false,
      message: '认证服务异常',
    });
  }
};

/**
 * SSE 事件推送端点
 * 完整路径：/api/v1/sse/notifications/events
 */
router.get('/notifications/events', sseAuthMiddleware, (req: Request, res: Response) => {
  const accountUuid = (req as AuthenticatedRequest).accountUuid!;

  logger.info('[SSE] 新的SSE连接请求', { accountUuid });

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // 发送初始连接消息
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ message: '连接成功', accountUuid })}\n\n`);

  // 添加到连接管理器
  const manager = SSEConnectionManager.getInstance();
  manager.addConnection(accountUuid, res);

  // 心跳机制
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch (error) {
      logger.error('[SSE] 心跳发送失败', { accountUuid, error });
      clearInterval(heartbeatInterval);
      manager.removeConnection(accountUuid);
    }
  }, 30000);

  // 连接关闭处理
  req.on('close', () => {
    logger.info('[SSE] 连接关闭', { accountUuid });
    clearInterval(heartbeatInterval);
    manager.removeConnection(accountUuid);
  });

  res.on('error', (error) => {
    logger.error('[SSE] 连接错误', { accountUuid, error });
    clearInterval(heartbeatInterval);
    manager.removeConnection(accountUuid);
  });
});

export default router;
```

---

**文档版本**: 1.0  
**创建时间**: 2025-11-08  
**最后更新**: 2025-11-08  
**作者**: AI Assistant  
**状态**: ✅ 已解决
