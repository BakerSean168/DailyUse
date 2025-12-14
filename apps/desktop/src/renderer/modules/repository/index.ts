/**
 * Repository Module - Renderer
 *
 * 仓库模块 - 渲染进程
 * 遵循 DDD 分层架构
 */

// ===== Application Layer =====
export {
  RepositoryApplicationService,
  repositoryApplicationService,
} from './application/services';

// ===== Presentation Layer =====
export {
  useRepository,
} from './presentation/hooks';
export type {
  RepositoryState,
  UseRepositoryReturn,
} from './presentation/hooks';

// ===== Initialization =====
export { registerRepositoryModule, initializeRepositoryModule } from './initialization';
