/**
 * Authentication Module - Infrastructure Client
 *
 * Ports and Adapters for Authentication module communication.
 */

// Container
export {
  AuthContainer,
  AuthDependencyKeys,
  type IAuthTokenStorage,
} from './auth.container';

// Ports (Interfaces)
export { type IAuthApiClient, type RegisterResponse } from './ports/auth-api-client.port';

// HTTP Adapters
export {
  AuthHttpAdapter,
  createAuthHttpAdapter,
} from './adapters/http/auth-http.adapter';

// IPC Adapters
export {
  AuthIpcAdapter,
  createAuthIpcAdapter,
} from './adapters/ipc/auth-ipc.adapter';
