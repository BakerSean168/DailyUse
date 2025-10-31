/**
 * 事件系统使用示例
 * Event System Usage Example
 */

import { eventBus } from '@dailyuse/utils';
import {
  publishUserLoggedInEvent,
  AUTH_EVENTS,
  type UserLoggedInEventPayload,
} from '../../modules/authentication';
import { useAccountStore } from '../../modules/account';
import { AppInitializationManager } from '../initialization/AppInitializationManager';

/**
 * 模拟登录流程示例
 */
export async function simulateLoginFlow() {
  console.log('🎬 [Example] 开始模拟登录流程');

  // 1. 模拟用户登录成功后的数据
  const mockAuthResponse = {
    accountUuid: 'account-uuid-12345',
    username: 'demo_user',
    sessionUuid: 'session-uuid-67890',
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    refreshToken: 'refresh-token-example',
    expiresIn: 3600,
  };

  // 2. 发布登录成功事件
  publishUserLoggedInEvent({
    ...mockAuthResponse,
    loginTime: new Date(),
  });

  console.log('📤 [Example] 登录事件已发布，账户模块将自动处理');

  // 3. 等待一段时间，观察账户模块的处理结果
  setTimeout(() => {
    const accountStore = useAccountStore();
    console.log('📊 [Example] 当前账户状态:', {
      accountUuid: accountStore.currentAccount?.uuid,
      hasAccount: !!accountStore.currentAccount,
      loading: accountStore.isLoading,
      error: accountStore.error,
    });
  }, 2000);
}

/**
 * 手动监听事件示例
 */
export function setupEventListeners() {
  console.log('👂 [Example] 设置事件监听器');

  // 监听登录事件
  eventBus.on(AUTH_EVENTS.USER_LOGGED_IN, (payload: UserLoggedInEventPayload) => {
    console.log('🔔 [Example] 收到登录事件通知:', {
      username: payload.username,
      accountUuid: payload.accountUuid,
      loginTime: payload.loginTime,
    });
  });

  // 监听登出事件
  eventBus.on(AUTH_EVENTS.USER_LOGGED_OUT, (payload) => {
    console.log('🔔 [Example] 收到登出事件通知:', payload);
  });

  console.log('✅ [Example] 事件监听器设置完成');
}

/**
 * 清理事件监听器
 */
export function cleanupEventListeners() {
  console.log('🧹 [Example] 清理事件监听器');

  // 清理所有监听器
  eventBus.off(AUTH_EVENTS.USER_LOGGED_IN);
  eventBus.off(AUTH_EVENTS.USER_LOGGED_OUT);

  console.log('✅ [Example] 事件监听器已清理');
}

/**
 * 显示事件系统状态
 */
export function showEventBusStatus() {
  const stats = eventBus.getStats();

  console.log('📊 [Example] 事件总线状态:', {
    注册的处理器数量: stats.handlersCount,
    监听器数量: stats.listenersCount,
    待处理请求数量: stats.pendingRequestsCount,
    已注册的处理器: stats.registeredHandlers,
    已注册的事件: stats.registeredEvents,
  });
}

/**
 * 显示初始化管理器状态
 */
export function showInitializationStatus() {
  const manager = AppInitializationManager.getManager();
  const allTasks = AppInitializationManager.listAllTasks();

  console.log('� [Example] 初始化管理器状态:', {
    应用是否已初始化: AppInitializationManager.isInitialized(),
    总任务数: allTasks.length,
    按阶段分组的任务数: allTasks.reduce(
      (acc, task) => {
        acc[task.phase] = (acc[task.phase] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    已完成的任务: allTasks
      .filter((task) => AppInitializationManager.isTaskCompleted(task.name))
      .map((task) => task.name),
    正在运行的任务: allTasks
      .filter((task) => manager.isTaskRunning(task.name))
      .map((task) => task.name),
    所有任务名称: allTasks.map((task) => ({
      name: task.name,
      phase: task.phase,
      priority: task.priority,
      dependencies: task.dependencies,
    })),
  });
}

/**
 * 测试用户会话生命周期
 */
export async function testUserSessionLifecycle() {
  console.log('🔄 [Example] 开始测试用户会话生命周期');

  const mockAccountUuid = 'demo-account-uuid-12345';

  try {
    // 1. 初始化用户会话
    await AppInitializationManager.initializeUserSession(mockAccountUuid);
    console.log('✅ [Example] 用户会话初始化完成');

    // 2. 等待一段时间
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 3. 清理用户会话
    await AppInitializationManager.cleanupUserSession();
    console.log('🧹 [Example] 用户会话清理完成');
  } catch (error) {
    console.error('❌ [Example] 用户会话生命周期测试失败:', error);
  }
}

// 浏览器控制台使用说明
if (typeof window !== 'undefined') {
  // 将函数暴露到全局对象，方便在控制台测试
  (window as any).eventDemo = {
    simulateLogin: simulateLoginFlow,
    setupListeners: setupEventListeners,
    cleanup: cleanupEventListeners,
    showStatus: showEventBusStatus,
    showInitStatus: showInitializationStatus,
    testSessionLifecycle: testUserSessionLifecycle,
  };

  console.log(`
🎯 事件系统演示功能已加载到 window.eventDemo
可以在浏览器控制台中使用以下命令：

// 模拟登录流程
eventDemo.simulateLogin()

// 设置事件监听器
eventDemo.setupListeners()

// 查看事件总线状态
eventDemo.showStatus()

// 查看初始化管理器状态
eventDemo.showInitStatus()

// 测试用户会话生命周期
eventDemo.testSessionLifecycle()

// 清理监听器
eventDemo.cleanup()
  `);
}
