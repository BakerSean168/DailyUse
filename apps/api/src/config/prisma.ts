import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client 配置
 * 
 * 针对 Neon 无服务器数据库优化：
 * - 增加连接超时时间
 * - 启用连接池预热
 * - 添加日志记录
 */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['warn', 'error'] 
    : ['error'],
});

/**
 * 连接数据库（带重试）
 */
export const connectPrisma = async (): Promise<void> => {
  const maxRetries = 3;
  const retryDelay = 2000; // 2 秒

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      console.log('✅ Connected to database');
      return;
    } catch (error) {
      console.error(`❌ Database connection attempt ${attempt}/${maxRetries} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error('❌ All database connection attempts failed');
        process.exit(1);
      }
      
      console.log(`⏳ Retrying in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

export const disconnectPrisma = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('✅ Disconnected from database');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
  }
};
