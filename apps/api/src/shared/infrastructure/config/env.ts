/**
 * @file env.ts
 * @description 环境变量统一加载和验证模块
 * 
 * 加载优先级（后面覆盖前面）：
 * 1. .env                    - 共享默认值
 * 2. .env.{NODE_ENV}         - 环境特定配置
 * 3. .env.local              - 本地覆盖（.gitignore）
 * 4. .env.{NODE_ENV}.local   - 环境特定本地覆盖（.gitignore）
 * 
 * @date 2025-12-22
 */

import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { envSchema, type Env } from './env.schema.js';
import { ZodError } from 'zod';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 项目根目录（从 apps/api/src/shared/infrastructure/config 向上 6 级）
const PROJECT_ROOT = resolve(__dirname, '../../../../../../');
// API 应用目录
const API_ROOT = resolve(__dirname, '../../../../');

/**
 * 加载 .env 文件
 * @param filePath 文件路径
 * @param override 是否覆盖已有环境变量
 */
function loadEnvFile(filePath: string, override = true): void {
  if (existsSync(filePath)) {
    expand(config({ path: filePath, override }));
  }
}

/**
 * 按优先级加载所有 .env 文件
 */
function loadAllEnvFiles(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // 定义加载顺序（优先级从低到高）
  const envFiles = [
    // 项目根目录
    resolve(PROJECT_ROOT, '.env'),
    resolve(PROJECT_ROOT, `.env.${nodeEnv}`),
    resolve(PROJECT_ROOT, '.env.local'),
    resolve(PROJECT_ROOT, `.env.${nodeEnv}.local`),
    
    // API 应用目录（更高优先级）
    resolve(API_ROOT, '.env'),
    resolve(API_ROOT, `.env.${nodeEnv}`),
    resolve(API_ROOT, '.env.local'),
    resolve(API_ROOT, `.env.${nodeEnv}.local`),
  ];
  
  // 按顺序加载，后面的覆盖前面的
  envFiles.forEach(file => loadEnvFile(file, true));
}

/**
 * 格式化 Zod 验证错误
 */
function formatZodError(error: ZodError): string {
  const issues = error.issues.map(issue => {
    const path = issue.path.join('.');
    return `  - ${path}: ${issue.message}`;
  });
  
  return `环境变量验证失败:\n${issues.join('\n')}`;
}

/**
 * 验证并返回环境变量
 */
function validateEnv(): Env {
  // 先加载所有 .env 文件
  loadAllEnvFiles();
  
  try {
    // 使用 Zod Schema 验证
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('\n' + '='.repeat(60));
      console.error('🚨 环境变量配置错误');
      console.error('='.repeat(60));
      console.error(formatZodError(error));
      console.error('='.repeat(60));
      console.error('\n请检查 .env 文件配置是否正确\n');
      console.error('参考: .env.example 或 .env.development\n');
      
      // 在非测试环境下退出
      if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
      }
    }
    throw error;
  }
}

/**
 * 已验证的环境变量单例
 * 应用启动时加载一次，后续直接使用
 */
export const env: Env = validateEnv();

/**
 * 判断是否为开发环境
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * 判断是否为生产环境
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * 判断是否为测试环境
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * 获取 Redis 连接配置
 * 优先使用 REDIS_URL，否则使用分解配置
 */
export function getRedisConfig() {
  if (env.REDIS_URL) {
    return { url: env.REDIS_URL };
  }
  
  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
  };
}

/**
 * 获取 CORS 允许的来源列表
 */
export function getCorsOrigins(): string[] {
  return env.CORS_ORIGIN
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * 判断是否允许所有跨域来源
 */
export function isAllCorsOriginsAllowed(): boolean {
  return getCorsOrigins().includes('*');
}

/**
 * 获取 JWT 配置
 */
export function getJwtConfig() {
  return {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    refreshSecret: env.REFRESH_TOKEN_SECRET || env.JWT_SECRET,
  };
}

// 导出 schema 供测试使用
export { envSchema } from './env.schema.js';
export type { Env, PartialEnv } from './env.schema.js';
