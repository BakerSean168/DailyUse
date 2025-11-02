/**
 * TaskReminderConfig 值对象单元测试
 *
 * 测试覆盖：
 * - 构造函数和工厂方法
 * - 不可变性
 * - 值相等性 (equals)
 * - with() 方法
 * - DTO 转换 (toServerDTO, toClientDTO, toPersistenceDTO)
 * - 提醒触发器管理 (ABSOLUTE, RELATIVE)
 * - 边界条件和错误处理
 *
 * 目标覆盖率: 90%+
 */

import { describe, it, expect } from 'vitest';
import { TaskReminderConfig } from '../TaskReminderConfig';
import type { TaskContracts } from '@dailyuse/contracts';

describe('TaskReminderConfig Value Object', () => {
  // ==================== 测试数据 ====================
  const mockAbsoluteTime = Date.now() + 3600000; // 1小时后
  
  const mockAbsoluteTrigger: TaskContracts.ReminderTrigger = {
    type: 'ABSOLUTE',
    absoluteTime: mockAbsoluteTime,
    relativeValue: null,
    relativeUnit: null,
  };

  const mockRelativeTrigger: TaskContracts.ReminderTrigger = {
    type: 'RELATIVE',
    absoluteTime: null,
    relativeValue: 30,
    relativeUnit: 'MINUTES',
  };

  // ==================== 构造函数测试 ====================
  describe('Constructor', () => {
    it('应该创建禁用的提醒配置', () => {
      const config = new TaskReminderConfig({
        enabled: false,
        triggers: [],
      });

      expect(config.enabled).toBe(false);
      expect(config.triggers).toEqual([]);
    });

    it('应该创建启用的提醒配置', () => {
      const config = new TaskReminderConfig({
        enabled: true,
        triggers: [mockAbsoluteTrigger],
      });

      expect(config.enabled).toBe(true);
      expect(config.triggers.length).toBe(1);
    });

    it('应该创建包含绝对时间触发器的配置', () => {
      const config = new TaskReminderConfig({
        enabled: true,
        triggers: [mockAbsoluteTrigger],
      });

      expect(config.triggers[0].type).toBe('ABSOLUTE');
      expect(config.triggers[0].absoluteTime).toBe(mockAbsoluteTime);
      expect(config.triggers[0].relativeValue).toBeNull();
      expect(config.triggers[0].relativeUnit).toBeNull();
    });

    it('应该创建包含相对时间触发器的配置', () => {
      const config = new TaskReminderConfig({
        enabled: true,
        triggers: [mockRelativeTrigger],
      });

      expect(config.triggers[0].type).toBe('RELATIVE');
      expect(config.triggers[0].relativeValue).toBe(30);
      expect(config.triggers[0].relativeUnit).toBe('MINUTES');
      expect(config.triggers[0].absoluteTime).toBeNull();
    });

    it('应该创建包含多个触发器的配置', () => {
      const config = new TaskReminderConfig({
        enabled: true,
        triggers: [mockAbsoluteTrigger, mockRelativeTrigger],
      });

      expect(config.triggers.length).toBe(2);
      expect(config.triggers[0].type).toBe('ABSOLUTE');
      expect(config.triggers[1].type).toBe('RELATIVE');
    });

    it('应该深拷贝触发器数组（防止外部修改）', () => {
      const originalTriggers = [mockAbsoluteTrigger];
      const config = new TaskReminderConfig({
        enabled: true,
        triggers: originalTriggers,
      });

      // 修改原数组不应影响配置
      originalTriggers.push(mockRelativeTrigger);

      expect(config.triggers.length).toBe(1);
    });

    it('应该深拷贝触发器对象（防止外部修改）', () => {
      const mutableTrigger = { ...mockAbsoluteTrigger };
      const config = new TaskReminderConfig({
        enabled: true,
        triggers: [mutableTrigger],
      });

      // 修改原对象不应影响配置
      mutableTrigger.absoluteTime = 999;

      expect(config.triggers[0].absoluteTime).toBe(mockAbsoluteTime);
    });
  });

  // ==================== 不可变性测试 ====================
  describe('Immutability', () => {
    it('应该是不可变的（冻结对象）', () => {
      const config = new TaskReminderConfig({
        enabled: true,
        triggers: [mockAbsoluteTrigger],
      });

      expect(Object.isFrozen(config)).toBe(true);
    });

    it('triggers 数组应该是不可变的', () => {
      const config = new TaskReminderConfig({
        enabled: true,
        triggers: [mockAbsoluteTrigger],
      });

      expect(Object.isFrozen(config.triggers)).toBe(true);

      // 尝试修改应该失败
      expect(() => {
        (config.triggers as any).push(mockRelativeTrigger);
      }).toThrow();
    });

    it('每个触发器对象应该是不可变的', () => {
      const config = new TaskReminderConfig({
        enabled: true,
        triggers: [mockAbsoluteTrigger],
      });

      expect(Object.isFrozen(config.triggers[0])).toBe(true);

      // 尝试修改应该失败
      expect(() => {
        (config.triggers[0] as any).absoluteTime = 0;
      }).toThrow();
    });

    it('不应该允许修改 enabled 属性', () => {
      const config = new TaskReminderConfig({
        enabled: true,
        triggers: [],
      });

      expect(() => {
        (config as any).enabled = false;
      }).toThrow();
    });
  });

  // ==================== equals() 方法测试 ====================
  describe('equals()', () => {
    it('应该认为相同配置相等', () => {
      const config1 = new TaskReminderConfig({
        enabled: true,
        triggers: [mockAbsoluteTrigger],
      });

      const config2 = new TaskReminderConfig({
        enabled: true,
        triggers: [mockAbsoluteTrigger],
      });

      expect(config1.equals(config2)).toBe(true);
      expect(config2.equals(config1)).toBe(true);
    });

    it('应该认为不同 enabled 的配置不相等', () => {
      const config1 = new TaskReminderConfig({
        enabled: true,
        triggers: [],
      });

      const config2 = new TaskReminderConfig({
        enabled: false,
        triggers: [],
      });

      expect(config1.equals(config2)).toBe(false);
    });

    it('应该认为不同触发器的配置不相等', () => {
      const config1 = new TaskReminderConfig({
        enabled: true,
        triggers: [mockAbsoluteTrigger],
      });

      const config2 = new TaskReminderConfig({
        enabled: true,
        triggers: [mockRelativeTrigger],
      });

      expect(config1.equals(config2)).toBe(false);
    });

    it('应该认为触发器数量不同的配置不相等', () => {
      const config1 = new TaskReminderConfig({
        enabled: true,
        triggers: [mockAbsoluteTrigger],
      });

      const config2 = new TaskReminderConfig({
        enabled: true,
        triggers: [mockAbsoluteTrigger, mockRelativeTrigger],
      });

      expect(config1.equals(config2)).toBe(false);
    });

    it('应该认为空触发器的配置相等', () => {
      const config1 = new TaskReminderConfig({
        enabled: false,
        triggers: [],
      });

      const config2 = new TaskReminderConfig({
        enabled: false,
        triggers: [],
      });

      expect(config1.equals(config2)).toBe(true);
    });

    it('应该拒绝与非 TaskReminderConfig 对象比较', () => {
      const config = new TaskReminderConfig({
        enabled: true,
        triggers: [],
      });

      expect(config.equals({} as any)).toBe(false);
      expect(config.equals(null as any)).toBe(false);
    });
  });

  // ==================== with() 方法测试 ====================
  describe('with()', () => {
    it('应该创建修改后的新实例', () => {
      const original = new TaskReminderConfig({
        enabled: false,
        triggers: [],
      });

      const modified = original.with({ enabled: true });

      expect(modified).not.toBe(original); // 不是同一个实例
      expect(modified.enabled).toBe(true);
      expect(original.enabled).toBe(false); // 原实例未修改
    });

    it('应该支持修改 enabled', () => {
      const original = new TaskReminderConfig({
        enabled: true,
        triggers: [mockAbsoluteTrigger],
      });

      const modified = original.with({ enabled: false });

      expect(modified.enabled).toBe(false);
      expect(original.enabled).toBe(true);
    });

    it('应该支持修改 triggers', () => {
      const original = new TaskReminderConfig({
        enabled: true,
        triggers: [mockAbsoluteTrigger],
      });

      const modified = original.with({ triggers: [mockRelativeTrigger] });

      expect(modified.triggers.length).toBe(1);
      expect(modified.triggers[0].type).toBe('RELATIVE');
      expect(original.triggers[0].type).toBe('ABSOLUTE');
    });

    it('应该支持同时修改多个属性', () => {
      const original = new TaskReminderConfig({
        enabled: false,
        triggers: [],
      });

      const modified = original.with({
        enabled: true,
        triggers: [mockAbsoluteTrigger, mockRelativeTrigger],
      });

      expect(modified.enabled).toBe(true);
      expect(modified.triggers.length).toBe(2);
    });

    it('应该保留未修改的属性', () => {
      const original = new TaskReminderConfig({
        enabled: true,
        triggers: [mockAbsoluteTrigger],
      });

      const modified = original.with({ enabled: false });

      expect(modified.enabled).toBe(false);
      expect(modified.triggers).toEqual(original.triggers);
    });
  });

  // ==================== DTO 转换测试 ====================
  describe('DTO Conversion', () => {
    describe('toServerDTO()', () => {
      it('应该正确转换禁用的配置', () => {
        const config = new TaskReminderConfig({
          enabled: false,
          triggers: [],
        });

        const dto = config.toServerDTO();

        expect(dto.enabled).toBe(false);
        expect(dto.triggers).toEqual([]);
      });

      it('应该正确转换启用的配置', () => {
        const config = new TaskReminderConfig({
          enabled: true,
          triggers: [mockAbsoluteTrigger],
        });

        const dto = config.toServerDTO();

        expect(dto.enabled).toBe(true);
        expect(dto.triggers.length).toBe(1);
        expect(dto.triggers[0].type).toBe('ABSOLUTE');
      });

      it('应该正确转换包含多个触发器的配置', () => {
        const config = new TaskReminderConfig({
          enabled: true,
          triggers: [mockAbsoluteTrigger, mockRelativeTrigger],
        });

        const dto = config.toServerDTO();

        expect(dto.triggers.length).toBe(2);
        expect(dto.triggers[0].type).toBe('ABSOLUTE');
        expect(dto.triggers[1].type).toBe('RELATIVE');
      });

      it('应该复制触发器数组', () => {
        const config = new TaskReminderConfig({
          enabled: true,
          triggers: [mockAbsoluteTrigger],
        });

        const dto = config.toServerDTO();
        dto.triggers.push(mockRelativeTrigger);

        // 原配置不应受影响
        expect(config.triggers.length).toBe(1);
      });
    });

    describe('toClientDTO()', () => {
      it('应该正确转换禁用的配置为 ClientDTO', () => {
        const config = new TaskReminderConfig({
          enabled: false,
          triggers: [],
        });

        const dto = config.toClientDTO();

        expect(dto.enabled).toBe(false);
        expect(dto.hasTriggers).toBe(false);
        expect(dto.triggerCount).toBe(0);
        expect(dto.reminderSummary).toBe('无提醒');
        expect(dto.triggerDescriptions).toEqual([]);
      });

      it('应该正确转换绝对时间触发器为 ClientDTO', () => {
        const config = new TaskReminderConfig({
          enabled: true,
          triggers: [mockAbsoluteTrigger],
        });

        const dto = config.toClientDTO();

        expect(dto.enabled).toBe(true);
        expect(dto.hasTriggers).toBe(true);
        expect(dto.triggerCount).toBe(1);
        expect(dto.triggerDescriptions[0]).toContain('在');
        expect(dto.triggerDescriptions[0]).toContain('提醒');
      });

      it('应该正确转换相对时间触发器为 ClientDTO', () => {
        const config = new TaskReminderConfig({
          enabled: true,
          triggers: [mockRelativeTrigger],
        });

        const dto = config.toClientDTO();

        expect(dto.enabled).toBe(true);
        expect(dto.triggerDescriptions[0]).toBe('提前 30 分钟');
      });

      it('应该正确处理不同时间单位的相对触发器', () => {
        const minutesTrigger: TaskContracts.ReminderTrigger = {
          type: 'RELATIVE',
          absoluteTime: null,
          relativeValue: 15,
          relativeUnit: 'MINUTES',
        };

        const hoursTrigger: TaskContracts.ReminderTrigger = {
          type: 'RELATIVE',
          absoluteTime: null,
          relativeValue: 2,
          relativeUnit: 'HOURS',
        };

        const daysTrigger: TaskContracts.ReminderTrigger = {
          type: 'RELATIVE',
          absoluteTime: null,
          relativeValue: 1,
          relativeUnit: 'DAYS',
        };

        const config = new TaskReminderConfig({
          enabled: true,
          triggers: [minutesTrigger, hoursTrigger, daysTrigger],
        });

        const dto = config.toClientDTO();

        expect(dto.triggerDescriptions[0]).toBe('提前 15 分钟');
        expect(dto.triggerDescriptions[1]).toBe('提前 2 小时');
        expect(dto.triggerDescriptions[2]).toBe('提前 1 天');
      });

      it('应该正确生成多个触发器的摘要', () => {
        const config = new TaskReminderConfig({
          enabled: true,
          triggers: [mockRelativeTrigger, mockRelativeTrigger],
        });

        const dto = config.toClientDTO();

        expect(dto.reminderSummary).toContain('、');
        expect(dto.reminderSummary).toContain('提前 30 分钟');
      });

      it('应该标记有触发器的配置', () => {
        const config = new TaskReminderConfig({
          enabled: true,
          triggers: [mockAbsoluteTrigger],
        });

        const dto = config.toClientDTO();

        expect(dto.hasTriggers).toBe(true);
        expect(dto.triggerCount).toBe(1);
      });
    });

    describe('toPersistenceDTO()', () => {
      it('应该正确转换为 PersistenceDTO', () => {
        const config = new TaskReminderConfig({
          enabled: true,
          triggers: [mockAbsoluteTrigger],
        });

        const dto = config.toPersistenceDTO();

        expect(dto.enabled).toBe(true);
        expect(typeof dto.triggers).toBe('string');
        expect(JSON.parse(dto.triggers)).toEqual([mockAbsoluteTrigger]);
      });

      it('应该序列化空触发器数组', () => {
        const config = new TaskReminderConfig({
          enabled: false,
          triggers: [],
        });

        const dto = config.toPersistenceDTO();

        expect(JSON.parse(dto.triggers)).toEqual([]);
      });

      it('应该序列化多个触发器', () => {
        const config = new TaskReminderConfig({
          enabled: true,
          triggers: [mockAbsoluteTrigger, mockRelativeTrigger],
        });

        const dto = config.toPersistenceDTO();
        const parsed = JSON.parse(dto.triggers);

        expect(parsed.length).toBe(2);
        expect(parsed[0].type).toBe('ABSOLUTE');
        expect(parsed[1].type).toBe('RELATIVE');
      });
    });
  });

  // ==================== 工厂方法测试 ====================
  describe('Factory Methods', () => {
    describe('fromServerDTO()', () => {
      it('应该从 ServerDTO 正确恢复禁用的配置', () => {
        const dto: TaskContracts.TaskReminderConfigServerDTO = {
          enabled: false,
          triggers: [],
        };

        const config = TaskReminderConfig.fromServerDTO(dto);

        expect(config.enabled).toBe(false);
        expect(config.triggers).toEqual([]);
      });

      it('应该从 ServerDTO 正确恢复启用的配置', () => {
        const dto: TaskContracts.TaskReminderConfigServerDTO = {
          enabled: true,
          triggers: [mockAbsoluteTrigger],
        };

        const config = TaskReminderConfig.fromServerDTO(dto);

        expect(config.enabled).toBe(true);
        expect(config.triggers.length).toBe(1);
        expect(config.triggers[0].type).toBe('ABSOLUTE');
      });

      it('应该从 ServerDTO 正确恢复多个触发器', () => {
        const dto: TaskContracts.TaskReminderConfigServerDTO = {
          enabled: true,
          triggers: [mockAbsoluteTrigger, mockRelativeTrigger],
        };

        const config = TaskReminderConfig.fromServerDTO(dto);

        expect(config.triggers.length).toBe(2);
      });
    });

    describe('fromPersistenceDTO()', () => {
      it('应该从 PersistenceDTO 正确恢复配置', () => {
        const dto: TaskContracts.TaskReminderConfigPersistenceDTO = {
          enabled: true,
          triggers: JSON.stringify([mockAbsoluteTrigger]),
        };

        const config = TaskReminderConfig.fromPersistenceDTO(dto);

        expect(config.enabled).toBe(true);
        expect(config.triggers.length).toBe(1);
        expect(config.triggers[0].type).toBe('ABSOLUTE');
      });

      it('应该从 PersistenceDTO 正确恢复空触发器', () => {
        const dto: TaskContracts.TaskReminderConfigPersistenceDTO = {
          enabled: false,
          triggers: JSON.stringify([]),
        };

        const config = TaskReminderConfig.fromPersistenceDTO(dto);

        expect(config.triggers).toEqual([]);
      });

      it('应该从 PersistenceDTO 正确恢复多个触发器', () => {
        const dto: TaskContracts.TaskReminderConfigPersistenceDTO = {
          enabled: true,
          triggers: JSON.stringify([mockAbsoluteTrigger, mockRelativeTrigger]),
        };

        const config = TaskReminderConfig.fromPersistenceDTO(dto);

        expect(config.triggers.length).toBe(2);
      });
    });
  });

  // ==================== 往返转换测试 ====================
  describe('Round-trip Conversion', () => {
    it('应该正确处理 ServerDTO 往返转换', () => {
      const original = new TaskReminderConfig({
        enabled: true,
        triggers: [mockAbsoluteTrigger, mockRelativeTrigger],
      });

      const dto = original.toServerDTO();
      const restored = TaskReminderConfig.fromServerDTO(dto);

      expect(restored.equals(original)).toBe(true);
    });

    it('应该正确处理 PersistenceDTO 往返转换', () => {
      const original = new TaskReminderConfig({
        enabled: false,
        triggers: [],
      });

      const dto = original.toPersistenceDTO();
      const restored = TaskReminderConfig.fromPersistenceDTO(dto);

      expect(restored.equals(original)).toBe(true);
    });

    it('应该正确处理复杂配置的往返转换', () => {
      const complexTriggers: TaskContracts.ReminderTrigger[] = [
        mockAbsoluteTrigger,
        mockRelativeTrigger,
        {
          type: 'RELATIVE',
          absoluteTime: null,
          relativeValue: 1,
          relativeUnit: 'DAYS',
        },
      ];

      const original = new TaskReminderConfig({
        enabled: true,
        triggers: complexTriggers,
      });

      const dto = original.toPersistenceDTO();
      const restored = TaskReminderConfig.fromPersistenceDTO(dto);

      expect(restored.equals(original)).toBe(true);
      expect(restored.triggers.length).toBe(3);
    });
  });

  // ==================== 边界条件测试 ====================
  describe('Edge Cases', () => {
    it('应该处理空触发器数组', () => {
      const config = new TaskReminderConfig({
        enabled: true,
        triggers: [],
      });

      expect(config.triggers).toEqual([]);
      const dto = config.toClientDTO();
      expect(dto.hasTriggers).toBe(false);
      expect(dto.reminderSummary).toBe('无提醒');
    });

    it('应该处理大量触发器', () => {
      const manyTriggers = Array(10).fill(mockRelativeTrigger);
      const config = new TaskReminderConfig({
        enabled: true,
        triggers: manyTriggers,
      });

      expect(config.triggers.length).toBe(10);
      const dto = config.toClientDTO();
      expect(dto.triggerCount).toBe(10);
    });

    it('应该处理只有绝对时间的触发器', () => {
      const config = new TaskReminderConfig({
        enabled: true,
        triggers: [mockAbsoluteTrigger],
      });

      const dto = config.toClientDTO();
      expect(dto.triggerDescriptions[0]).toBeDefined();
      expect(dto.triggerDescriptions[0].length).toBeGreaterThan(0);
    });

    it('应该处理只有相对时间的触发器', () => {
      const config = new TaskReminderConfig({
        enabled: true,
        triggers: [mockRelativeTrigger],
      });

      const dto = config.toClientDTO();
      expect(dto.triggerDescriptions[0]).toBe('提前 30 分钟');
    });

    it('应该处理混合类型的触发器', () => {
      const config = new TaskReminderConfig({
        enabled: true,
        triggers: [mockAbsoluteTrigger, mockRelativeTrigger],
      });

      const dto = config.toClientDTO();
      expect(dto.triggerDescriptions.length).toBe(2);
      expect(dto.triggerDescriptions[0]).toContain('在');
      expect(dto.triggerDescriptions[1]).toContain('提前');
    });

    it('应该处理禁用但有触发器的配置', () => {
      const config = new TaskReminderConfig({
        enabled: false,
        triggers: [mockAbsoluteTrigger],
      });

      expect(config.enabled).toBe(false);
      expect(config.triggers.length).toBe(1);
      const dto = config.toClientDTO();
      expect(dto.hasTriggers).toBe(true);
    });

    it('应该处理启用但无触发器的配置', () => {
      const config = new TaskReminderConfig({
        enabled: true,
        triggers: [],
      });

      expect(config.enabled).toBe(true);
      const dto = config.toClientDTO();
      expect(dto.hasTriggers).toBe(false);
      expect(dto.reminderSummary).toBe('无提醒');
    });

    it('应该处理极大的相对值', () => {
      const largeTrigger: TaskContracts.ReminderTrigger = {
        type: 'RELATIVE',
        absoluteTime: null,
        relativeValue: 9999,
        relativeUnit: 'DAYS',
      };

      const config = new TaskReminderConfig({
        enabled: true,
        triggers: [largeTrigger],
      });

      const dto = config.toClientDTO();
      expect(dto.triggerDescriptions[0]).toBe('提前 9999 天');
    });

    it('应该处理极远的未来时间', () => {
      const farFuture = Date.now() + 365 * 24 * 3600 * 1000 * 10; // 10年后
      const futureTrigger: TaskContracts.ReminderTrigger = {
        type: 'ABSOLUTE',
        absoluteTime: farFuture,
        relativeValue: null,
        relativeUnit: null,
      };

      const config = new TaskReminderConfig({
        enabled: true,
        triggers: [futureTrigger],
      });

      expect(config.triggers[0].absoluteTime).toBe(farFuture);
    });
  });
});
