/**
 * IPC Mock - IPC 通信模拟工具
 * 
 * 用于测试时模拟 window.electronAPI
 * 
 * @module renderer/shared/infrastructure/ipc/__tests__
 */

import type { IPCResponse, IPCErrorData } from '../ipc-types';
import { IPCErrorCode } from '../ipc-types';

// ============ Types ============

export type MockHandler<T = unknown> = (payload?: unknown) => T | Promise<T>;

export interface MockConfig {
  /** 默认延迟（毫秒） */
  defaultDelay?: number;
  /** 是否记录调用日志 */
  logging?: boolean;
}

export interface MockCall {
  channel: string;
  payload: unknown;
  timestamp: number;
  response?: IPCResponse<unknown>;
  error?: Error;
}

// ============ IPCMock Class ============

/**
 * IPC Mock 实现
 */
export class IPCMock {
  private handlers: Map<string, MockHandler> = new Map();
  private calls: MockCall[] = [];
  private config: Required<MockConfig>;
  private originalElectronAPI: unknown;

  constructor(config?: MockConfig) {
    this.config = {
      defaultDelay: config?.defaultDelay ?? 0,
      logging: config?.logging ?? false,
    };
  }

  // ============ Setup & Teardown ============

  /**
   * 安装 mock 到 window.electronAPI
   */
  install(): void {
    this.originalElectronAPI = (window as { electronAPI?: unknown }).electronAPI;
    (window as { electronAPI?: unknown }).electronAPI = this.createMockAPI();
  }

  /**
   * 卸载 mock，恢复原始 electronAPI
   */
  uninstall(): void {
    (window as { electronAPI?: unknown }).electronAPI = this.originalElectronAPI;
    this.originalElectronAPI = undefined;
  }

  /**
   * 重置所有 handlers 和调用记录
   */
  reset(): void {
    this.handlers.clear();
    this.calls = [];
  }

  /**
   * 清除调用记录（保留 handlers）
   */
  clearCalls(): void {
    this.calls = [];
  }

  // ============ Handler Registration ============

  /**
   * 注册 mock handler
   */
  on<T>(channel: string, handler: MockHandler<T>): this {
    this.handlers.set(channel, handler as MockHandler);
    return this;
  }

  /**
   * 注册返回固定值的 handler
   */
  onReturn<T>(channel: string, value: T): this {
    return this.on(channel, () => value);
  }

  /**
   * 注册返回错误的 handler
   */
  onError(channel: string, error: IPCErrorData): this {
    return this.on(channel, () => {
      throw error;
    });
  }

  /**
   * 注册延迟响应的 handler
   */
  onDelayed<T>(channel: string, value: T, delay: number): this {
    return this.on(channel, async () => {
      await this.delay(delay);
      return value;
    });
  }

  /**
   * 注册一次性 handler（调用后自动移除）
   */
  once<T>(channel: string, handler: MockHandler<T>): this {
    const wrappedHandler: MockHandler<T> = async (payload) => {
      this.handlers.delete(channel);
      return handler(payload);
    };
    return this.on(channel, wrappedHandler);
  }

  /**
   * 移除 handler
   */
  off(channel: string): this {
    this.handlers.delete(channel);
    return this;
  }

  // ============ Call Inspection ============

  /**
   * 获取所有调用记录
   */
  getCalls(): MockCall[] {
    return [...this.calls];
  }

  /**
   * 获取指定通道的调用记录
   */
  getCallsFor(channel: string): MockCall[] {
    return this.calls.filter(c => c.channel === channel);
  }

  /**
   * 获取指定通道的调用次数
   */
  getCallCount(channel: string): number {
    return this.getCallsFor(channel).length;
  }

  /**
   * 检查通道是否被调用过
   */
  wasCalled(channel: string): boolean {
    return this.getCallCount(channel) > 0;
  }

  /**
   * 检查通道是否被调用了指定次数
   */
  wasCalledTimes(channel: string, times: number): boolean {
    return this.getCallCount(channel) === times;
  }

