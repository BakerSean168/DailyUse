/**
 * IPC Test Utils - Desktop Testing Utilities
 *
 * Story 13.53: IPC Client 单元测试
 *
 * Provides mock utilities for testing IPC clients in isolation
 *
 * @module renderer/shared/testing
 */

import { vi, type Mock } from 'vitest';
import type { IPCRequestOptions } from '../infrastructure/ipc/ipc-types';

/**
 * Mock IPC response configuration
 */
export interface MockIPCResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Mock electron API for testing
 */
export interface MockElectronAPI {
  invoke: Mock<[channel: string, ...args: unknown[]], Promise<unknown>>;
  on: Mock<[channel: string, callback: (...args: unknown[]) => void], void>;
  off: Mock<[channel: string, callback: (...args: unknown[]) => void], void>;
  send: Mock<[channel: string, ...args: unknown[]], void>;
}

/**
 * Creates a mock electron API object for testing
 */
export function createMockElectronAPI(): MockElectronAPI {
  return {
    invoke: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    send: vi.fn(),
  };
}

/**
 * Creates a mock IPC success response
 */
export function createSuccessResponse<T>(data: T): MockIPCResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Creates a mock IPC error response
 */
export function createErrorResponse(code: string, message: string): MockIPCResponse {
  return {
    success: false,
    error: { code, message },
  };
}

/**
 * Mock IPC Client for testing
 *
 * Allows setting up expectations and verifying IPC calls
 */
export class MockIPCClient {
  private responses: Map<string, unknown[]> = new Map();
  private callHistory: Array<{ channel: string; payload: unknown }> = [];

  /**
   * Set up a mock response for a channel
   */
  mockResponse<T>(channel: string, response: T): this {
    const responses = this.responses.get(channel) || [];
    responses.push(response);
    this.responses.set(channel, responses);
    return this;
  }

  /**
   * Set up multiple mock responses for a channel (will return in order)
   */
  mockResponses<T>(channel: string, responses: T[]): this {
    this.responses.set(channel, [...responses]);
    return this;
  }

  /**
   * Set up a mock error for a channel
   */
  mockError(channel: string, error: Error): this {
    const responses = this.responses.get(channel) || [];
    responses.push({ __error: error });
    this.responses.set(channel, responses);
    return this;
  }

  /**
   * Invoke mock IPC call
   */
  async invoke<T>(
    channel: string,
    payload?: unknown,
    _options?: IPCRequestOptions
  ): Promise<T> {
    this.callHistory.push({ channel, payload });

    const responses = this.responses.get(channel);
    if (!responses || responses.length === 0) {
      throw new Error(`No mock response set for channel: ${channel}`);
    }

    const response = responses.shift();

    // Check if it's an error response
    if (response && typeof response === 'object' && '__error' in (response as object)) {
      throw (response as { __error: Error }).__error;
    }

    return response as T;
  }

  /**
   * Get all calls made to a specific channel
   */
  getCallsFor(channel: string): Array<{ channel: string; payload: unknown }> {
    return this.callHistory.filter((call) => call.channel === channel);
  }

  /**
   * Get the last call made
   */
  getLastCall(): { channel: string; payload: unknown } | undefined {
    return this.callHistory[this.callHistory.length - 1];
  }

  /**
   * Verify a channel was called with specific payload
   */
  wasCalledWith(channel: string, payload?: unknown): boolean {
    return this.callHistory.some(
      (call) =>
        call.channel === channel &&
        (payload === undefined || JSON.stringify(call.payload) === JSON.stringify(payload))
    );
  }

  /**
   * Get total call count
   */
  get callCount(): number {
    return this.callHistory.length;
  }

  /**
   * Clear all mock responses and history
   */
  reset(): void {
    this.responses.clear();
    this.callHistory = [];
  }
}

/**
 * Setup mock window.electronAPI for tests
 *
 * @returns cleanup function to restore original
 */
export function setupMockElectronAPI(): {
  mockAPI: MockElectronAPI;
  restore: () => void;
} {
  const mockAPI = createMockElectronAPI();
  const originalElectronAPI = (globalThis as any).window?.electronAPI;

  // Setup global mock
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).window = (globalThis as any).window || {};
    (globalThis as any).window.electronAPI = mockAPI;
  }

  return {
    mockAPI,
    restore: () => {
      if (typeof globalThis !== 'undefined' && (globalThis as any).window) {
        if (originalElectronAPI) {
          (globalThis as any).window.electronAPI = originalElectronAPI;
        } else {
          delete (globalThis as any).window.electronAPI;
        }
      }
    },
  };
}

/**
 * Helper to wait for async operations
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Create a deferred promise for controlling async test flow
 */
export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
