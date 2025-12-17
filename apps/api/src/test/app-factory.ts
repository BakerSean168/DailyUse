/**
 * API Test App Factory
 * 提供测试用的 Express 应用实例
 */

import type { Express } from 'express';

/**
 * 创建测试用的 Express 应用
 * @returns Express 应用实例
 */
export async function createApp(): Promise<Express> {
  const appModule = await import('../app.js');
  return appModule.default;
}
