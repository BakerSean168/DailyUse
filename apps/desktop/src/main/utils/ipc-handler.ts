/**
 * IPC Handler Utilities
 *
 * 统一的 IPC handler 创建工具，提供：
 * - 自动错误处理和日志记录
 * - 类型安全的 handler 定义
 * - 简化的 handler 注册语法
 */

import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { createLogger, type ILogger } from '@dailyuse/utils';

/**
 * IPC Handler 函数类型
 */
export type IpcHandlerFn<TInput = void, TOutput = void> = TInput extends void
  ? () => Promise<TOutput> | TOutput
  : (input: TInput) => Promise<TOutput> | TOutput;

/**
 * IPC Handler 配置选项
 */
export interface IpcHandlerOptions {
  /** 自定义 logger（默认使用 channel 名称创建） */
  logger?: ILogger;
  /** 是否在错误时重新抛出异常（默认 true） */
  rethrow?: boolean;
  /** 错误时的默认返回值 */
  errorResult?: unknown;
}

/**
 * IPC Handler 定义
 */
export interface IpcHandlerDefinition<TInput = void, TOutput = void> {
  channel: string;
  handler: IpcHandlerFn<TInput, TOutput>;
  options?: IpcHandlerOptions;
}

// 全局默认 logger
const defaultLogger = createLogger('IpcHandler');

/**
 * 创建带有自动错误处理的 IPC handler
 *
 * @example
 * // 无参数
 * const handler = createIpcHandler('account:me:get', () => service.getCurrentUser());
 *
 * @example
 * // 带参数
 * const handler = createIpcHandler('account:get', (uuid: string) => service.getAccount(uuid));
 *
 * @example
 * // 带选项
 * const handler = createIpcHandler('account:get', (uuid: string) => service.getAccount(uuid), {
 *   errorResult: null,
 *   rethrow: false,
 * });
 */
export function createIpcHandler<TInput = void, TOutput = void>(
  channel: string,
  handler: IpcHandlerFn<TInput, TOutput>,
  options: IpcHandlerOptions = {},
): IpcHandlerDefinition<TInput, TOutput> {
  return { channel, handler, options };
}

/**
 * 注册单个 IPC handler
 */
export function registerIpcHandler<TInput = void, TOutput = void>(
  definition: IpcHandlerDefinition<TInput, TOutput>,
): void {
  const { channel, handler, options = {} } = definition;
  const { logger = defaultLogger, rethrow = true, errorResult } = options;

  ipcMain.handle(channel, async (_event: IpcMainInvokeEvent, ...args: unknown[]) => {
    try {
      // 根据参数数量决定如何调用 handler
      if (args.length === 0) {
        return await (handler as () => Promise<TOutput>)();
      }
      // 单参数或多参数都传递第一个参数（大多数场景是单参数对象）
      return await (handler as (input: TInput) => Promise<TOutput>)(args[0] as TInput);
    } catch (error) {
      logger.error(`IPC handler error [${channel}]`, error);
      if (rethrow && errorResult === undefined) {
        throw error;
      }
      return errorResult as TOutput;
    }
  });
}

/**
 * 批量注册 IPC handlers
 *
 * @example
 * registerIpcHandlers([
 *   createIpcHandler('account:get', (uuid) => service.getAccount(uuid)),
 *   createIpcHandler('account:create', (input) => service.createAccount(input)),
 * ], { logger: accountLogger });
 */
export function registerIpcHandlers(
  definitions: IpcHandlerDefinition<unknown, unknown>[],
  globalOptions: IpcHandlerOptions = {},
): void {
  for (const definition of definitions) {
    const mergedOptions = {
      ...globalOptions,
      ...definition.options,
    };
    registerIpcHandler({ ...definition, options: mergedOptions });
  }
}

/**
 * 创建模块 IPC handler 注册器
 *
 * 提供更简洁的 API 来注册某个模块的所有 handlers
 *
 * @example
 * const { handle, register } = createModuleIpcHandlers('Account', accountLogger);
 *
 * handle('account:get', (uuid) => service.getAccount(uuid));
 * handle('account:create', (input) => service.createAccount(input));
 *
 * register(); // 注册所有 handlers
 */
export function createModuleIpcHandlers(
  moduleName: string,
  logger?: ILogger,
): {
  handle: <TInput = void, TOutput = void>(
    channel: string,
    handler: IpcHandlerFn<TInput, TOutput>,
    options?: Omit<IpcHandlerOptions, 'logger'>,
  ) => void;
  register: () => void;
  getChannels: () => string[];
} {
  const moduleLogger = logger || createLogger(`${moduleName}IpcHandlers`);
  const handlers: IpcHandlerDefinition<unknown, unknown>[] = [];

  return {
    handle: <TInput = void, TOutput = void>(
      channel: string,
      handler: IpcHandlerFn<TInput, TOutput>,
      options: Omit<IpcHandlerOptions, 'logger'> = {},
    ) => {
      handlers.push({
        channel,
        handler: handler as IpcHandlerFn<unknown, unknown>,
        options: { ...options, logger: moduleLogger },
      });
    },

    register: () => {
      moduleLogger.info(`Registering ${handlers.length} IPC handlers for ${moduleName}...`);
      registerIpcHandlers(handlers);
      moduleLogger.info(`${moduleName} IPC handlers registered successfully`);
    },

    getChannels: () => handlers.map((h) => h.channel),
  };
}

/**
 * 移除已注册的 IPC handlers
 */
export function removeIpcHandlers(channels: string[]): void {
  for (const channel of channels) {
    ipcMain.removeHandler(channel);
  }
}
