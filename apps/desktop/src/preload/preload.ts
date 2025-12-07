/**
 * Electron Preload Script
 *
 * 遵循 ADR-006: 使用 contextBridge 安全暴露 API
 * 遵循 Electron 安全最佳实践
 *
 * 这个 preload 脚本暴露一个通用的 IPC 接口，
 * 与 @dailyuse/infrastructure-client 的 ElectronAPI 类型匹配。
 */

import { contextBridge, ipcRenderer } from 'electron';

// ========== IPC 通道白名单 ==========
// 只允许这些通道进行通信，提高安全性

const ALLOWED_CHANNELS = [
  // App
  'app:getInfo',
  'app:checkDIStatus',
  'system:getDIStatus',
  'system:getAppVersion',

  // Goal
  'goal:create',
  'goal:list',
  'goal:get',
  'goal:update',
  'goal:delete',
  'goal:activate',
  'goal:pause',
  'goal:complete',
  'goal:archive',
  'goal:search',
  'goal:keyResult:add',
  'goal:keyResult:list',
  'goal:keyResult:update',
  'goal:keyResult:delete',
  'goal:keyResult:batchUpdateWeights',
  'goal:progressBreakdown',
  'goal:review:create',
  'goal:review:list',
  'goal:review:update',
  'goal:review:delete',
  'goal:record:create',
  'goal:record:listByKeyResult',
  'goal:record:listByGoal',
  'goal:record:delete',
  'goal:aggregate',
  'goal:clone',

  // Goal Folder
  'goalFolder:create',
  'goalFolder:list',
  'goalFolder:get',
  'goalFolder:update',
  'goalFolder:delete',

  // Task Template
  'task-template:create',
  'task-template:list',
  'task-template:get',
  'task-template:update',
  'task-template:delete',
  'task-template:activate',
  'task-template:pause',
  'task-template:archive',
  'task-template:generate-instances',
  'task-template:get-instances',
  'task-template:bind-goal',
  'task-template:unbind-goal',

  // Task Instance
  'task-instance:list',
  'task-instance:get',
  'task-instance:delete',
  'task-instance:start',
  'task-instance:complete',
  'task-instance:skip',
  'task-instance:check-expired',

  // Task Dependency
  'task-dependency:create',
  'task-dependency:list',
  'task-dependency:dependents',
  'task-dependency:chain',
  'task-dependency:validate',
  'task-dependency:delete',
  'task-dependency:update',

  // Task Statistics
  'task-statistics:get',
  'task-statistics:recalculate',
  'task-statistics:delete',
  'task-statistics:update-template',
  'task-statistics:update-instance',
  'task-statistics:update-completion',
  'task-statistics:today-rate',
  'task-statistics:week-rate',
  'task-statistics:efficiency-trend',

  // Schedule Task
  'schedule:task:create',
  'schedule:task:create-batch',
  'schedule:task:get-all',
  'schedule:task:get-by-id',
  'schedule:task:get-due',
  'schedule:task:get-by-source',
  'schedule:task:pause',
  'schedule:task:resume',
  'schedule:task:complete',
  'schedule:task:cancel',
  'schedule:task:delete',
  'schedule:task:delete-batch',
  'schedule:task:update-metadata',
  'schedule:statistics:get',
  'schedule:statistics:get-module',
  'schedule:statistics:get-all-modules',
  'schedule:statistics:recalculate',
  'schedule:statistics:reset',
  'schedule:statistics:delete',

  // Schedule Event
  'schedule:event:create',
  'schedule:event:get',
  'schedule:event:get-by-account',
  'schedule:event:get-by-time-range',
  'schedule:event:update',
  'schedule:event:delete',
  'schedule:event:get-conflicts',
  'schedule:event:detect-conflicts',
  'schedule:event:create-with-conflict-detection',
  'schedule:event:resolve-conflict',

  // Reminder
  'reminder:template:create',
  'reminder:template:get',
  'reminder:template:get-all',
  'reminder:template:get-by-user',
  'reminder:template:update',
  'reminder:template:delete',
  'reminder:template:toggle',
  'reminder:template:move',
  'reminder:template:search',
  'reminder:template:schedule-status',
  'reminder:upcoming:get',
  'reminder:group:create',
  'reminder:group:get',
  'reminder:group:get-all',
  'reminder:group:get-by-user',
  'reminder:group:update',
  'reminder:group:delete',
  'reminder:group:toggle-status',
  'reminder:group:toggle-control-mode',
  'reminder:statistics:get',

  // Account
  'account:create',
  'account:get',
  'account:get-all',
  'account:delete',
  'account:me:get',
  'account:me:update',
  'account:me:change-password',
  'account:profile:update',
  'account:preferences:update',
  'account:email:update',
  'account:email:verify',
  'account:phone:update',
  'account:phone:verify',
  'account:deactivate',
  'account:suspend',
  'account:activate',
  'account:subscription:get',
  'account:subscription:subscribe',
  'account:subscription:cancel',
  'account:history:get',
  'account:stats:get',

  // Authentication
  'auth:login',
  'auth:register',
  'auth:logout',
  'auth:refresh-token',
  'auth:forgot-password',
  'auth:reset-password',
  'auth:change-password',
  'auth:2fa:enable',
  'auth:2fa:disable',
  'auth:2fa:verify',
  'auth:api-key:create',
  'auth:api-key:list',
  'auth:api-key:revoke',
  'auth:session:list',
  'auth:session:revoke',
  'auth:session:revoke-all',
  'auth:device:trust',
  'auth:device:revoke',
  'auth:device:list',

  // Notification
  'notification:create',
  'notification:find-all',
  'notification:find-by-uuid',
  'notification:mark-read',
  'notification:mark-all-read',
  'notification:delete',
  'notification:batch-delete',
  'notification:unread-count',

  // Dashboard
  'dashboard:get-all',
  'dashboard:get-overview',
  'dashboard:get-today',
  'dashboard:get-stats',
  'dashboard:statistics:get',
  'dashboard:statistics:refresh',
  'dashboard:config:get',
  'dashboard:config:update',
  'dashboard:config:reset',

  // Repository
  'repository:create',
  'repository:list',
  'repository:get',
  'repository:delete',
  'repository:folder:create',
  'repository:folder:contents',
  'repository:folder:rename',
  'repository:folder:move',
  'repository:folder:delete',
  'repository:tree',
  'repository:search',
  'repository:resource:get',
  'repository:resource:rename',
  'repository:resource:move',
  'repository:resource:delete',

  // Setting
  'setting:user:get',
  'setting:user:appearance',
  'setting:user:locale',
  'setting:user:workflow',
  'setting:user:privacy',
  'setting:user:reset',
  'setting:app:get',
  'setting:sync',
  'setting:export',
  'setting:import',

  // AI Conversation
  'ai:conversation:create',
  'ai:conversation:list',
  'ai:conversation:get',
  'ai:conversation:update',
  'ai:conversation:delete',
  'ai:conversation:close',
  'ai:conversation:archive',

  // AI Message
  'ai:message:send',
  'ai:message:list',
  'ai:message:delete',
  'ai:message:stream:start',
  'ai:message:stream:next',
  'ai:message:stream:end',

  // AI Generation
  'ai:generation-task:create',
  'ai:generation-task:list',
  'ai:generation-task:get',
  'ai:generation-task:cancel',
  'ai:generation-task:retry',
  'ai:generate:goal',
  'ai:generate:goal-with-key-results',
  'ai:generate:key-results',
  'ai:generateKeyResults',

  // AI Provider
  'ai:provider:create',
  'ai:provider:list',
  'ai:provider:get',
  'ai:provider:update',
  'ai:provider:delete',
  'ai:provider:test-connection',
  'ai:provider:set-default',
  'ai:provider:refresh-models',

  // AI Quota
  'ai:quota:get',
  'ai:quota:update-limit',
  'ai:quota:check',

  // STORY-10: Desktop Features
  'desktop:autoLaunch:isEnabled',
  'desktop:autoLaunch:enable',
  'desktop:autoLaunch:disable',
  'desktop:shortcuts:getAll',
  'desktop:shortcuts:update',
  'desktop:tray:flash',
  'desktop:tray:stopFlash',

  // EPIC-003: Performance Monitoring
  'system:getLazyModuleStats',
  'system:getMemoryUsage',
  'system:getIpcCacheStats',
  'cache:stats',
  'cache:clear',
  'cache:invalidate',
  'dev:memory:status',
  'dev:memory:snapshots',
  'dev:memory:force-gc',
] as const;

