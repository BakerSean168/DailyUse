/**
 * Authentication Domain Client
 * 认证模块客户端实现
 */

// 聚合根
export { AuthCredential } from './aggregates/AuthCredential';
export { AuthSession } from './aggregates/AuthSession';

// 实体
export { PasswordCredential } from './entities/PasswordCredential';
export { ApiKeyCredential } from './entities/ApiKeyCredential';
export { RememberMeToken } from './entities/RememberMeToken';
export { RefreshToken } from './entities/RefreshToken';
export { CredentialHistory } from './entities/CredentialHistory';
export { SessionHistory } from './entities/SessionHistory';

// 值对象
export { DeviceInfo } from './value-objects/DeviceInfo';
