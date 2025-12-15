/**
 * Testing Utilities Index
 *
 * Story 13.53: IPC Client 单元测试基础设施
 * Story 13.54: Store 单元测试基础设施
 */

export {
  MockIPCClient,
  createMockElectronAPI,
  createSuccessResponse,
  createErrorResponse,
  setupMockElectronAPI,
  flushPromises,
  createDeferred,
  type MockElectronAPI,
  type MockIPCResponse,
} from './ipc-test-utils';

export {
  resetStore,
  getStoreState,
  waitForStoreState,
  subscribeToStore,
  createStoreSnapshot,
  assertStoreState,
} from './store-test-utils';
