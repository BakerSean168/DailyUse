/**
 * API 测试环境配置（真实数据库版本）
 * @description 使用真实 PostgreSQL 数据库进行测试
 */

import { beforeEach, afterEach, vi } from 'vitest';

beforeEach(async () => {
  // 设置环境变量
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.DATABASE_URL = 'postgresql://test_user:test_pass@localhost:5433/dailyuse_test';

  // 设置时区为 UTC
  process.env.TZ = 'UTC';
});

afterEach(async () => {
  // 清理模拟
  vi.restoreAllMocks();
});

// API 测试工具函数
export const ApiTestHelpers = {
  /**
   * 创建测试用的 Express 应用
   */
  createTestApp: async () => {
    const appModule = await import('../app.js');
    return appModule.default || appModule;
  },

  /**
   * 创建测试用的认证 Token
   */
  createTestToken: async (payload = { accountUuid: 'test-user-123' }) => {
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'test-secret';
    return jwt.sign(payload, secret, { expiresIn: '1h' });
  },

  /**
   * 模拟认证中间件
   */
  mockAuth: (accountUuid = 'test-user-123') => {
    return (req: any, res: any, next: any) => {
      req.user = { accountUuid };
      next();
    };
  },
};

console.log('🧪 API 测试环境初始化完成（真实数据库模式）');
