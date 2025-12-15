/**
 * Store Test Utilities
 *
 * Story 13.54: Store 单元测试
 *
 * Utilities for testing Zustand stores
 */

import { act } from '@testing-library/react';
import type { StoreApi } from 'zustand';

/**
 * Reset a Zustand store to its initial state
 */
export function resetStore<T extends object>(
  store: StoreApi<T>,
  initialState: Partial<T>
): void {
  act(() => {
    store.setState(initialState as T, true);
  });
}

/**
 * Get the current state of a store
 */
export function getStoreState<T>(store: StoreApi<T>): T {
  return store.getState();
}

/**
 * Wait for a store state to match a condition
 */
export async function waitForStoreState<T>(
  store: StoreApi<T>,
  predicate: (state: T) => boolean,
  timeout = 5000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      const state = store.getState();
      if (predicate(state)) {
        resolve(state);
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for store state'));
        return;
      }

      setTimeout(check, 50);
    };

    check();
  });
}

/**
 * Subscribe to store changes during a test
 */
export function subscribeToStore<T>(
  store: StoreApi<T>,
  callback: (state: T) => void
): () => void {
  return store.subscribe(callback);
}

/**
 * Create a store snapshot for comparison
 */
export function createStoreSnapshot<T extends object>(state: T): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Assert store state matches expected
 */
export function assertStoreState<T extends object>(
  store: StoreApi<T>,
  expected: Partial<T>
): void {
  const state = store.getState();
  for (const [key, value] of Object.entries(expected)) {
    if (JSON.stringify((state as any)[key]) !== JSON.stringify(value)) {
      throw new Error(
        `Store state mismatch for key "${key}": expected ${JSON.stringify(value)}, got ${JSON.stringify((state as any)[key])}`
      );
    }
  }
}
