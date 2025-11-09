/**
 * SSE 模块初始化任务注册
 * @description 为 SSE 客户端注册初始化任务到应用级别的初始化管理器中
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { sseClient } from '../infrastructure/sse/SSEClient';

/**
 * 注册 SSE 模块的初始化任务
 */
export function registerSSEInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // SSE 连接初始化任务 - 在用户登录后建立连接
  // ⚠️ 已禁用：SSE 连接由 NotificationInitializationManager 统一管理，避免重复连接
  /*
  const sseConnectionTask: InitializationTask = {
    name: 'sse-connection',
    phase: InitializationPhase.USER_LOGIN,
    priority: 15, // 在用户登录后、业务模块初始化之前建立 SSE 连接
    initialize: async () => {
      console.log('🔗 [SSE] 开始初始化 SSE 连接...');

      try {
        // 在浏览器环境中建立 SSE 连接
        if (typeof window !== 'undefined') {
          await sseClient.connect();
          console.log('✅ [SSE] SSE 连接初始化完成');
        } else {
          console.log('⚠️ [SSE] 非浏览器环境，跳过 SSE 连接');
        }
      } catch (error) {
        console.error('❌ [SSE] SSE 连接初始化失败:', error);
        // SSE 连接失败不应该阻断整个应用启动
        console.log('⚠️ [SSE] 将在后台尝试重新连接');
      }
    },
    cleanup: async () => {
      console.log('🧹 [SSE] 清理 SSE 连接...');

      try {
        sseClient.destroy();
        console.log('✅ [SSE] SSE 连接清理完成');
      } catch (error) {
        console.error('❌ [SSE] SSE 连接清理失败:', error);
      }
    },
  };
  */

  // SSE 事件监听器注册任务
  const sseEventHandlersTask: InitializationTask = {
    name: 'sse-event-handlers',
    phase: InitializationPhase.USER_LOGIN,
    priority: 15, // 在用户登录后注册事件监听器
    initialize: async (context) => {
      console.log(`🎧 [SSE] 注册用户 SSE 事件监听器: ${context?.accountUuid}`);

      try {
        // 这里可以注册用户特定的事件监听器
        // 例如：只处理当前用户的调度任务事件
        console.log('✅ [SSE] 用户 SSE 事件监听器注册完成');
      } catch (error) {
        console.error('❌ [SSE] 用户 SSE 事件监听器注册失败:', error);
      }
    },
    cleanup: async (context) => {
      console.log(`🔇 [SSE] 清理用户 SSE 事件监听器: ${context?.accountUuid}`);

      try {
        // 清理用户特定的事件监听器
        console.log('✅ [SSE] 用户 SSE 事件监听器清理完成');
      } catch (error) {
        console.error('❌ [SSE] 用户 SSE 事件监听器清理失败:', error);
      }
    },
  };

  // SSE 连接健康检查任务
  // ⚠️ 已禁用：SSE 连接由 NotificationInitializationManager 统一管理
  /*
  const sseHealthCheckTask: InitializationTask = {
    name: 'sse-health-check',
    phase: InitializationPhase.USER_LOGIN,
    priority: 90, // 低优先级，在其他任务完成后执行
    initialize: async () => {
      console.log('🏥 [SSE] 执行 SSE 连接健康检查...');

      try {
        if (typeof window !== 'undefined') {
          const status = sseClient.getStatus();
          console.log('[SSE] 连接状态:', status);

          if (!status.connected) {
            console.log('[SSE] 连接未建立，尝试重新连接...');
            await sseClient.connect();
          }

          console.log('✅ [SSE] SSE 连接健康检查完成');
        }
      } catch (error) {
        console.error('❌ [SSE] SSE 连接健康检查失败:', error);
      }
    },
    cleanup: async () => {
      // 健康检查任务无需特殊清理
    },
  };
  */

  // 注册事件监听器任务（保留）
  manager.registerTask(sseEventHandlersTask);
  
  // ⚠️ 以下任务已禁用，由 NotificationInitializationManager 统一管理
  // manager.registerTask(sseConnectionTask);
  // manager.registerTask(sseHealthCheckTask);

  console.log('📝 [SSE] SSE 模块初始化任务已注册（仅事件监听器）');
}
