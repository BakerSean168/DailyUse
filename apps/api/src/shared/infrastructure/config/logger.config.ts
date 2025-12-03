/**
 * API 日志配置
 * 使用 @dailyuse/utils 的跨平台日志系统 (Winston 实现)
 */

import { LoggerFactory } from '@dailyuse/utils';
import { WinstonLogger } from '@dailyuse/utils/winston';

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = (process.env.LOG_LEVEL as any) || (isProduction ? 'info' : 'debug');

/**
 * 初始化日志系统
 */
export function initializeLogger(): void {
  // 注册 WinstonLogger 提供者
  LoggerFactory.registerProvider((context) => {
    const logger = new WinstonLogger(context);
    // WinstonLogger 内部已经配置了 Console 和 DailyRotateFile
    return logger;
  });

  LoggerFactory.configure({
    level: logLevel,
    enableInProduction: true,
  });
}

/**
 * 获取应用启动信息
 */
export function getStartupInfo(): Record<string, any> {
  return {
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform,
    logLevel,
    timestamp: new Date().toISOString(),
  };
}
