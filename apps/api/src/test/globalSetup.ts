/**
 * API 全局测试设置
 * @description 在所有测试运行前进行全局初始化（使用真实PostgreSQL数据库）
 */

import { execSync } from 'node:child_process';
import path from 'node:path';

export default async function globalSetup() {
  console.log('🧪 API 测试环境初始化（真实数据库模式）...');

  try {
    // 设置测试环境变量
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://test_user:test_pass@localhost:5433/dailyuse_test';
    process.env.JWT_SECRET = 'test-jwt-secret-key';

    console.log('📦 初始化 Prisma 数据库 schema...');
    
    // 使用 prisma db push 同步 schema (跳过migration history检查)
    // 注意: 需要在apps/api目录执行,因为schema.prisma在那里
    const apiDir = path.join(process.cwd(), 'apps/api');
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      stdio: 'inherit',
      cwd: apiDir, // 在apps/api目录执行
      shell: process.env.SHELL || '/usr/bin/bash', // 使用系统 shell
      env: {
        ...process.env,
        DATABASE_URL: 'postgresql://test_user:test_pass@localhost:5433/dailyuse_test',
      },
    });

    console.log('✅ API 测试环境初始化完成（真实数据库模式）');
  } catch (error) {
    console.error('❌ API 测试环境初始化失败:', error);
    throw error; // 如果数据库初始化失败,终止测试
  }
}
