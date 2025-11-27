/**
 * Web 应用日志配置
 * 使用 @dailyuse/utils 的跨平台日志系统（浏览器环境）
 */

import { LoggerFactory, ConsoleTransport, HttpTransport, LogLevel } from '@dailyuse/utils';

const isDevelopment = import.meta.env.DEV;
const logLevel = import.meta.env.VITE_LOG_LEVEL || (isDevelopment ? 'debug' : 'warn');
const apiUrl = import.meta.env.VITE_API_URL || '/api';

/**
 * 初始化浏览器日志系统
 */
export function initializeLogger(): void {
  LoggerFactory.configure({
    level: logLevel as any,
    enableInProduction: true, // 启用生产环境日志（发送到服务器）
    transports: [
      // 控制台传输器
      new ConsoleTransport({
        level: LogLevel.DEBUG,
        colorize: true,
        timestamp: true,
      }),
      // HTTP 传输器 (发送到 API)
      new HttpTransport({
        url: `${apiUrl}/logs`,
        level: LogLevel.INFO, // 仅发送 INFO 及以上级别
        batchSize: 5,
        flushInterval: 3000,
      }),
    ],
  });
}

/**
 * 获取应用启动信息
 */
export function getStartupInfo(): Record<string, any> {
  return {
    environment: import.meta.env.MODE,
    isDevelopment,
    logLevel,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    version: import.meta.env.VITE_APP_VERSION || 'unknown',
  };
}