type AllowedChannel = (typeof ALLOWED_CHANNELS)[number];

// 创建 Set 用于快速查找
const allowedChannelsSet = new Set<string>(ALLOWED_CHANNELS);

/**
 * 检查通道是否在白名单中
 */
function isAllowedChannel(channel: string): channel is AllowedChannel {
  return allowedChannelsSet.has(channel);
}

// 事件监听器映射
const eventListeners = new Map<string, Set<(...args: unknown[]) => void>>();

/**
 * 暴露给渲染进程的 API
 *
 * 匹配 @dailyuse/infrastructure-client 的 ElectronAPI 接口
 */
const electronAPI = {
  /**
   * 通用 IPC invoke 方法
   * 用于请求-响应式通信
   */
  invoke: <T = unknown>(channel: string, ...args: unknown[]): Promise<T> => {
    if (!isAllowedChannel(channel)) {
      return Promise.reject(new Error(`IPC channel "${channel}" is not allowed`));
    }
    return ipcRenderer.invoke(channel, ...args);
  },

  /**
   * 注册事件监听器
   * 用于接收主进程推送的消息
   */
  on: (channel: string, callback: (...args: unknown[]) => void): void => {
    if (!isAllowedChannel(channel)) {
      console.warn(`IPC channel "${channel}" is not allowed for listening`);
      return;
    }

    // 包装回调以移除 event 参数
    const wrappedCallback = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
      callback(...args);
    };

    // 存储映射关系以便后续移除
    if (!eventListeners.has(channel)) {
      eventListeners.set(channel, new Set());
    }
    eventListeners.get(channel)!.add(callback);

    // 存储原始回调到包装回调的映射
    (callback as unknown as { __wrapped: typeof wrappedCallback }).__wrapped = wrappedCallback;

    ipcRenderer.on(channel, wrappedCallback);
  },

  /**
   * 移除事件监听器
   */
  off: (channel: string, callback: (...args: unknown[]) => void): void => {
    const wrappedCallback = (callback as unknown as { __wrapped: (...args: unknown[]) => void }).__wrapped;
    if (wrappedCallback) {
      ipcRenderer.removeListener(channel, wrappedCallback);
    }

    // 从映射中移除
    eventListeners.get(channel)?.delete(callback);
  },

  // ========== 便捷方法（兼容旧代码）==========
  
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
  checkDIStatus: () => ipcRenderer.invoke('app:checkDIStatus'),
};

// 安全地暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// 类型声明
export type ElectronAPI = typeof electronAPI;
