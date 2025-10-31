// Re-export authentication entities directly from domain-client
// domain-client中的认证实体就是渲染进程/web端使用的最终domain对象

export {
  AuthSession,
  AuthCredential,
  PasswordCredential,
  RefreshToken,
  DeviceInfo,
} from '../../../../../../../packages/domain-client/src/authentication';