  /**
   * 检查通道是否使用指定参数调用过
   */
  wasCalledWith(channel: string, payload: unknown): boolean {
    return this.getCallsFor(channel).some(
      c => JSON.stringify(c.payload) === JSON.stringify(payload)
    );
  }

  /**
   * 获取最后一次调用
   */
  getLastCall(channel?: string): MockCall | undefined {
    const calls = channel ? this.getCallsFor(channel) : this.calls;
    return calls[calls.length - 1];
  }

  /**
   * 获取第 n 次调用
   */
  getNthCall(channel: string, n: number): MockCall | undefined {
    return this.getCallsFor(channel)[n];
  }

  // ============ Assertions ============

  /**
   * 断言通道被调用过
   */
  assertCalled(channel: string): void {
    if (!this.wasCalled(channel)) {
      throw new Error(`Expected channel '${channel}' to be called, but it was not.`);
    }
  }

  /**
   * 断言通道没有被调用过
   */
  assertNotCalled(channel: string): void {
    if (this.wasCalled(channel)) {
      throw new Error(`Expected channel '${channel}' not to be called, but it was called ${this.getCallCount(channel)} time(s).`);
    }
  }

  /**
   * 断言通道被调用了指定次数
   */
  assertCalledTimes(channel: string, times: number): void {
    const actualTimes = this.getCallCount(channel);
    if (actualTimes !== times) {
      throw new Error(`Expected channel '${channel}' to be called ${times} time(s), but it was called ${actualTimes} time(s).`);
    }
  }

  /**
   * 断言通道使用指定参数调用过
   */
  assertCalledWith(channel: string, payload: unknown): void {
    if (!this.wasCalledWith(channel, payload)) {
      throw new Error(`Expected channel '${channel}' to be called with ${JSON.stringify(payload)}, but it was not.`);
    }
  }

  // ============ Private Methods ============

  private createMockAPI() {
    const self = this;
    
    return {
      async invoke(channel: string, payload?: unknown): Promise<IPCResponse<unknown>> {
        const call: MockCall = {
          channel,
          payload,
          timestamp: Date.now(),
        };

        try {
          const handler = self.handlers.get(channel);
          
          if (!handler) {
            const error: IPCErrorData = {
              code: IPCErrorCode.HANDLER_NOT_FOUND,
              message: `No mock handler registered for channel '${channel}'`,
            };
            call.error = new Error(error.message);
            self.calls.push(call);
            return { success: false, error };
          }

          // 添加默认延迟
          if (self.config.defaultDelay > 0) {
            await self.delay(self.config.defaultDelay);
          }

          const data = await handler(payload);
          const response: IPCResponse<unknown> = { success: true, data };
          call.response = response;
          self.calls.push(call);

          if (self.config.logging) {
            console.log(`[IPCMock] ${channel}`, { payload, response });
          }

          return response;
        } catch (error) {
          const ipcError: IPCErrorData = {
            code: (error as IPCErrorData).code ?? IPCErrorCode.HANDLER_ERROR,
            message: (error as Error).message ?? String(error),
          };
          call.error = error instanceof Error ? error : new Error(String(error));
          self.calls.push(call);

          if (self.config.logging) {
            console.log(`[IPCMock] ${channel} ERROR`, { payload, error: ipcError });
          }

          return { success: false, error: ipcError };
        }
      },
      
      on(channel: string, listener: (data: unknown) => void): void {
        // Event listener mock - 可以扩展支持事件
        if (self.config.logging) {
          console.log(`[IPCMock] Registered event listener for '${channel}'`);
        }
      },
      
      off(channel: string, listener: (data: unknown) => void): void {
        if (self.config.logging) {
          console.log(`[IPCMock] Removed event listener for '${channel}'`);
        }
      },
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============ Factory Functions ============

/**
 * 创建 IPC Mock 实例
 */
export function createIPCMock(config?: MockConfig): IPCMock {
  return new IPCMock(config);
}

/**
 * 创建并安装 IPC Mock
 */
export function setupIPCMock(config?: MockConfig): IPCMock {
  const mock = createIPCMock(config);
  mock.install();
  return mock;
}
