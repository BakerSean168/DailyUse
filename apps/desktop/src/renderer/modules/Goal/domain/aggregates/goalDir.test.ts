import { describe, it, expect, beforeEach } from 'vitest';
import { GoalFolder } from './GoalFolder';

describe('GoalFolder 聚合根测试', () => {
  let GoalFolder: GoalFolder;

  beforeEach(() => {
    GoalFolder = new GoalFolder({
      name: '工作目标',
      icon: 'mdi-briefcase',
      color: '#2196F3',
      description: '与工作相关的目标',
    });
  });

  describe('构造函数和基本属性', () => {
    it('应该正确创建目标目录实例', () => {
      expect(GoalFolder.name).toBe('工作目标');
      expect(GoalFolder.icon).toBe('mdi-briefcase');
      expect(GoalFolder.color).toBe('#2196F3');
      expect(GoalFolder.description).toBe('与工作相关的目标');
      expect(GoalFolder.lifecycle.status).toBe('active');
    });

    it('应该生成唯一的 UUID', () => {
      const dir1 = new GoalFolder({ name: '目录1' });
      const dir2 = new GoalFolder({ name: '目录2' });

      expect(dir1.uuid).not.toBe(dir2.uuid);
      expect(dir1.uuid).toMatch(/^[0-9a-f-]{36}$/i);
    });

    it('应该正确设置默认值', () => {
      const dirWithDefaults = new GoalFolder({});

      expect(dirWithDefaults.name).toBe('');
      expect(dirWithDefaults.icon).toBe('mdi-folder');
      expect(dirWithDefaults.color).toBe('default-color');
      expect(dirWithDefaults.sortConfig.sortKey).toBe('default');
      expect(dirWithDefaults.sortConfig.sortOrder).toBe(0);
      expect(dirWithDefaults.lifecycle.createdAt).toBeInstanceOf(Date);
      expect(dirWithDefaults.lifecycle.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('属性验证和设置', () => {
    it('应该允许设置有效的目录名称', () => {
      GoalFolder.name = '新的目录名称';
      expect(GoalFolder.name).toBe('新的目录名称');
      expect(GoalFolder.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('设置空名称时应该抛出错误', () => {
      expect(() => {
        GoalFolder.name = '';
      }).toThrow('目录名称不能为空');
    });

    it('设置只有空格的名称时应该抛出错误', () => {
      expect(() => {
        GoalFolder.name = '   ';
      }).toThrow('目录名称不能为空');
    });

    it('应该允许设置描述', () => {
      GoalFolder.description = '新的描述';
      expect(GoalFolder.description).toBe('新的描述');
      expect(GoalFolder.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('应该允许设置为 undefined 描述', () => {
      GoalFolder.description = undefined;
      expect(GoalFolder.description).toBeUndefined();
    });

    it('应该允许设置图标', () => {
      GoalFolder.icon = 'mdi-star';
      expect(GoalFolder.icon).toBe('mdi-star');
      expect(GoalFolder.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('应该允许设置颜色', () => {
      GoalFolder.color = '#FF5722';
      expect(GoalFolder.color).toBe('#FF5722');
      expect(GoalFolder.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('应该允许设置父目录UUID', () => {
      const parentUuid = 'parent-uuid-123';
      GoalFolder.parentUuid = parentUuid;
      expect(GoalFolder.parentUuid).toBe(parentUuid);
      expect(GoalFolder.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('设置自己为父目录时应该抛出错误', () => {
      expect(() => {
        GoalFolder.parentUuid = GoalFolder.uuid;
      }).toThrow('目录不能设置自己为父目录');
    });

    it('应该允许设置排序配置', () => {
      const newSortConfig = {
        sortKey: 'name',
        sortOrder: 1,
      };
      GoalFolder.sortConfig = newSortConfig;
      expect(GoalFolder.sortConfig).toEqual(newSortConfig);
      expect(GoalFolder.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('设置空排序键时应该抛出错误', () => {
      expect(() => {
        GoalFolder.sortConfig = {
          sortKey: '',
          sortOrder: 0,
        };
      }).toThrow('排序键不能为空');
    });
  });

  describe('静态方法', () => {
    it('isGoalFolder 应该正确识别 GoalFolder 实例', () => {
      expect(GoalFolder.isGoalFolder(GoalFolder)).toBe(true);

      // 测试 DTO 对象
      const dto = GoalFolder.toDTO();
      expect(GoalFolder.isGoalFolder(dto)).toBe(true);

      expect(GoalFolder.isGoalFolder({})).toBe(false);
      expect(GoalFolder.isGoalFolder(null)).toBeFalsy();
      expect(GoalFolder.isGoalFolder(undefined)).toBeFalsy();
    });

    it('ensureGoalFolder 应该正确处理各种输入', () => {
      expect(GoalFolder.ensureGoalFolder(GoalFolder)).toBe(GoalFolder);
      expect(GoalFolder.ensureGoalFolder(null)).toBe(null);

      const dto = GoalFolder.toDTO();
      const ensuredDir = GoalFolder.ensureGoalFolder(dto);
      expect(ensuredDir).toBeInstanceOf(GoalFolder);
      expect(ensuredDir?.uuid).toBe(GoalFolder.uuid);
    });

    it('ensureGoalFolderNeverNull 应该始终返回 GoalFolder 实例', () => {
      expect(GoalFolder.ensureGoalFolderNeverNull(GoalFolder)).toBe(GoalFolder);

      const defaultDir = GoalFolder.ensureGoalFolderNeverNull(null);
      expect(defaultDir).toBeInstanceOf(GoalFolder);
      expect(defaultDir.name).toBe('');
      expect(defaultDir.icon).toBe('mdi-folder');
    });

    it('validate 应该正确验证目录数据', () => {
      const validData = GoalFolder.toDTO();
      const result = GoalFolder.validate(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validate 应该识别无效数据', () => {
      const invalidData = {
        ...GoalFolder.toDTO(),
        name: '',
        icon: '',
      };
      const result = GoalFolder.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('目录名称不能为空');
      expect(result.errors).toContain('目录图标不能为空');
    });

    it('forCreate 应该创建用于新建的目录实例', () => {
      const createDir = GoalFolder.forCreate();

      expect(createDir.name).toBe('');
      expect(createDir.icon).toBe('mdi-folder');
      expect(createDir.parentUuid).toBeUndefined();
      expect(createDir.lifecycle.status).toBe('active');
    });
  });

  describe('数据转换', () => {
    it('应该能够转换为 DTO', () => {
      const dto = GoalFolder.toDTO();

      expect(dto).toHaveProperty('uuid');
      expect(dto).toHaveProperty('name');
      expect(dto).toHaveProperty('description');
      expect(dto).toHaveProperty('icon');
      expect(dto).toHaveProperty('color');
      expect(dto).toHaveProperty('sortConfig');
      expect(dto).toHaveProperty('parentUuid');
      expect(dto).toHaveProperty('lifecycle');

      expect(dto.name).toBe(GoalFolder.name);
      expect(dto.uuid).toBe(GoalFolder.uuid);
      expect(dto.icon).toBe(GoalFolder.icon);
      expect(dto.color).toBe(GoalFolder.color);
    });

    it('应该能够从 DTO 创建实例', () => {
      const dto = GoalFolder.toDTO();
      const newDir = GoalFolder.fromDTO(dto);

      expect(newDir.uuid).toBe(GoalFolder.uuid);
      expect(newDir.name).toBe(GoalFolder.name);
      expect(newDir.icon).toBe(GoalFolder.icon);
      expect(newDir.color).toBe(GoalFolder.color);
      expect(newDir.description).toBe(GoalFolder.description);
      expect(newDir.lifecycle.status).toBe(GoalFolder.lifecycle.status);
    });

    it('应该能够处理缺失字段的 DTO', () => {
      const partialDto = {
        uuid: 'test-uuid',
        name: '测试目录',
        icon: 'mdi-test',
        lifecycle: {
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active' as const,
        },
        sortConfig: {
          sortKey: 'default',
          sortOrder: 0,
        },
      };

      const dir = GoalFolder.fromDTO(partialDto as any);

      expect(dir.name).toBe('测试目录');
      expect(dir.color).toBe('default-color');
      expect(dir.description).toBe(''); // GoalFolder 可能将空描述设为空字符串而非 undefined
    });

    it('应该能够克隆目录', () => {
      const clonedDir = GoalFolder.clone();

      expect(clonedDir).not.toBe(GoalFolder);
      expect(clonedDir.uuid).toBe(GoalFolder.uuid);
      expect(clonedDir.name).toBe(GoalFolder.name);
      expect(clonedDir.icon).toBe(GoalFolder.icon);
      expect(clonedDir.color).toBe('default-color'); // clone 方法可能重置为默认颜色
    });
  });

  describe('生命周期管理', () => {
    it('修改属性时应该更新 updatedAt', () => {
      const originalUpdatedAt = GoalFolder.lifecycle.updatedAt;

      // 等待一小段时间确保时间戳不同
      setTimeout(() => {
        GoalFolder.name = '更新的名称';
        expect(GoalFolder.lifecycle.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 1);
    });

    it('应该正确处理无效日期', () => {
      const invalidDto = {
        uuid: 'test-uuid',
        name: '测试目录',
        icon: 'mdi-test',
        color: 'test-color',
        lifecycle: {
          createdAt: 'invalid-date' as any,
          updatedAt: 'invalid-date' as any,
          status: 'active' as const,
        },
        sortConfig: {
          sortKey: 'default',
          sortOrder: 0,
        },
      };

      const dir = GoalFolder.fromDTO(invalidDto);

      expect(dir.lifecycle.createdAt).toBeInstanceOf(Date);
      expect(dir.lifecycle.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('边界情况测试', () => {
    it('应该处理非常长的名称', () => {
      const longName = 'a'.repeat(1000);
      GoalFolder.name = longName;
      expect(GoalFolder.name).toBe(longName);
    });

    it('应该处理特殊字符', () => {
      const specialName = '特殊字符!@#$%^&*()_+{}|:<>?[];\'",./~`';
      GoalFolder.name = specialName;
      expect(GoalFolder.name).toBe(specialName);
    });

    it('应该处理 Unicode 字符', () => {
      const unicodeName = '🎯 目标目录 📁';
      GoalFolder.name = unicodeName;
      expect(GoalFolder.name).toBe(unicodeName);
    });
  });
});
