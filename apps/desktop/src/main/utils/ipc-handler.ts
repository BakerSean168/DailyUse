/**
 * @file IPC Handler Utilities
 * @description
 * Provides a unified set of tools for creating and registering IPC handlers with:
 * - Automatic error handling and logging
 * - Type-safe handler definitions
 * - Simplified registration syntax
 *
 * @module utils/ipc-handler
 */

import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { createLogger, type ILogger } from '@dailyuse/utils';

/**
 * @description Type definition for an IPC Handler function.
 *
 * It represents a function that processes an IPC request.
 *
 * @template TInput The type of the input argument. defaults to void.
 * @template TOutput The type of the return value. defaults to void.
 */
export type IpcHandlerFn<TInput = void, TOutput = void> = TInput extends void
  ? () => Promise<TOutput> | TOutput
  : (input: TInput) => Promise<TOutput> | TOutput;

/**
 * @interface IpcHandlerOptions
 * @description Configuration options for an IPC Handler.
 */
export interface IpcHandlerOptions {
  /** Custom logger instance (defaults to a logger created with the channel name). */
  logger?: ILogger;
  /** Whether to rethrow exceptions after logging them (defaults to true). */
  rethrow?: boolean;
  /** Default return value in case of an error (if rethrow is false). */
  errorResult?: unknown;
}

/**
 * @interface IpcHandlerDefinition
 * @description Definition structure for an IPC Handler.
 * Contains the channel name, the handler function, and configuration options.
 */
export interface IpcHandlerDefinition<TInput = void, TOutput = void> {
  /** The IPC channel name to listen on. */
  channel: string;
  /** The function to execute when a message is received on the channel. */
  handler: IpcHandlerFn<TInput, TOutput>;
  /** Optional configuration for the handler. */
  options?: IpcHandlerOptions;
}

// Global default logger
const defaultLogger = createLogger('IpcHandler');

/**
 * @function createIpcHandler
 * @description Creates an IPC handler definition with automatic error handling.
 *
 * @example
 * // No arguments
 * const handler = createIpcHandler('account:me:get', () => service.getCurrentUser());
 *
 * @example
 * // With arguments
 * const handler = createIpcHandler('account:get', (uuid: string) => service.getAccount(uuid));
 *
 * @example
 * // With options
 * const handler = createIpcHandler('account:get', (uuid: string) => service.getAccount(uuid), {
 *   errorResult: null,
 *   rethrow: false,
 * });
 *
 * @template TInput The input type of the handler.
 * @template TOutput The output type of the handler.
 * @param {string} channel - The IPC channel name.
 * @param {IpcHandlerFn<TInput, TOutput>} handler - The handler function.
 * @param {IpcHandlerOptions} [options={}] - Configuration options.
 * @returns {IpcHandlerDefinition<TInput, TOutput>} The handler definition object.
 */
export function createIpcHandler<TInput = void, TOutput = void>(
  channel: string,
  handler: IpcHandlerFn<TInput, TOutput>,
  options: IpcHandlerOptions = {},
): IpcHandlerDefinition<TInput, TOutput> {
  return { channel, handler, options };
}

/**
 * @function registerIpcHandler
 * @description Registers a single IPC handler with Electron's ipcMain.
 *
 * Wraps the handler execution in a try-catch block for error logging and handling.
 *
 * @template TInput The input type.
 * @template TOutput The output type.
 * @param {IpcHandlerDefinition<TInput, TOutput>} definition - The handler definition to register.
 */
export function registerIpcHandler<TInput = void, TOutput = void>(
  definition: IpcHandlerDefinition<TInput, TOutput>,
): void {
  const { channel, handler, options = {} } = definition;
  const { logger = defaultLogger, rethrow = true, errorResult } = options;

  ipcMain.handle(channel, async (_event: IpcMainInvokeEvent, ...args: unknown[]) => {
    try {
      // Determine how to call the handler based on argument count
      if (args.length === 0) {
        return await (handler as () => Promise<TOutput>)();
      }
      // Pass the first argument (assuming single argument object pattern for most cases)
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
 * @function registerIpcHandlers
 * @description Registers multiple IPC handlers at once.
 *
 * @example
 * registerIpcHandlers([
 *   createIpcHandler('account:get', (uuid) => service.getAccount(uuid)),
 *   createIpcHandler('account:create', (input) => service.createAccount(input)),
 * ], { logger: accountLogger });
 *
 * @param {IpcHandlerDefinition<unknown, unknown>[]} definitions - An array of handler definitions.
 * @param {IpcHandlerOptions} [globalOptions={}] - Global options to apply to all handlers (can be overridden by individual handler options).
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
 * @function createModuleIpcHandlers
 * @description Creates a helper for registering module-specific IPC handlers.
 *
 * Provides a cleaner API for collecting and registering all handlers for a specific module.
 *
 * @example
 * const { handle, register } = createModuleIpcHandlers('Account', accountLogger);
 *
 * handle('account:get', (uuid) => service.getAccount(uuid));
 * handle('account:create', (input) => service.createAccount(input));
 *
 * register(); // Registers all collected handlers
 *
 * @param {string} moduleName - The name of the module (used for logging).
 * @param {ILogger} [logger] - Optional logger instance for the module.
 * @returns {Object} An object containing methods to add handlers (`handle`), register them (`register`), and get channel names (`getChannels`).
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
 * @function removeIpcHandlers
 * @description Removes registered IPC handlers for the given channels.
 *
 * @param {string[]} channels - The list of channel names to remove handlers for.
 */
export function removeIpcHandlers(channels: string[]): void {
  for (const channel of channels) {
    ipcMain.removeHandler(channel);
  }
}
