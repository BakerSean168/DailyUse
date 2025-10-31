/**
 * RepositoryConfig 值对象测试
 */

import { describe, it, expect } from 'vitest';
import { RepositoryConfig } from './RepositoryConfig';
import { RepositoryContracts } from '@dailyuse/contracts';

const ResourceTypeEnum = RepositoryContracts.ResourceType;

describe('RepositoryConfig Value Object', () => {
  describe('创建和初始化', () => {
    it('应该创建默认配置', () => {
      const config = RepositoryConfig.createDefault();

      expect(config.enableGit).toBe(false);
      expect(config.autoSync).toBe(false);
      expect(config.syncInterval).toBeNull();
      expect(config.defaultLinkedDocName).toBe('index.md');
      expect(config.supportedFileTypes).toEqual([]);
      expect(config.maxFileSize).toBe(100 * 1024 * 1024);
      expect(config.enableVersionControl).toBe(true);
    });

    it('应该使用自定义参数创建配置', () => {
      const config = new RepositoryConfig({
        enableGit: true,
        autoSync: true,
        syncInterval: 3600,
        defaultLinkedDocName: 'README.md',
        supportedFileTypes: [ResourceTypeEnum.MARKDOWN, ResourceTypeEnum.CODE],
        maxFileSize: 50 * 1024 * 1024,
        enableVersionControl: false,
      });

      expect(config.enableGit).toBe(true);
      expect(config.autoSync).toBe(true);
      expect(config.syncInterval).toBe(3600);
      expect(config.defaultLinkedDocName).toBe('README.md');
      expect(config.supportedFileTypes).toEqual([ResourceTypeEnum.MARKDOWN, ResourceTypeEnum.CODE]);
      expect(config.maxFileSize).toBe(50 * 1024 * 1024);
      expect(config.enableVersionControl).toBe(false);
    });

    it('应该处理可选参数', () => {
      const config = new RepositoryConfig({
        enableGit: true,
        autoSync: false,
        defaultLinkedDocName: 'index.md',
        supportedFileTypes: [],
        maxFileSize: 100,
        enableVersionControl: true,
      });

      expect(config.syncInterval).toBeNull();
    });
  });

  describe('不可变性', () => {
    it('应该是冻结的（不可变）', () => {
      const config = RepositoryConfig.createDefault();

      expect(Object.isFrozen(config)).toBe(true);
      expect(Object.isFrozen(config.supportedFileTypes)).toBe(true);
    });

    it('不应该允许修改属性', () => {
      const config = RepositoryConfig.createDefault();

      expect(() => {
        (config as any).enableGit = true;
      }).toThrow();
    });

    it('不应该允许修改数组', () => {
      const config = new RepositoryConfig({
        enableGit: false,
        autoSync: false,
        defaultLinkedDocName: 'index.md',
        supportedFileTypes: [ResourceTypeEnum.MARKDOWN],
        maxFileSize: 100,
        enableVersionControl: true,
      });

      expect(() => {
        config.supportedFileTypes.push(ResourceTypeEnum.CODE as any);
      }).toThrow();
    });
  });

  describe('with() 方法 - 创建修改后的副本', () => {
    it('应该创建新实例而不修改原实例', () => {
      const original = RepositoryConfig.createDefault();
      const modified = original.with({ enableGit: true });

      expect(original.enableGit).toBe(false);
      expect(modified.enableGit).toBe(true);
      expect(original).not.toBe(modified);
    });

    it('应该只修改指定的字段', () => {
      const original = RepositoryConfig.createDefault();
      const modified = original.with({ autoSync: true, syncInterval: 1800 });

      expect(modified.autoSync).toBe(true);
      expect(modified.syncInterval).toBe(1800);
      expect(modified.enableGit).toBe(original.enableGit);
      expect(modified.defaultLinkedDocName).toBe(original.defaultLinkedDocName);
      expect(modified.maxFileSize).toBe(original.maxFileSize);
    });

    it('应该支持链式修改', () => {
      const config = RepositoryConfig.createDefault()
        .with({ enableGit: true })
        .with({ autoSync: true })
        .with({ syncInterval: 3600 });

      expect(config.enableGit).toBe(true);
      expect(config.autoSync).toBe(true);
      expect(config.syncInterval).toBe(3600);
    });
  });

  describe('equals() 方法', () => {
    it('相同内容的配置应该相等', () => {
      const config1 = new RepositoryConfig({
        enableGit: true,
        autoSync: true,
        syncInterval: 3600,
        defaultLinkedDocName: 'index.md',
        supportedFileTypes: [ResourceTypeEnum.MARKDOWN, ResourceTypeEnum.CODE],
        maxFileSize: 100,
        enableVersionControl: true,
      });

      const config2 = new RepositoryConfig({
        enableGit: true,
        autoSync: true,
        syncInterval: 3600,
        defaultLinkedDocName: 'index.md',
        supportedFileTypes: [ResourceTypeEnum.MARKDOWN, ResourceTypeEnum.CODE],
        maxFileSize: 100,
        enableVersionControl: true,
      });

      expect(config1.equals(config2)).toBe(true);
      expect(config2.equals(config1)).toBe(true);
    });

    it('不同内容的配置应该不相等', () => {
      const config1 = RepositoryConfig.createDefault();
      const config2 = config1.with({ enableGit: true });

      expect(config1.equals(config2)).toBe(false);
      expect(config2.equals(config1)).toBe(false);
    });

    it('数组顺序不同应该不相等', () => {
      const config1 = new RepositoryConfig({
        enableGit: false,
        autoSync: false,
        defaultLinkedDocName: 'index.md',
        supportedFileTypes: [ResourceTypeEnum.MARKDOWN, ResourceTypeEnum.CODE],
        maxFileSize: 100,
        enableVersionControl: true,
      });

      const config2 = new RepositoryConfig({
        enableGit: false,
        autoSync: false,
        defaultLinkedDocName: 'index.md',
        supportedFileTypes: [ResourceTypeEnum.CODE, ResourceTypeEnum.MARKDOWN],
        maxFileSize: 100,
        enableVersionControl: true,
      });

      expect(config1.equals(config2)).toBe(false);
    });

    it('与非 RepositoryConfig 对象比较应该返回 false', () => {
      const config = RepositoryConfig.createDefault();
      const other = { enableGit: false } as any;

      expect(config.equals(other)).toBe(false);
    });
  });

  describe('toContract() 和 fromContract()', () => {
    it('应该正确转换为 DTO', () => {
      const config = new RepositoryConfig({
        enableGit: true,
        autoSync: true,
        syncInterval: 3600,
        defaultLinkedDocName: 'README.md',
        supportedFileTypes: [ResourceTypeEnum.MARKDOWN],
        maxFileSize: 50,
        enableVersionControl: false,
      });

      const dto = config.toContract();

      expect(dto.enableGit).toBe(true);
      expect(dto.autoSync).toBe(true);
      expect(dto.syncInterval).toBe(3600);
      expect(dto.defaultLinkedDocName).toBe('README.md');
      expect(dto.supportedFileTypes).toEqual([ResourceTypeEnum.MARKDOWN]);
      expect(dto.maxFileSize).toBe(50);
      expect(dto.enableVersionControl).toBe(false);
    });

    it('应该从 DTO 正确创建对象', () => {
      const dto = {
        enableGit: true,
        autoSync: false,
        syncInterval: 1800,
        defaultLinkedDocName: 'index.md',
        supportedFileTypes: [ResourceTypeEnum.MARKDOWN, ResourceTypeEnum.CODE],
        maxFileSize: 200,
        enableVersionControl: true,
      };

      const config = RepositoryConfig.fromContract(dto);

      expect(config.enableGit).toBe(true);
      expect(config.autoSync).toBe(false);
      expect(config.syncInterval).toBe(1800);
      expect(config.defaultLinkedDocName).toBe('index.md');
      expect(config.supportedFileTypes).toEqual([ResourceTypeEnum.MARKDOWN, ResourceTypeEnum.CODE]);
      expect(config.maxFileSize).toBe(200);
      expect(config.enableVersionControl).toBe(true);
    });

    it('应该支持往返转换（roundtrip）', () => {
      const original = new RepositoryConfig({
        enableGit: true,
        autoSync: true,
        syncInterval: 3600,
        defaultLinkedDocName: 'README.md',
        supportedFileTypes: [ResourceTypeEnum.MARKDOWN, ResourceTypeEnum.CODE],
        maxFileSize: 100,
        enableVersionControl: true,
      });

      const dto = original.toContract();
      const restored = RepositoryConfig.fromContract(dto);

      expect(original.equals(restored)).toBe(true);
    });
  });
});
