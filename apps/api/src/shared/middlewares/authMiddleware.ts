import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * 扩展的请求接口，包含用户认证信息
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    accountUuid: string;
    tokenType?: string;
    exp?: number;
  };
  accountUuid?: string; // 向后兼容，直接提供accountUuid
}

/**
 * JWT 认证中间件
 * 从 Authorization header 中提取 JWT token，验证并解析出 accountUuid
 * 将用户信息添加到 req.user 和 req.accountUuid 中
 */
export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // 从 Authorization header 中提取 token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '缺少认证令牌，请提供有效的Authorization header',
      });
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '认证令牌不能为空',
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
      req.user = {
        accountUuid: decoded.accountUuid,
        tokenType: decoded.type,
        exp: decoded.exp,
      };

      // 向后兼容：直接提供 accountUuid
      req.accountUuid = decoded.accountUuid;

      next();
    } catch (jwtError) {
      console.error('JWT验证失败:', jwtError);
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌，请重新登录',
      });
    }
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(500).json({
      success: false,
      message: '认证服务异常',
    });
  }
};

/**
 * 可选的认证中间件
 * 如果提供了token则验证，如果没有提供则继续执行但不设置用户信息
 */
export const optionalAuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // 没有认证信息，继续执行但不设置用户信息
    return next();
  }

  // 有认证信息，使用标准认证中间件验证
  return authMiddleware(req, res, next);
};

/**
 * 检查用户是否已认证的辅助函数
 */
export const requireAuth = (req: AuthenticatedRequest): string => {
  if (!req.accountUuid || !req.user) {
    throw new Error('用户未认证，请先登录');
  }
  return req.accountUuid;
};

/**
 * 获取当前用户UUID的辅助函数
 */
export const getCurrentAccountUuid = (req: AuthenticatedRequest): string | null => {
  return req.accountUuid || null;
};
