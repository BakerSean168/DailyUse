/**
 * IPC Test Infrastructure - 统一导出
 * 
 * @module renderer/shared/infrastructure/ipc/__tests__
 */

export { IPCMock, createIPCMock, setupIPCMock } from './ipc-mock';
export type { MockHandler, MockConfig, MockCall } from './ipc-mock';

export {
  // Response Factories
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createNotFoundResponse,
  createBatchRequestItem,
  createBatchResponseItem,
  
  // Mock Setup
  createMockWithHandlers,
  createCRUDMockHandlers,
  
  // Async Helpers
  flushPromises,
  wait,
  waitFor,
  
  // Assertions
  expectAsyncError,
  expectToCompleteWithin,
  
  // Test Context
  createTestContext,
  setupTestContext,
} from './test-helpers';

export type { TestContext } from './test-helpers';
