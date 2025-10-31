/**
 * Repository 聚合根测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Repository } from './Repository';
import { RepositoryConfig } from '../value-objects/RepositoryConfig';
import { SyncStatus } from '../value-objects/SyncStatus';
import { GitInfo } from '../value-objects/GitInfo';
import { Resource } from '../entities/Resource';
import { RepositoryContracts } from '@dailyuse/contracts';

const RepositoryTypeEnum = RepositoryContracts.RepositoryType;
const RepositoryStatusEnum = RepositoryContracts.RepositoryStatus;
const ResourceTypeEnum = RepositoryContracts.ResourceType;

describe('Repository Aggregate Root', () => {
  describe('创建和初始化', () => {
    it('应该使用工厂方法创建新仓库', () => {
      const repository = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repository',
        type: RepositoryTypeEnum.LOCAL,
        path: '/path/to/repo',
        description: 'Test description',
      });

      expect(repository.uuid).toBeDefined();
      expect(repository.accountUuid).toBe('account-123');
      expect(repository.name).toBe('Test Repository');
      expect(repository.type).toBe(RepositoryTypeEnum.LOCAL);
      expect(repository.path).toBe('/path/to/repo');
      expect(repository.description).toBe('Test description');
      expect(repository.status).toBe(RepositoryStatusEnum.ACTIVE);
    });

    it('应该创建带默认配置的仓库', () => {
      const repository = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repository',
        type: RepositoryTypeEnum.LOCAL,
        path: '/path/to/repo',
      });

      expect(repository.config).toBeDefined();
      expect(repository.config.enableGit).toBe(false);
      expect(repository.config.enableVersionControl).toBe(true);
    });

    it('应该创建带自定义配置的仓库', () => {
      const repository = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repository',
        type: RepositoryTypeEnum.LOCAL,
        path: '/path/to/repo',
        config: {
          enableGit: true,
          autoSync: true,
        },
      });

      expect(repository.config.enableGit).toBe(true);
      expect(repository.config.autoSync).toBe(true);
    });

    it('应该在创建时发布 RepositoryCreated 事件', () => {
      const repository = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repository',
        type: RepositoryTypeEnum.LOCAL,
        path: '/path/to/repo',
      });

      const events = repository.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('RepositoryCreated');
      expect((events[0].payload as any).repositoryName).toBe('Test Repository');
      expect(events[0].accountUuid).toBe('account-123');
    });
  });

  describe('UUID 生成', () => {
    it('应该为每个仓库生成唯一的 UUID', () => {
      const repo1 = Repository.create({
        accountUuid: 'account-123',
        name: 'Repo 1',
        type: RepositoryTypeEnum.LOCAL,
        path: '/path/1',
      });

      const repo2 = Repository.create({
        accountUuid: 'account-123',
        name: 'Repo 2',
        type: RepositoryTypeEnum.LOCAL,
        path: '/path/2',
      });

      expect(repo1.uuid).not.toBe(repo2.uuid);
      expect(repo1.uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe('配置管理', () => {
    let repository: Repository;

    beforeEach(() => {
      repository = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repository',
        type: RepositoryTypeEnum.LOCAL,
        path: '/path/to/repo',
      });
      repository.clearDomainEvents(); // 清除创建事件
    });

    it('应该更新配置', () => {
      const oldConfig = repository.config;

      repository.updateConfig({
        enableGit: true,
        autoSync: true,
      });

      expect(repository.config.enableGit).toBe(true);
      expect(repository.config.autoSync).toBe(true);
      expect(repository.config).not.toBe(oldConfig); // 应该是新的值对象实例
    });

    it('应该在更新配置时发布事件', () => {
      repository.updateConfig({ enableGit: true });

      const events = repository.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('RepositoryConfigUpdated');
      expect((events[0].payload as any).changes.enableGit).toBe(true);
    });

    it('应该在更新配置时更新 updatedAt', () => {
      const originalUpdatedAt = repository.updatedAt;

      // 等待一毫秒确保时间戳不同
      vi.useFakeTimers();
      vi.advanceTimersByTime(1);

      repository.updateConfig({ enableGit: true });

      expect(repository.updatedAt).toBeGreaterThan(originalUpdatedAt);

      vi.useRealTimers();
    });
  });

  describe('Git 管理', () => {
    let repository: Repository;

    beforeEach(() => {
      repository = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repository',
        type: RepositoryTypeEnum.LOCAL,
        path: '/path/to/repo',
      });
      repository.clearDomainEvents();
    });

    it('应该启用 Git', async () => {
      await repository.enableGit('https://github.com/user/repo.git');

      expect(repository.git).toBeDefined();
      expect(repository.git?.isGitRepo).toBe(true);
      expect(repository.git?.remoteUrl).toBe('https://github.com/user/repo.git');
      expect(repository.git?.currentBranch).toBe('main');
    });

    it('应该在启用 Git 时发布事件', async () => {
      await repository.enableGit('https://github.com/user/repo.git');

      const events = repository.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('GitEnabled');
      expect((events[0].payload as any).remoteUrl).toBe('https://github.com/user/repo.git');
    });

    it('应该禁用 Git', () => {
      // 先启用
      repository.enableGit();
      repository.clearDomainEvents();

      // 再禁用
      repository.disableGit();

      expect(repository.git).toBeNull();
    });

    it('应该在禁用 Git 时发布事件', async () => {
      await repository.enableGit();
      repository.clearDomainEvents();

      repository.disableGit();

      const events = repository.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('GitDisabled');
    });
  });

  describe('同步管理', () => {
    let repository: Repository;

    beforeEach(async () => {
      repository = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repository',
        type: RepositoryTypeEnum.LOCAL,
        path: '/path/to/repo',
      });
      await repository.enableGit();
      repository.clearDomainEvents();
    });

    it('应该开始同步', async () => {
      await repository.startSync('pull');

      expect(repository.syncStatus).toBeDefined();
      expect(repository.syncStatus?.isSyncing).toBe(true);
    });

    it('应该在开始同步时发布事件', async () => {
      await repository.startSync('pull', true);

      const events = repository.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('SyncStarted');
      expect((events[0].payload as any).syncType).toBe('pull');
      expect((events[0].payload as any).force).toBe(true);
    });

    it('应该在未启用 Git 时抛出错误', async () => {
      const repoWithoutGit = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repository',
        type: RepositoryTypeEnum.LOCAL,
        path: '/path/to/repo',
      });

      await expect(repoWithoutGit.startSync('pull')).rejects.toThrow(
        'Git is not enabled for this repository',
      );
    });

    it('应该停止同步', async () => {
      await repository.startSync('pull');
      repository.clearDomainEvents();

      repository.stopSync();

      expect(repository.syncStatus?.isSyncing).toBe(false);
    });

    it('应该在停止同步时发布事件', async () => {
      await repository.startSync('pull');
      repository.clearDomainEvents();

      repository.stopSync();

      const events = repository.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('SyncStopped');
    });
  });

  describe('资源管理', () => {
    let repository: Repository;

    beforeEach(() => {
      repository = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repository',
        type: RepositoryTypeEnum.LOCAL,
        path: '/path/to/repo',
      });
      repository.clearDomainEvents();
    });

    it('应该添加资源', () => {
      const resource = repository.createResource({
        name: 'test.md',
        type: ResourceTypeEnum.MARKDOWN,
        path: '/test.md',
      });

      repository.addResource(resource);

      expect(repository.getAllResources()).toHaveLength(1);
      expect(repository.getAllResources()[0]).toBe(resource);
    });

    it('应该在添加资源时发布事件', () => {
      const resource = repository.createResource({
        name: 'test.md',
        type: ResourceTypeEnum.MARKDOWN,
        path: '/test.md',
      });

      repository.addResource(resource);

      const events = repository.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('ResourceAdded');
      expect((events[0].payload as any).resourceName).toBe('test.md');
      expect((events[0].payload as any).resourceType).toBe(ResourceTypeEnum.MARKDOWN);
    });

    it('应该移除资源', () => {
      const resource = repository.createResource({
        name: 'test.md',
        type: ResourceTypeEnum.MARKDOWN,
        path: '/test.md',
      });
      repository.addResource(resource);
      repository.clearDomainEvents();

      const removed = repository.removeResource(resource.uuid);

      expect(removed).toBe(resource);
      expect(repository.getAllResources()).toHaveLength(0);
    });

    it('应该在移除资源时发布事件', () => {
      const resource = repository.createResource({
        name: 'test.md',
        type: ResourceTypeEnum.MARKDOWN,
        path: '/test.md',
      });
      repository.addResource(resource);
      repository.clearDomainEvents();

      repository.removeResource(resource.uuid);

      const events = repository.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('ResourceRemoved');
      expect((events[0].payload as any).resourceName).toBe('test.md');
    });

    it('应该通过 UUID 获取资源', () => {
      const resource = repository.createResource({
        name: 'test.md',
        type: ResourceTypeEnum.MARKDOWN,
        path: '/test.md',
      });
      repository.addResource(resource);

      const found = repository.getResource(resource.uuid);

      expect(found).toBe(resource);
    });

    it('应该通过类型获取资源', () => {
      const mdResource = repository.createResource({
        name: 'test.md',
        type: ResourceTypeEnum.MARKDOWN,
        path: '/test.md',
      });
      const imgResource = repository.createResource({
        name: 'test.png',
        type: ResourceTypeEnum.IMAGE,
        path: '/test.png',
      });

      repository.addResource(mdResource);
      repository.addResource(imgResource);

      const markdownResources = repository.getResourcesByType(ResourceTypeEnum.MARKDOWN);

      expect(markdownResources).toHaveLength(1);
      expect(markdownResources[0]).toBe(mdResource);
    });
  });

  describe('状态管理', () => {
    let repository: Repository;

    beforeEach(() => {
      repository = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repository',
        type: RepositoryTypeEnum.LOCAL,
        path: '/path/to/repo',
      });
      repository.clearDomainEvents();
    });

    it('应该归档仓库', () => {
      repository.archive();

      expect(repository.status).toBe(RepositoryStatusEnum.ARCHIVED);
    });

    it('应该在归档时发布事件', () => {
      repository.archive();

      const events = repository.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('RepositoryArchived');
    });

    it('应该激活仓库', () => {
      repository.archive();
      repository.clearDomainEvents();

      repository.activate();

      expect(repository.status).toBe(RepositoryStatusEnum.ACTIVE);
    });

    it('应该在激活时发布事件', () => {
      repository.archive();
      repository.clearDomainEvents();

      repository.activate();

      const events = repository.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('RepositoryActivated');
    });
  });

  describe('DTO 转换', () => {
    it('应该转换为 ServerDTO', () => {
      const repository = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repository',
        type: RepositoryTypeEnum.LOCAL,
        path: '/path/to/repo',
        description: 'Test description',
      });

      const dto = repository.toServerDTO();

      expect(dto.uuid).toBe(repository.uuid);
      expect(dto.accountUuid).toBe('account-123');
      expect(dto.name).toBe('Test Repository');
      expect(dto.type).toBe(RepositoryTypeEnum.LOCAL);
      expect(dto.path).toBe('/path/to/repo');
      expect(dto.description).toBe('Test description');
      expect(dto.config).toBeDefined();
      expect(dto.stats).toBeDefined();
    });

    it('应该从 ServerDTO 创建实例', () => {
      const dto: RepositoryContracts.RepositoryServerDTO = {
        uuid: 'repo-123',
        accountUuid: 'account-123',
        name: 'Test Repository',
        type: RepositoryTypeEnum.LOCAL,
        path: '/path/to/repo',
        description: 'Test description',
        config: RepositoryConfig.createDefault().toContract(),
        relatedGoals: null,
        status: RepositoryStatusEnum.ACTIVE,
        git: null,
        syncStatus: null,
        stats: {
          totalResources: 0,
          resourcesByType: {} as Record<RepositoryContracts.ResourceType, number>,
          resourcesByStatus: {} as Record<RepositoryContracts.ResourceStatus, number>,
          totalSize: 0,
          recentActiveResources: 0,
          favoriteResources: 0,
          lastUpdated: Date.now(),
        },
        lastAccessedAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const repository = Repository.fromServerDTO(dto);

      expect(repository.uuid).toBe('repo-123');
      expect(repository.accountUuid).toBe('account-123');
      expect(repository.name).toBe('Test Repository');
      expect(repository.type).toBe(RepositoryTypeEnum.LOCAL);
    });

    it('应该支持往返转换（roundtrip）', () => {
      const original = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repository',
        type: RepositoryTypeEnum.LOCAL,
        path: '/path/to/repo',
        description: 'Test description',
      });

      const dto = original.toServerDTO();
      const restored = Repository.fromServerDTO(dto);

      expect(restored.uuid).toBe(original.uuid);
      expect(restored.accountUuid).toBe(original.accountUuid);
      expect(restored.name).toBe(original.name);
      expect(restored.type).toBe(original.type);
      expect(restored.path).toBe(original.path);
    });
  });

  describe('值对象集成', () => {
    it('应该正确使用 RepositoryConfig 值对象', () => {
      const repository = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repository',
        type: RepositoryTypeEnum.LOCAL,
        path: '/path/to/repo',
      });

      // config getter 返回的是 DTO，不是值对象实例
      const config = repository.config;
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
      expect(config.enableGit).toBeDefined();
    });

    it('应该正确使用 GitInfo 值对象', async () => {
      const repository = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repository',
        type: RepositoryTypeEnum.LOCAL,
        path: '/path/to/repo',
      });

      await repository.enableGit('https://github.com/user/repo.git');

      // git getter 返回的是值对象实例
      expect(repository.git).toBeInstanceOf(GitInfo);
    });

    it('应该正确使用 SyncStatus 值对象', async () => {
      const repository = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repository',
        type: RepositoryTypeEnum.LOCAL,
        path: '/path/to/repo',
      });

      await repository.enableGit();
      await repository.startSync('pull');

      expect(repository.syncStatus).toBeInstanceOf(SyncStatus);
      expect(Object.isFrozen(repository.syncStatus!)).toBe(true);
    });
  });
});
