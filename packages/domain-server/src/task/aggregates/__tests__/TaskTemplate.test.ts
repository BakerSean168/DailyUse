/**
 * TaskTemplate 聚合根单元测试
 *
 * 测试覆盖：
 * - 工厂方法 (create, fromServerDTO, fromPersistenceDTO)
 * - 状态管理 (activate, pause, archive, softDelete, restore)
 * - 实例生成 (generateInstances, createInstance)
 * - 目标绑定 (bindToGoal, unbindFromGoal)
 * - 错误处理 (所有业务规则验证)
 *
 * 目标覆盖率: 80%+
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TaskTemplate } from '../TaskTemplate';
import { TaskTimeConfig } from '../../value-objects/TaskTimeConfig';
import { RecurrenceRule } from '../../value-objects/RecurrenceRule';
import {
  ImportanceLevel,
  RecurrenceFrequency,
  TaskType,
  TimeType,
  UrgencyLevel,
} from '@dailyuse/contracts/task';
import {
  InvalidTaskTemplateStateError,
  TaskTemplateArchivedError,
  InvalidDateRangeError,
  InvalidGoalBindingError,
} from '../../errors';


describe('TaskTemplate Aggregate', () => {
  // ==================== 测试数据准备 ====================

  const mockAccountUuid = '550e8400-e29b-41d4-a716-446655440000';
  const mockGoalUuid = '550e8400-e29b-41d4-a716-446655440001';
  const mockKeyResultUuid = '550e8400-e29b-41d4-a716-446655440002';

  /**
   * 创建测试用的时间配置
   */
  const createTestTimeConfig = (): TaskTimeConfig => {
    return new TaskTimeConfig({
      timeType: 'POINT' as TimeType,
      startDate: Date.now() + 86400000, // 明天
    });
  };

  /**
   * 创建测试用的重复规则
   */
  const createTestRecurrenceRule = (): RecurrenceRule => {
    return new RecurrenceRule({
      frequency: 'DAILY' as RecurrenceFrequency,
      interval: 1,
      daysOfWeek: [],
    });
  };

  /**
   * 创建基础任务模板
   */
  const createTestTemplate = (overrides?: any): TaskTemplate => {
    return TaskTemplate.create({
      accountUuid: mockAccountUuid,
      title: 'Test Task Template',
      description: 'Test Description',
      taskType: 'ONE_TIME' as TaskType,
      timeConfig: createTestTimeConfig(),
      importance: ImportanceLevel.Moderate,
      urgency: UrgencyLevel.Medium,
      ...overrides,
    });
  };

  // ==================== 工厂方法测试 ====================

  describe('Factory Methods', () => {
    describe('create()', () => {
      it('should create a task template with required fields', () => {
        const template = createTestTemplate();

        expect(template.uuid).toBeDefined();
        expect(template.accountUuid).toBe(mockAccountUuid);
        expect(template.title).toBe('Test Task Template');
        expect(template.status).toBe('ACTIVE');
        expect(template.importance).toBe(ImportanceLevel.Moderate);
        expect(template.urgency).toBe(UrgencyLevel.Medium);
      });

      it('should throw error when accountUuid is empty', () => {
        expect(() => {
          TaskTemplate.create({
            accountUuid: '',
            title: 'Test',
            taskType: 'ONE_TIME' as TaskType,
            timeConfig: createTestTimeConfig(),
          });
        }).toThrow(InvalidTaskTemplateStateError);
      });

      it('should throw error when title is empty', () => {
        expect(() => {
          TaskTemplate.create({
            accountUuid: mockAccountUuid,
            title: '',
            taskType: 'ONE_TIME' as TaskType,
            timeConfig: createTestTimeConfig(),
          });
        }).toThrow(InvalidTaskTemplateStateError);
      });

      it('should throw error when timeConfig is missing', () => {
        expect(() => {
          TaskTemplate.create({
            accountUuid: mockAccountUuid,
            title: 'Test',
            taskType: 'ONE_TIME' as TaskType,
            timeConfig: null as any,
          });
        }).toThrow(InvalidTaskTemplateStateError);
      });

      it('should set default values for optional fields', () => {
        const template = TaskTemplate.create({
          accountUuid: mockAccountUuid,
          title: 'Test',
          taskType: 'ONE_TIME' as TaskType,
          timeConfig: createTestTimeConfig(),
        });

        expect(template.importance).toBe(ImportanceLevel.Moderate);
        expect(template.urgency).toBe(UrgencyLevel.Medium);
        expect(template.tags).toEqual([]);
        expect(template.generateAheadDays).toBe(30);
      });

      it('should create a recurring task template', () => {
        const recurrenceRule = createTestRecurrenceRule();
        const template = TaskTemplate.create({
          accountUuid: mockAccountUuid,
          title: 'Recurring Task',
          taskType: 'RECURRING' as TaskType,
          timeConfig: createTestTimeConfig(),
          recurrenceRule,
        });

        expect(template.taskType).toBe('RECURRING');
        expect(template.recurrenceRule).toBeDefined();
        expect(template.recurrenceRule?.frequency).toBe('DAILY');
      });
    });
  });

  // ==================== 状态管理测试 ====================

  describe('Status Management', () => {
    let template: TaskTemplate;

    beforeEach(() => {
      template = createTestTemplate();
    });

    describe('activate()', () => {
      it('should activate a paused template', () => {
        template.pause();
        expect(template.status).toBe('PAUSED');

        template.activate();
        expect(template.status).toBe('ACTIVE');
      });

      it('should activate an archived template', () => {
        template.archive();
        expect(template.status).toBe('ARCHIVED');

        template.activate();
        expect(template.status).toBe('ACTIVE');
      });

      it('should throw error when activating a deleted template', () => {
        template.softDelete();

        expect(() => template.activate()).toThrow(InvalidTaskTemplateStateError);
        expect(() => template.activate()).toThrow('Cannot activate a deleted template');
      });

      it('should throw error when template is already active', () => {
        expect(template.status).toBe('ACTIVE');

        expect(() => template.activate()).toThrow(InvalidTaskTemplateStateError);
        expect(() => template.activate()).toThrow('Template is already active');
      });
    });

    describe('pause()', () => {
      it('should pause an active template', () => {
        expect(template.status).toBe('ACTIVE');

        template.pause();
        expect(template.status).toBe('PAUSED');
      });

      it('should throw error when pausing a non-active template', () => {
        template.pause();
        expect(template.status).toBe('PAUSED');

        expect(() => template.pause()).toThrow(InvalidTaskTemplateStateError);
        expect(() => template.pause()).toThrow('Can only pause active templates');
      });
    });

    describe('archive()', () => {
      it('should archive an active template', () => {
        template.archive();
        expect(template.status).toBe('ARCHIVED');
      });

      it('should throw error when archiving a deleted template', () => {
        template.softDelete();

        expect(() => template.archive()).toThrow(InvalidTaskTemplateStateError);
        expect(() => template.archive()).toThrow('Cannot archive a deleted template');
      });

      it('should throw error when template is already archived', () => {
        template.archive();

        expect(() => template.archive()).toThrow(TaskTemplateArchivedError);
      });
    });

    describe('softDelete()', () => {
      it('should soft delete a template', () => {
        template.softDelete();
        expect(template.status).toBe('DELETED');
        expect(template.deletedAt).toBeDefined();
        expect(template.deletedAt).toBeGreaterThan(0);
      });

      it('should throw error when template is already deleted', () => {
        template.softDelete();

        expect(() => template.softDelete()).toThrow(InvalidTaskTemplateStateError);
        expect(() => template.softDelete()).toThrow('Template is already deleted');
      });
    });

    describe('restore()', () => {
      it('should restore a deleted template', () => {
        template.softDelete();
        expect(template.status).toBe('DELETED');

        template.restore();
        expect(template.status).toBe('ACTIVE');
        expect(template.deletedAt).toBeNull();
      });

      it('should throw error when restoring a non-deleted template', () => {
        expect(template.status).toBe('ACTIVE');

        expect(() => template.restore()).toThrow(InvalidTaskTemplateStateError);
        expect(() => template.restore()).toThrow('Can only restore deleted templates');
      });
    });
  });

  // ==================== 实例生成测试 ====================

  describe('Instance Generation', () => {
    let template: TaskTemplate;

    beforeEach(() => {
      template = createTestTemplate();
    });

    describe('generateInstances()', () => {
      it('should throw error when fromDate >= toDate', () => {
        const now = Date.now();
        const fromDate = now + 86400000;
        const toDate = now;

        expect(() => template.generateInstances(fromDate, toDate)).toThrow(InvalidDateRangeError);
      });

      it('should throw error when template is archived', () => {
        template.archive();
        const fromDate = Date.now();
        const toDate = fromDate + 86400000;

        expect(() => template.generateInstances(fromDate, toDate)).toThrow(
          TaskTemplateArchivedError,
        );
      });

      it('should throw error when template is not active', () => {
        template.pause();
        const fromDate = Date.now();
        const toDate = fromDate + 86400000;

        expect(() => template.generateInstances(fromDate, toDate)).toThrow(
          InvalidTaskTemplateStateError,
        );
        expect(() => template.generateInstances(fromDate, toDate)).toThrow(
          'Can only generate instances for active templates',
        );
      });

      it('should generate instances for a one-time task', () => {
        // TODO: 实现实例生成逻辑测试
        // const instances = template.generateInstances(fromDate, toDate);
        // expect(instances).toHaveLength(1);
      });

      it('should generate instances for a recurring task', () => {
        // TODO: 实现重复任务实例生成测试
      });
    });

    describe('createInstance()', () => {
      it('should throw error when template is archived', () => {
        template.archive();

        expect(() => template.createInstance({ instanceDate: Date.now() })).toThrow(
          TaskTemplateArchivedError,
        );
      });

      it('should throw error when template is deleted', () => {
        template.softDelete();

        expect(() => template.createInstance({ instanceDate: Date.now() })).toThrow(
          InvalidTaskTemplateStateError,
        );
        expect(() => template.createInstance({ instanceDate: Date.now() })).toThrow(
          'Cannot create instance from deleted template',
        );
      });

      it('should throw error when instanceDate is invalid', () => {
        expect(() => template.createInstance({ instanceDate: null })).toThrow(
          InvalidTaskTemplateStateError,
        );
        expect(() => template.createInstance({ instanceDate: 'invalid' as any })).toThrow(
          InvalidTaskTemplateStateError,
        );
      });

      it('should create an instance successfully', () => {
        const instanceDate = Date.now() + 86400000;
        const instanceUuid = template.createInstance({ instanceDate });

        expect(instanceUuid).toBeDefined();
        expect(typeof instanceUuid).toBe('string');
        expect(template.instances).toHaveLength(1);
      });
    });
  });

  // ==================== 目标绑定测试 ====================

  describe('Goal Binding', () => {
    let template: TaskTemplate;

    beforeEach(() => {
      template = createTestTemplate();
    });

    describe('bindToGoal()', () => {
      it('should bind template to a goal', () => {
        template.bindToGoal(mockGoalUuid, mockKeyResultUuid, 1);

        expect(template.isLinkedToGoal()).toBe(true);
        expect(template.goalBinding).toBeDefined();
        expect(template.goalBinding?.goalUuid).toBe(mockGoalUuid);
        expect(template.goalBinding?.keyResultUuid).toBe(mockKeyResultUuid);
      });

      it('should throw error when goalUuid is empty', () => {
        expect(() => template.bindToGoal('', mockKeyResultUuid, 1)).toThrow(
          InvalidGoalBindingError,
        );
        expect(() => template.bindToGoal('', mockKeyResultUuid, 1)).toThrow(
          'Goal UUID and Key Result UUID are required',
        );
      });

      it('should throw error when keyResultUuid is empty', () => {
        expect(() => template.bindToGoal(mockGoalUuid, '', 1)).toThrow(InvalidGoalBindingError);
      });

      it('should throw error when template is already bound', () => {
        template.bindToGoal(mockGoalUuid, mockKeyResultUuid, 1);

        expect(() => template.bindToGoal('another-goal', 'another-kr', 1)).toThrow(
          InvalidGoalBindingError,
        );
        expect(() => template.bindToGoal('another-goal', 'another-kr', 1)).toThrow(
          'Template is already bound to a goal',
        );
      });

      it('should throw error when template is archived', () => {
        template.archive();

        expect(() => template.bindToGoal(mockGoalUuid, mockKeyResultUuid, 1)).toThrow(
          TaskTemplateArchivedError,
        );
      });
    });

    describe('unbindFromGoal()', () => {
      it('should unbind template from goal', () => {
        template.bindToGoal(mockGoalUuid, mockKeyResultUuid, 1);
        expect(template.isLinkedToGoal()).toBe(true);

        template.unbindFromGoal();
        expect(template.isLinkedToGoal()).toBe(false);
        expect(template.goalBinding).toBeNull();
      });

      it('should throw error when template is not bound', () => {
        expect(() => template.unbindFromGoal()).toThrow(InvalidGoalBindingError);
        expect(() => template.unbindFromGoal()).toThrow('Template is not bound to any goal');
      });

      it('should throw error when template is archived', () => {
        template.bindToGoal(mockGoalUuid, mockKeyResultUuid, 1);
        template.archive();

        expect(() => template.unbindFromGoal()).toThrow(TaskTemplateArchivedError);
      });
    });
  });

  // ==================== 历史记录测试 ====================

  describe('History Tracking', () => {
    it('should add created history on creation', () => {
      const template = createTestTemplate();

      expect(template.history).toHaveLength(1);
      expect(template.history[0].action).toBe('created');
    });

    it('should track status changes in history', () => {
      const template = createTestTemplate();

      template.pause();
      expect(template.history).toHaveLength(2);
      expect(template.history[1].action).toBe('paused');

      template.activate();
      expect(template.history).toHaveLength(3);
      expect(template.history[2].action).toBe('resumed');
    });

    it('should track goal binding in history', () => {
      const template = createTestTemplate();

      template.bindToGoal(mockGoalUuid, mockKeyResultUuid, 1);
      const lastHistory = template.history[template.history.length - 1];

      expect(lastHistory.action).toBe('goal_bound');
      expect(lastHistory.changes).toBeDefined();
    });
  });

  // ==================== DTO 转换测试 ====================

  describe('DTO Conversions', () => {
    let template: TaskTemplate;

    beforeEach(() => {
      template = createTestTemplate({
        tags: ['urgent', 'work'],
        color: '#FF5733',
      });
    });

    describe('toClientDTO()', () => {
      it('should convert to client DTO without children', () => {
        const dto = template.toClientDTO(false);

        expect(dto.uuid).toBe(template.uuid);
        expect(dto.title).toBe(template.title);
        expect(dto.status).toBe(template.status);
        expect(dto.tags).toEqual(['urgent', 'work']);
        expect(dto.color).toBe('#FF5733');
        expect(dto.instances).toBeUndefined();
      });

      it('should convert to client DTO with children', () => {
        const instanceUuid = template.createInstance({ instanceDate: Date.now() });
        const dto = template.toClientDTO(true);

        expect(dto.instances).toBeDefined();
        expect(dto.instances).toHaveLength(1);
      });
    });

    describe('toServerDTO()', () => {
      it('should convert to server DTO', () => {
        const dto = template.toServerDTO();

        expect(dto.uuid).toBe(template.uuid);
        expect(dto.accountUuid).toBe(template.accountUuid);
        expect(dto.title).toBe(template.title);
        expect(dto.timeConfig).toBeDefined();
      });
    });

    describe('toPersistenceDTO()', () => {
      it('should flatten to persistence DTO', () => {
        const dto = template.toPersistenceDTO();

        expect(dto.uuid).toBe(template.uuid);
        expect(dto.timeConfigType).toBeDefined();
        expect(dto.timeConfigStartTime).toBeDefined();
        expect(dto.tags).toBeDefined();
      });
    });
  });

  // ==================== 边界情况测试 ====================

  describe('Edge Cases', () => {
    it('should handle multiple state transitions correctly', () => {
      const template = createTestTemplate();

      template.pause();
      template.activate();
      template.archive();
      template.activate();

      expect(template.status).toBe('ACTIVE');
      expect(template.history.length).toBeGreaterThan(4);
    });

    it('should maintain data consistency after errors', () => {
      const template = createTestTemplate();
      const originalStatus = template.status;

      try {
        template.archive();
        template.archive(); // Should throw
      } catch (error) {
        // Status should remain ARCHIVED
        expect(template.status).toBe('ARCHIVED');
      }
    });

    it('should handle goal binding and unbinding cycles', () => {
      const template = createTestTemplate();

      template.bindToGoal(mockGoalUuid, mockKeyResultUuid, 1);
      template.unbindFromGoal();
      template.bindToGoal('new-goal', 'new-kr', 2);

      expect(template.isLinkedToGoal()).toBe(true);
      expect(template.goalBinding?.goalUuid).toBe('new-goal');
    });
  });
});
