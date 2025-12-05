/**
 * Account Module - Infrastructure Client
 *
 * Ports and Adapters for Account module communication.
 */

// Container
export {
  AccountContainer,
  AccountDependencyKeys,
  type IAccountRepository,
} from './account.container';

// Ports (Interfaces)
export { type IAccountApiClient } from './ports/account-api-client.port';

// HTTP Adapters
export {
  AccountHttpAdapter,
  createAccountHttpAdapter,
} from './adapters/http/account-http.adapter';

// IPC Adapters
export {
  AccountIpcAdapter,
  createAccountIpcAdapter,
} from './adapters/ipc/account-ipc.adapter';
