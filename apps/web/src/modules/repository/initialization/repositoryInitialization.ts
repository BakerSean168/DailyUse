// @ts-nocheck
import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { RepositoryWebApplicationService } from '../application/services/RepositoryWebApplicationService';

const repositorySyncStatusTask: InitializationTask = {
  name: 'repository-sync-status',
  phase: InitializationPhase.USER_LOGIN,
  priority: 20,
  dependencies: [],
  initialize: async () => {
    // 初始化仓库同步状态处理器
    const repositoryService = new RepositoryWebApplicationService();
    repositoryService.syncAllRepositories();
    console.log('✓ Repository sync status handlers registered');
  },
};

export function registerRepositoryInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(repositorySyncStatusTask);

  console.log('Repository module initialization tasks registered');
}
