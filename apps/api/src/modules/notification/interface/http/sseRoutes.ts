/**
 * SSE (Server-Sent Events) Routes
 * 通知实时推送路由
 */

import type { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { createLogger } from '@dailyuse/utils';
import type { AuthenticatedRequest } from '../../../../shared/middlewares/authMiddleware';

const logger = createLogger('SSERoutes');
const router: ExpressRouter = Router();

/**
 * SSE Token 验证中间件
 * 从 URL 参数中提取 token 并验证
 */
const sseAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
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

    try {
      const decoded = jwt.verify(token, secret) as any;

      // 验证必要字段
      if (!decoded.accountUuid) {
        return res.status(401).json({
          success: false,
          message: '无效的认证令牌：缺少用户信息',
        });
      }

      // 检查token是否过期
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        return res.status(401).json({
          success: false,
          message: '认证令牌已过期，请重新登录',
        });
      }

      // 将用户信息添加到请求对象
      (req as AuthenticatedRequest).user = {
        accountUuid: decoded.accountUuid,
        tokenType: decoded.type,
        exp: decoded.exp,
      };

      (req as AuthenticatedRequest).accountUuid = decoded.accountUuid;

      logger.debug('[SSE Auth] Token验证成功', {
        accountUuid: decoded.accountUuid,
      });

      return next();
    } catch (jwtError) {
      logger.error('[SSE Auth] JWT验证失败:', jwtError);
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌，请重新登录',
      });
    }
  } catch (error) {
    logger.error('[SSE Auth] 认证中间件错误:', error);
    return res.status(500).json({
      success: false,
      message: '认证服务异常',
    });
  }
};

/**
 * SSE 连接管理器
 * 管理所有活跃的 SSE 连接
 */
class SSEConnectionManager {
  private static instance: SSEConnectionManager;
  private connections: Map<string, Response> = new Map();

  static getInstance(): SSEConnectionManager {
    if (!SSEConnectionManager.instance) {
      SSEConnectionManager.instance = new SSEConnectionManager();
    }
    return SSEConnectionManager.instance;
  }

  /**
   * 添加连接
   */
  addConnection(accountUuid: string, res: Response): void {
    // 关闭旧连接（如果存在）
    const oldConnection = this.connections.get(accountUuid);
    if (oldConnection) {
      oldConnection.end();
      logger.info('[SSE Manager] 关闭旧连接', { accountUuid });
    }

    this.connections.set(accountUuid, res);
    logger.info('[SSE Manager] 新连接建立', {
      accountUuid,
      totalConnections: this.connections.size,
    });
  }

  /**
   * 移除连接
   */
  removeConnection(accountUuid: string): void {
    this.connections.delete(accountUuid);
    logger.info('[SSE Manager] 连接移除', {
      accountUuid,
      totalConnections: this.connections.size,
    });
  }

  /**
   * 发送消息给指定用户
   */
  sendMessage(accountUuid: string, event: string, data: any): boolean {
    const connection = this.connections.get(accountUuid);
    if (!connection) {
      logger.warn('[SSE Manager] 连接不存在', { accountUuid });
      return false;
    }

    try {
      connection.write(`event: ${event}\n`);
      connection.write(`data: ${JSON.stringify(data)}\n\n`);
      logger.debug('[SSE Manager] 消息已发送', { accountUuid, event });
      return true;
    } catch (error) {
      logger.error('[SSE Manager] 发送消息失败', { accountUuid, error });
      this.removeConnection(accountUuid);
      return false;
    }
  }

  /**
   * 广播消息给所有用户
   */
  broadcast(event: string, data: any): void {
    logger.info('[SSE Manager] 广播消息', {
      event,
      connections: this.connections.size,
    });

    for (const [accountUuid, connection] of this.connections) {
      try {
        connection.write(`event: ${event}\n`);
        connection.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (error) {
        logger.error('[SSE Manager] 广播失败', { accountUuid, error });
        this.removeConnection(accountUuid);
      }
    }
  }

  /**
   * 获取连接数
   */
  getConnectionCount(): number {
    return this.connections.size;
  }
}

/**
 * @swagger
 * /api/notifications/sse/events:
 *   get:
 *     summary: SSE 通知推送连接
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: JWT 访问令牌
 *     responses:
 *       200:
 *         description: SSE 连接建立成功
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       401:
 *         description: 认证失败
 */
router.get('/events', sseAuthMiddleware, (req: Request, res: Response) => {
  const accountUuid = (req as AuthenticatedRequest).accountUuid!;

  logger.info('[SSE] 新的SSE连接请求', { accountUuid });

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // 禁用 nginx 缓冲

  // 发送初始连接消息
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ message: '连接成功', accountUuid })}\n\n`);

  // 添加到连接管理器
  const manager = SSEConnectionManager.getInstance();
  manager.addConnection(accountUuid, res);

  // 设置心跳，每30秒发送一次
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch (error) {
      logger.error('[SSE] 心跳发送失败', { accountUuid, error });
      clearInterval(heartbeatInterval);
      manager.removeConnection(accountUuid);
    }
  }, 30000);

  // 连接关闭时清理
  req.on('close', () => {
    logger.info('[SSE] 连接关闭', { accountUuid });
    clearInterval(heartbeatInterval);
    manager.removeConnection(accountUuid);
  });

  // 错误处理
  res.on('error', (error) => {
    logger.error('[SSE] 连接错误', { accountUuid, error });
    clearInterval(heartbeatInterval);
    manager.removeConnection(accountUuid);
  });
});

/**
 * 导出连接管理器供其他模块使用
 */
export { SSEConnectionManager };
export default router;
