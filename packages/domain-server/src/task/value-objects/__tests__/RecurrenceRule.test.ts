/**
 * RecurrenceRule 值对象单元测试
 *
 * 测试覆盖：
 * - 构造函数验证
 * - 不可变性
 * - 值相等性 (equals)
 * - with() 方法
 * - DTO 转换 (toServerDTO, toClientDTO, toPersistenceDTO)
 * - 工厂方法 (fromServerDTO, fromPersistenceDTO)
 * - 边界条件和错误处理
 *
 * 目标覆盖率: 95%+
 */

import { describe, it, expect } from 'vitest';
import { RecurrenceRule } from '../RecurrenceRule';
import type { TaskContracts } from '@dailyuse/contracts';

describe('RecurrenceRule Value Object', () => {
  // ==================== 测试数据 ====================
  const mockDaysOfWeek: TaskContracts.DayOfWeek[] = [1, 3, 5]; // 周一、周三、周五

  // ==================== 构造函数测试 ====================
  describe('Constructor', () => {
    it('应该创建有效的每日重复规则', () => {
      const rule = new RecurrenceRule({
        frequency: 'DAILY',
        interval: 1,
        daysOfWeek: [],
      });

      expect(rule.frequency).toBe('DAILY');
      expect(rule.interval).toBe(1);
      expect(rule.daysOfWeek).toEqual([]);
      expect(rule.endDate).toBeNull();
      expect(rule.occurrences).toBeNull();
    });

    it('应该创建有效的每周重复规则', () => {
      const rule = new RecurrenceRule({
        frequency: 'WEEKLY',
        interval: 1,
        daysOfWeek: mockDaysOfWeek,
      });

      expect(rule.frequency).toBe('WEEKLY');
      expect(rule.interval).toBe(1);
      expect(rule.daysOfWeek).toEqual(mockDaysOfWeek);
    });

    it('应该创建有效的每月重复规则', () => {
      const rule = new RecurrenceRule({
        frequency: 'MONTHLY',
        interval: 2,
        daysOfWeek: [],
      });

      expect(rule.frequency).toBe('MONTHLY');
      expect(rule.interval).toBe(2);
    });

    it('应该创建有效的每年重复规则', () => {
      const rule = new RecurrenceRule({
        frequency: 'YEARLY',
        interval: 1,
        daysOfWeek: [],
      });

      expect(rule.frequency).toBe('YEARLY');
      expect(rule.interval).toBe(1);
    });

    it('应该支持设置结束日期', () => {
      const futureDate = Date.now() + 86400000 * 30; // 30天后
      const rule = new RecurrenceRule({
        frequency: 'DAILY',
        interval: 1,
        daysOfWeek: [],
        endDate: futureDate,
      });

      expect(rule.endDate).toBe(futureDate);
    });

    it('应该支持设置重复次数', () => {
      const rule = new RecurrenceRule({
        frequency: 'WEEKLY',
        interval: 1,
        daysOfWeek: mockDaysOfWeek,
        occurrences: 10,
      });

      expect(rule.occurrences).toBe(10);
    });

    it('应该拒绝无效的间隔（小于1）', () => {
      expect(() => {
        new RecurrenceRule({
          frequency: 'DAILY',
          interval: 0,
          daysOfWeek: [],
        });
      }).toThrow('Interval must be at least 1');

      expect(() => {
        new RecurrenceRule({
          frequency: 'DAILY',
          interval: -1,
          daysOfWeek: [],
        });
      }).toThrow('Interval must be at least 1');
    });

    it('应该拒绝过去的结束日期', () => {
      const pastDate = Date.now() - 86400000; // 1天前

      expect(() => {
        new RecurrenceRule({
          frequency: 'DAILY',
          interval: 1,
          daysOfWeek: [],
          endDate: pastDate,
        });
      }).toThrow('End date must be in the future');
    });

    it('应该拒绝无效的重复次数（小于1）', () => {
      expect(() => {
        new RecurrenceRule({
          frequency: 'DAILY',
          interval: 1,
          daysOfWeek: [],
          occurrences: 0,
        });
      }).toThrow('Occurrences must be at least 1');

      expect(() => {
        new RecurrenceRule({
          frequency: 'DAILY',
          interval: 1,
          daysOfWeek: [],
          occurrences: -1,
        });
      }).toThrow('Occurrences must be at least 1');
    });

    it('应该复制 daysOfWeek 数组（防止外部修改）', () => {
      const originalDays = [1, 3, 5];
      const rule = new RecurrenceRule({
        frequency: 'WEEKLY',
        interval: 1,
        daysOfWeek: originalDays,
      });

      // 修改原数组不应影响规则
      originalDays.push(6);

      expect(rule.daysOfWeek).toEqual([1, 3, 5]);
      expect(rule.daysOfWeek.length).toBe(3);
    });
  });

  // ==================== 不可变性测试 ====================
  describe('Immutability', () => {
    it('应该是不可变的（冻结对象）', () => {
      const rule = new RecurrenceRule({
        frequency: 'DAILY',
        interval: 1,
        daysOfWeek: [],
      });

      expect(Object.isFrozen(rule)).toBe(true);
    });

    it('daysOfWeek 数组应该是不可变的', () => {
      const rule = new RecurrenceRule({
        frequency: 'WEEKLY',
        interval: 1,
        daysOfWeek: [1, 3, 5],
      });

      expect(Object.isFrozen(rule.daysOfWeek)).toBe(true);

      // 尝试修改应该失败（在严格模式下会抛出错误）
      expect(() => {
        (rule.daysOfWeek as any).push(6);
      }).toThrow();
    });

    it('不应该允许修改属性', () => {
      const rule = new RecurrenceRule({
        frequency: 'DAILY',
        interval: 1,
        daysOfWeek: [],
      });

      expect(() => {
        (rule as any).interval = 2;
      }).toThrow();
    });
  });

  // ==================== equals() 方法测试 ====================
  describe('equals()', () => {
    it('应该认为相同配置的规则相等', () => {
      const rule1 = new RecurrenceRule({
        frequency: 'WEEKLY',
        interval: 1,
        daysOfWeek: [1, 3, 5],
      });

      const rule2 = new RecurrenceRule({
        frequency: 'WEEKLY',
        interval: 1,
        daysOfWeek: [1, 3, 5],
      });

      expect(rule1.equals(rule2)).toBe(true);
      expect(rule2.equals(rule1)).toBe(true);
    });

    it('应该认为不同频率的规则不相等', () => {
      const rule1 = new RecurrenceRule({
        frequency: 'DAILY',
        interval: 1,
        daysOfWeek: [],
      });

      const rule2 = new RecurrenceRule({
        frequency: 'WEEKLY',
        interval: 1,
        daysOfWeek: [],
      });

      expect(rule1.equals(rule2)).toBe(false);
    });

    it('应该认为不同间隔的规则不相等', () => {
      const rule1 = new RecurrenceRule({
        frequency: 'DAILY',
        interval: 1,
        daysOfWeek: [],
      });

      const rule2 = new RecurrenceRule({
        frequency: 'DAILY',
        interval: 2,
        daysOfWeek: [],
      });

      expect(rule1.equals(rule2)).toBe(false);
    });

    it('应该认为不同 daysOfWeek 的规则不相等', () => {
      const rule1 = new RecurrenceRule({
        frequency: 'WEEKLY',
        interval: 1,
        daysOfWeek: [1, 3, 5],
      });

      const rule2 = new RecurrenceRule({
        frequency: 'WEEKLY',
        interval: 1,
        daysOfWeek: [2, 4, 6],
      });

      expect(rule1.equals(rule2)).toBe(false);
    });

    it('应该认为不同 endDate 的规则不相等', () => {
      const futureDate1 = Date.now() + 86400000 * 30;
      const futureDate2 = Date.now() + 86400000 * 60;

      const rule1 = new RecurrenceRule({
        frequency: 'DAILY',
        interval: 1,
        daysOfWeek: [],
        endDate: futureDate1,
      });

      const rule2 = new RecurrenceRule({
        frequency: 'DAILY',
        interval: 1,
        daysOfWeek: [],
        endDate: futureDate2,
      });

      expect(rule1.equals(rule2)).toBe(false);
    });

    it('应该认为不同 occurrences 的规则不相等', () => {
      const rule1 = new RecurrenceRule({
        frequency: 'DAILY',
        interval: 1,
        daysOfWeek: [],
        occurrences: 10,
      });

      const rule2 = new RecurrenceRule({
        frequency: 'DAILY',
        interval: 1,
        daysOfWeek: [],
        occurrences: 20,
      });

      expect(rule1.equals(rule2)).toBe(false);
    });

    it('应该拒绝与非 RecurrenceRule 对象比较', () => {
      const rule = new RecurrenceRule({
        frequency: 'DAILY',
        interval: 1,
        daysOfWeek: [],
      });

      expect(rule.equals({} as any)).toBe(false);
      expect(rule.equals(null as any)).toBe(false);
    });

    it('应该正确比较空数组和非空数组', () => {
      const rule1 = new RecurrenceRule({
        frequency: 'WEEKLY',
        interval: 1,
        daysOfWeek: [],
      });

      const rule2 = new RecurrenceRule({
        frequency: 'WEEKLY',
        interval: 1,
        daysOfWeek: [1],
      });

      expect(rule1.equals(rule2)).toBe(false);
    });
  });

  // ==================== with() 方法测试 ====================
  describe('with()', () => {
    it('应该创建修改后的新实例', () => {
      const original = new RecurrenceRule({
        frequency: 'DAILY',
        interval: 1,
        daysOfWeek: [],
      });

      const modified = original.with({ interval: 2 });

      expect(modified).not.toBe(original); // 不是同一个实例
      expect(modified.interval).toBe(2);
      expect(original.interval).toBe(1); // 原实例未修改
    });

    it('应该支持修改频率', () => {
      const original = new RecurrenceRule({
        frequency: 'DAILY',
        interval: 1,
        daysOfWeek: [],
      });

      const modified = original.with({ frequency: 'WEEKLY' });

      expect(modified.frequency).toBe('WEEKLY');
      expect(original.frequency).toBe('DAILY');
    });

    it('应该支持修改 daysOfWeek', () => {
      const original = new RecurrenceRule({
        frequency: 'WEEKLY',
        interval: 1,
        daysOfWeek: [1, 3, 5],
      });

      const modified = original.with({ daysOfWeek: [2, 4, 6] });

      expect(modified.daysOfWeek).toEqual([2, 4, 6]);
      expect(original.daysOfWeek).toEqual([1, 3, 5]);
    });

    it('应该支持修改 endDate', () => {
      const futureDate = Date.now() + 86400000 * 30;
      const original = new RecurrenceRule({
        frequency: 'DAILY',
        interval: 1,
        daysOfWeek: [],
      });

      const modified = original.with({ endDate: futureDate });

      expect(modified.endDate).toBe(futureDate);
      expect(original.endDate).toBeNull();
    });

    it('应该支持修改 occurrences', () => {
      const original = new RecurrenceRule({
        frequency: 'DAILY',
        interval: 1,
        daysOfWeek: [],
      });

      const modified = original.with({ occurrences: 10 });

      expect(modified.occurrences).toBe(10);
      expect(original.occurrences).toBeNull();
    });

    it('应该支持同时修改多个属性', () => {
      const original = new RecurrenceRule({
        frequency: 'DAILY',
        interval: 1,
        daysOfWeek: [],
      });

      const modified = original.with({
        frequency: 'WEEKLY',
        interval: 2,
        daysOfWeek: [1, 3, 5],
        occurrences: 10,
      });

      expect(modified.frequency).toBe('WEEKLY');
      expect(modified.interval).toBe(2);
      expect(modified.daysOfWeek).toEqual([1, 3, 5]);
      expect(modified.occurrences).toBe(10);
    });

    it('应该保留未修改的属性', () => {
      const futureDate = Date.now() + 86400000 * 30;
      const original = new RecurrenceRule({
        frequency: 'WEEKLY',
        interval: 1,
        daysOfWeek: [1, 3, 5],
        endDate: futureDate,
        occurrences: 10,
      });

      const modified = original.with({ interval: 2 });

      expect(modified.frequency).toBe('WEEKLY');
      expect(modified.interval).toBe(2);
      expect(modified.daysOfWeek).toEqual([1, 3, 5]);
      expect(modified.endDate).toBe(futureDate);
      expect(modified.occurrences).toBe(10);
    });
  });

  // ==================== DTO 转换测试 ====================
  describe('DTO Conversion', () => {
    describe('toServerDTO()', () => {
      it('应该正确转换为 ServerDTO', () => {
        const rule = new RecurrenceRule({
          frequency: 'WEEKLY',
          interval: 2,
          daysOfWeek: [1, 3, 5],
          occurrences: 10,
        });

        const dto = rule.toServerDTO();

        expect(dto.frequency).toBe('WEEKLY');
        expect(dto.interval).toBe(2);
        expect(dto.daysOfWeek).toEqual([1, 3, 5]);
        expect(dto.endDate).toBeNull();
        expect(dto.occurrences).toBe(10);
      });

      it('应该复制 daysOfWeek 数组', () => {
        const rule = new RecurrenceRule({
          frequency: 'WEEKLY',
          interval: 1,
          daysOfWeek: [1, 3, 5],
        });

        const dto = rule.toServerDTO();
        dto.daysOfWeek.push(6);

        // 原规则不应受影响
        expect(rule.daysOfWeek).toEqual([1, 3, 5]);
      });
    });

    describe('toClientDTO()', () => {
      it('应该正确转换为 ClientDTO（每日）', () => {
        const rule = new RecurrenceRule({
          frequency: 'DAILY',
          interval: 1,
          daysOfWeek: [],
        });

        const dto = rule.toClientDTO();

        expect(dto.frequency).toBe('DAILY');
        expect(dto.frequencyText).toBe('每天');
        expect(dto.recurrenceDisplayText).toBe('每天');
        expect(dto.hasEndCondition).toBe(false);
      });

      it('应该正确转换为 ClientDTO（每周）', () => {
        const rule = new RecurrenceRule({
          frequency: 'WEEKLY',
          interval: 1,
          daysOfWeek: [1, 3, 5],
        });

        const dto = rule.toClientDTO();

        expect(dto.frequencyText).toBe('每周');
        expect(dto.dayNames).toEqual(['周一', '周三', '周五']);
        expect(dto.recurrenceDisplayText).toContain('每周');
        expect(dto.recurrenceDisplayText).toContain('周一');
      });

      it('应该正确转换为 ClientDTO（每月）', () => {
        const rule = new RecurrenceRule({
          frequency: 'MONTHLY',
          interval: 1,
          daysOfWeek: [],
        });

        const dto = rule.toClientDTO();

        expect(dto.frequencyText).toBe('每月');
        expect(dto.recurrenceDisplayText).toBe('每月');
      });

      it('应该正确转换为 ClientDTO（每年）', () => {
        const rule = new RecurrenceRule({
          frequency: 'YEARLY',
          interval: 1,
          daysOfWeek: [],
        });

        const dto = rule.toClientDTO();

        expect(dto.frequencyText).toBe('每年');
        expect(dto.recurrenceDisplayText).toBe('每年');
      });

      it('应该正确显示间隔大于1的情况', () => {
        const rule = new RecurrenceRule({
          frequency: 'DAILY',
          interval: 3,
          daysOfWeek: [],
        });

        const dto = rule.toClientDTO();

        expect(dto.recurrenceDisplayText).toBe('每3天');
      });

      it('应该标记有结束条件的规则', () => {
        const futureDate = Date.now() + 86400000 * 30;
        const rule = new RecurrenceRule({
          frequency: 'DAILY',
          interval: 1,
          daysOfWeek: [],
          endDate: futureDate,
        });

        const dto = rule.toClientDTO();

        expect(dto.hasEndCondition).toBe(true);
      });

      it('应该标记有重复次数的规则', () => {
        const rule = new RecurrenceRule({
          frequency: 'DAILY',
          interval: 1,
          daysOfWeek: [],
          occurrences: 10,
        });

        const dto = rule.toClientDTO();

        expect(dto.hasEndCondition).toBe(true);
      });
    });

    describe('toPersistenceDTO()', () => {
      it('应该正确转换为 PersistenceDTO', () => {
        const rule = new RecurrenceRule({
          frequency: 'WEEKLY',
          interval: 2,
          daysOfWeek: [1, 3, 5],
          occurrences: 10,
        });

        const dto = rule.toPersistenceDTO();

        expect(dto.frequency).toBe('WEEKLY');
        expect(dto.interval).toBe(2);
        expect(typeof dto.daysOfWeek).toBe('string');
        expect(JSON.parse(dto.daysOfWeek)).toEqual([1, 3, 5]);
        expect(dto.occurrences).toBe(10);
      });

      it('应该序列化空的 daysOfWeek 数组', () => {
        const rule = new RecurrenceRule({
          frequency: 'DAILY',
          interval: 1,
          daysOfWeek: [],
        });

        const dto = rule.toPersistenceDTO();

        expect(JSON.parse(dto.daysOfWeek)).toEqual([]);
      });
    });
  });

  // ==================== 工厂方法测试 ====================
  describe('Factory Methods', () => {
    describe('fromServerDTO()', () => {
      it('应该从 ServerDTO 正确恢复规则', () => {
        const dto: TaskContracts.RecurrenceRuleServerDTO = {
          frequency: 'WEEKLY',
          interval: 2,
          daysOfWeek: [1, 3, 5],
          endDate: null,
          occurrences: 10,
        };

        const rule = RecurrenceRule.fromServerDTO(dto);

        expect(rule.frequency).toBe('WEEKLY');
        expect(rule.interval).toBe(2);
        expect(rule.daysOfWeek).toEqual([1, 3, 5]);
        expect(rule.endDate).toBeNull();
        expect(rule.occurrences).toBe(10);
      });

      it('应该处理包含 endDate 的 DTO', () => {
        const futureDate = Date.now() + 86400000 * 30;
        const dto: TaskContracts.RecurrenceRuleServerDTO = {
          frequency: 'DAILY',
          interval: 1,
          daysOfWeek: [],
          endDate: futureDate,
          occurrences: null,
        };

        const rule = RecurrenceRule.fromServerDTO(dto);

        expect(rule.endDate).toBe(futureDate);
      });
    });

    describe('fromPersistenceDTO()', () => {
      it('应该从 PersistenceDTO 正确恢复规则', () => {
        const dto: TaskContracts.RecurrenceRulePersistenceDTO = {
          frequency: 'WEEKLY',
          interval: 2,
          daysOfWeek: JSON.stringify([1, 3, 5]),
          endDate: null,
          occurrences: 10,
        };

        const rule = RecurrenceRule.fromPersistenceDTO(dto);

        expect(rule.frequency).toBe('WEEKLY');
        expect(rule.interval).toBe(2);
        expect(rule.daysOfWeek).toEqual([1, 3, 5]);
        expect(rule.occurrences).toBe(10);
      });

      it('应该处理空的 daysOfWeek 数组', () => {
        const dto: TaskContracts.RecurrenceRulePersistenceDTO = {
          frequency: 'DAILY',
          interval: 1,
          daysOfWeek: JSON.stringify([]),
          endDate: null,
          occurrences: null,
        };

        const rule = RecurrenceRule.fromPersistenceDTO(dto);

        expect(rule.daysOfWeek).toEqual([]);
      });
    });
  });

  // ==================== 往返转换测试 ====================
  describe('Round-trip Conversion', () => {
    it('应该正确处理 ServerDTO 往返转换', () => {
      const original = new RecurrenceRule({
        frequency: 'WEEKLY',
        interval: 2,
        daysOfWeek: [1, 3, 5],
        occurrences: 10,
      });

      const dto = original.toServerDTO();
      const restored = RecurrenceRule.fromServerDTO(dto);

      expect(restored.equals(original)).toBe(true);
    });

    it('应该正确处理 PersistenceDTO 往返转换', () => {
      const futureDate = Date.now() + 86400000 * 30;
      const original = new RecurrenceRule({
        frequency: 'MONTHLY',
        interval: 1,
        daysOfWeek: [],
        endDate: futureDate,
      });

      const dto = original.toPersistenceDTO();
      const restored = RecurrenceRule.fromPersistenceDTO(dto);

      expect(restored.equals(original)).toBe(true);
    });
  });

  // ==================== 边界条件测试 ====================
  describe('Edge Cases', () => {
    it('应该处理所有星期的选择', () => {
      const allDays: TaskContracts.DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];
      const rule = new RecurrenceRule({
        frequency: 'WEEKLY',
        interval: 1,
        daysOfWeek: allDays,
      });

      expect(rule.daysOfWeek.length).toBe(7);
      const dto = rule.toClientDTO();
      expect(dto.dayNames.length).toBe(7);
    });

    it('应该处理大间隔值', () => {
      const rule = new RecurrenceRule({
        frequency: 'DAILY',
        interval: 365,
        daysOfWeek: [],
      });

      expect(rule.interval).toBe(365);
      const dto = rule.toClientDTO();
      expect(dto.recurrenceDisplayText).toBe('每365天');
    });

    it('应该处理大重复次数', () => {
      const rule = new RecurrenceRule({
        frequency: 'DAILY',
        interval: 1,
        daysOfWeek: [],
        occurrences: 1000,
      });

      expect(rule.occurrences).toBe(1000);
    });

    it('应该处理同时设置 endDate 和 occurrences', () => {
      const futureDate = Date.now() + 86400000 * 30;
      const rule = new RecurrenceRule({
        frequency: 'DAILY',
        interval: 1,
        daysOfWeek: [],
        endDate: futureDate,
        occurrences: 10,
      });

      expect(rule.endDate).toBe(futureDate);
      expect(rule.occurrences).toBe(10);
      const dto = rule.toClientDTO();
      expect(dto.hasEndCondition).toBe(true);
    });

    it('应该正确处理不同频率的中文显示', () => {
      const frequencies: TaskContracts.RecurrenceFrequency[] = [
        'DAILY',
        'WEEKLY',
        'MONTHLY',
        'YEARLY',
      ];
      const expectedTexts = ['每天', '每周', '每月', '每年'];

      frequencies.forEach((freq, index) => {
        const rule = new RecurrenceRule({
          frequency: freq,
          interval: 1,
          daysOfWeek: [],
        });

        const dto = rule.toClientDTO();
        expect(dto.frequencyText).toBe(expectedTexts[index]);
      });
    });

    it('应该正确处理所有星期的中文名称', () => {
      const allDays: TaskContracts.DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];
      const expectedNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

      const rule = new RecurrenceRule({
        frequency: 'WEEKLY',
        interval: 1,
        daysOfWeek: allDays,
      });

      const dto = rule.toClientDTO();
      expect(dto.dayNames).toEqual(expectedNames);
    });
  });
});
