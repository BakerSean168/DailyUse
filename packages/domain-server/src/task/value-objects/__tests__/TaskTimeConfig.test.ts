/**
 * TaskTimeConfig 值对象单元测试
 *
 * 测试覆盖：
 * - 构造函数和工厂方法
 * - 不可变性
 * - 值相等性 (equals)
 * - with() 方法
 * - DTO 转换 (toServerDTO, toClientDTO, toPersistenceDTO)
 * - 三种时间类型 (ALL_DAY, TIME_POINT, TIME_RANGE)
 * - 边界条件和错误处理
 *
 * 目标覆盖率: 90%+
 */

import { describe, it, expect } from 'vitest';
import { TaskTimeConfig } from '../TaskTimeConfig';
import type { TaskTimeConfigPersistenceDTO, TaskTimeConfigServerDTO } from '@dailyuse/contracts/task';
import { TimeType } from '@dailyuse/contracts/task';

describe('TaskTimeConfig Value Object', () => {
  // ==================== 测试数据 ====================
  const mockStartDate = Date.now();
  const mockEndDate = mockStartDate + 86400000; // 1天后
  const mockTimePoint = mockStartDate + 3600000; // 1小时后
  const mockTimeRange = {
    start: mockStartDate,
    end: mockStartDate + 3600000,
  };

  // ==================== 构造函数测试 ====================
  describe('Constructor', () => {
    it('应该创建全天时间配置 (ALL_DAY)', () => {
      const config = new TaskTimeConfig({
        timeType: 'ALL_DAY',
        startDate: mockStartDate,
        endDate: mockEndDate,
      });

      expect(config.timeType).toBe('ALL_DAY');
      expect(config.startDate).toBe(mockStartDate);
      expect(config.endDate).toBe(mockEndDate);
      expect(config.timePoint).toBeNull();
      expect(config.timeRange).toBeNull();
    });

    it('应该创建时间点配置 (TIME_POINT)', () => {
      const config = new TaskTimeConfig({
        timeType: 'TIME_POINT',
        timePoint: mockTimePoint,
      });

      expect(config.timeType).toBe('TIME_POINT');
      expect(config.timePoint).toBe(mockTimePoint);
      expect(config.startDate).toBeNull();
      expect(config.endDate).toBeNull();
      expect(config.timeRange).toBeNull();
    });

    it('应该创建时间段配置 (TIME_RANGE)', () => {
      const config = new TaskTimeConfig({
        timeType: 'TIME_RANGE',
        timeRange: mockTimeRange,
      });

      expect(config.timeType).toBe('TIME_RANGE');
      expect(config.timeRange).toEqual(mockTimeRange);
      expect(config.startDate).toBeNull();
      expect(config.endDate).toBeNull();
      expect(config.timePoint).toBeNull();
    });

    it('应该支持同时设置 startDate 和 endDate', () => {
      const config = new TaskTimeConfig({
        timeType: 'ALL_DAY',
        startDate: mockStartDate,
        endDate: mockEndDate,
      });

      expect(config.startDate).toBe(mockStartDate);
      expect(config.endDate).toBe(mockEndDate);
    });

    it('应该处理 null 值', () => {
      const config = new TaskTimeConfig({
        timeType: 'ALL_DAY',
        startDate: null,
        endDate: null,
        timePoint: null,
        timeRange: null,
      });

      expect(config.startDate).toBeNull();
      expect(config.endDate).toBeNull();
      expect(config.timePoint).toBeNull();
      expect(config.timeRange).toBeNull();
    });

    it('应该复制 timeRange 对象（防止外部修改）', () => {
      const originalRange = { start: mockStartDate, end: mockEndDate };
      const config = new TaskTimeConfig({
        timeType: 'TIME_RANGE',
        timeRange: originalRange,
      });

      // 修改原对象不应影响配置
      originalRange.start = 0;

      expect(config.timeRange?.start).toBe(mockStartDate);
    });

    it('应该处理未定义的可选参数', () => {
      const config = new TaskTimeConfig({
        timeType: 'ALL_DAY',
      });

      expect(config.startDate).toBeNull();
      expect(config.endDate).toBeNull();
      expect(config.timePoint).toBeNull();
      expect(config.timeRange).toBeNull();
    });
  });

  // ==================== 不可变性测试 ====================
  describe('Immutability', () => {
    it('应该是不可变的（冻结对象）', () => {
      const config = new TaskTimeConfig({
        timeType: 'ALL_DAY',
        startDate: mockStartDate,
      });

      expect(Object.isFrozen(config)).toBe(true);
    });

    it('timeRange 对象应该是不可变的', () => {
      const config = new TaskTimeConfig({
        timeType: 'TIME_RANGE',
        timeRange: mockTimeRange,
      });

      expect(Object.isFrozen(config.timeRange)).toBe(true);

      // 尝试修改应该失败
      expect(() => {
        (config.timeRange as any).start = 0;
      }).toThrow();
    });

    it('不应该允许修改属性', () => {
      const config = new TaskTimeConfig({
        timeType: 'ALL_DAY',
        startDate: mockStartDate,
      });

      expect(() => {
        (config as any).startDate = 0;
      }).toThrow();
    });
  });

  // ==================== equals() 方法测试 ====================
  describe('equals()', () => {
    it('应该认为相同配置相等', () => {
      const config1 = new TaskTimeConfig({
        timeType: 'ALL_DAY',
        startDate: mockStartDate,
        endDate: mockEndDate,
      });

      const config2 = new TaskTimeConfig({
        timeType: 'ALL_DAY',
        startDate: mockStartDate,
        endDate: mockEndDate,
      });

      expect(config1.equals(config2)).toBe(true);
      expect(config2.equals(config1)).toBe(true);
    });

    it('应该认为不同 timeType 的配置不相等', () => {
      const config1 = new TaskTimeConfig({
        timeType: 'ALL_DAY',
      });

      const config2 = new TaskTimeConfig({
        timeType: 'TIME_POINT',
      });

      expect(config1.equals(config2)).toBe(false);
    });

    it('应该认为不同 startDate 的配置不相等', () => {
      const config1 = new TaskTimeConfig({
        timeType: 'ALL_DAY',
        startDate: mockStartDate,
      });

      const config2 = new TaskTimeConfig({
        timeType: 'ALL_DAY',
        startDate: mockStartDate + 1,
      });

      expect(config1.equals(config2)).toBe(false);
    });

    it('应该认为不同 timePoint 的配置不相等', () => {
      const config1 = new TaskTimeConfig({
        timeType: 'TIME_POINT',
        timePoint: mockTimePoint,
      });

      const config2 = new TaskTimeConfig({
        timeType: 'TIME_POINT',
        timePoint: mockTimePoint + 1,
      });

      expect(config1.equals(config2)).toBe(false);
    });

    it('应该认为不同 timeRange 的配置不相等', () => {
      const config1 = new TaskTimeConfig({
        timeType: 'TIME_RANGE',
        timeRange: { start: 100, end: 200 },
      });

      const config2 = new TaskTimeConfig({
        timeType: 'TIME_RANGE',
        timeRange: { start: 100, end: 300 },
      });

      expect(config1.equals(config2)).toBe(false);
    });

    it('应该正确处理 null timeRange 比较', () => {
      const config1 = new TaskTimeConfig({
        timeType: 'ALL_DAY',
        timeRange: null,
      });

      const config2 = new TaskTimeConfig({
        timeType: 'ALL_DAY',
        timeRange: null,
      });

      expect(config1.equals(config2)).toBe(true);
    });

    it('应该认为一个 null 一个非 null 的 timeRange 不相等', () => {
      const config1 = new TaskTimeConfig({
        timeType: 'TIME_RANGE',
        timeRange: null,
      });

      const config2 = new TaskTimeConfig({
        timeType: 'TIME_RANGE',
        timeRange: mockTimeRange,
      });

      expect(config1.equals(config2)).toBe(false);
    });

    it('应该拒绝与非 TaskTimeConfig 对象比较', () => {
      const config = new TaskTimeConfig({
        timeType: 'ALL_DAY',
      });

      expect(config.equals({} as any)).toBe(false);
      expect(config.equals(null as any)).toBe(false);
    });
  });

  // ==================== with() 方法测试 ====================
  describe('with()', () => {
    it('应该创建修改后的新实例', () => {
      const original = new TaskTimeConfig({
        timeType: 'ALL_DAY',
        startDate: mockStartDate,
      });

      const modified = original.with({ endDate: mockEndDate });

      expect(modified).not.toBe(original); // 不是同一个实例
      expect(modified.endDate).toBe(mockEndDate);
      expect(original.endDate).toBeNull(); // 原实例未修改
    });

    it('应该支持修改 timeType', () => {
      const original = new TaskTimeConfig({
        timeType: 'ALL_DAY',
      });

      const modified = original.with({ timeType: 'TIME_POINT' });

      expect(modified.timeType).toBe('TIME_POINT');
      expect(original.timeType).toBe('ALL_DAY');
    });

    it('应该支持修改 startDate', () => {
      const original = new TaskTimeConfig({
        timeType: 'ALL_DAY',
        startDate: mockStartDate,
      });

      const newDate = mockStartDate + 86400000;
      const modified = original.with({ startDate: newDate });

      expect(modified.startDate).toBe(newDate);
      expect(original.startDate).toBe(mockStartDate);
    });

    it('应该支持修改 timePoint', () => {
      const original = new TaskTimeConfig({
        timeType: 'TIME_POINT',
        timePoint: mockTimePoint,
      });

      const newPoint = mockTimePoint + 3600000;
      const modified = original.with({ timePoint: newPoint });

      expect(modified.timePoint).toBe(newPoint);
      expect(original.timePoint).toBe(mockTimePoint);
    });

    it('应该支持修改 timeRange', () => {
      const original = new TaskTimeConfig({
        timeType: 'TIME_RANGE',
        timeRange: mockTimeRange,
      });

      const newRange = { start: 0, end: 100 };
      const modified = original.with({ timeRange: newRange });

      expect(modified.timeRange).toEqual(newRange);
      expect(original.timeRange).toEqual(mockTimeRange);
    });

    it('应该支持同时修改多个属性', () => {
      const original = new TaskTimeConfig({
        timeType: 'ALL_DAY',
      });

      const modified = original.with({
        timeType: 'TIME_POINT',
        timePoint: mockTimePoint,
        startDate: mockStartDate,
      });

      expect(modified.timeType).toBe('TIME_POINT');
      expect(modified.timePoint).toBe(mockTimePoint);
      expect(modified.startDate).toBe(mockStartDate);
    });

    it('应该保留未修改的属性', () => {
      const original = new TaskTimeConfig({
        timeType: 'ALL_DAY',
        startDate: mockStartDate,
        endDate: mockEndDate,
      });

      const modified = original.with({ timeType: 'TIME_POINT' });

      expect(modified.timeType).toBe('TIME_POINT');
      expect(modified.startDate).toBe(mockStartDate);
      expect(modified.endDate).toBe(mockEndDate);
    });
  });

  // ==================== DTO 转换测试 ====================
  describe('DTO Conversion', () => {
    describe('toServerDTO()', () => {
      it('应该正确转换 ALL_DAY 配置', () => {
        const config = new TaskTimeConfig({
          timeType: 'ALL_DAY',
          startDate: mockStartDate,
          endDate: mockEndDate,
        });

        const dto = config.toServerDTO();

        expect(dto.timeType).toBe('ALL_DAY');
        expect(dto.startDate).toBe(mockStartDate);
        expect(dto.endDate).toBe(mockEndDate);
        expect(dto.timePoint).toBeNull();
        expect(dto.timeRange).toBeNull();
      });

      it('应该正确转换 TIME_POINT 配置', () => {
        const config = new TaskTimeConfig({
          timeType: 'TIME_POINT',
          timePoint: mockTimePoint,
        });

        const dto = config.toServerDTO();

        expect(dto.timeType).toBe('TIME_POINT');
        expect(dto.timePoint).toBe(mockTimePoint);
      });

      it('应该正确转换 TIME_RANGE 配置', () => {
        const config = new TaskTimeConfig({
          timeType: 'TIME_RANGE',
          timeRange: mockTimeRange,
        });

        const dto = config.toServerDTO();

        expect(dto.timeType).toBe('TIME_RANGE');
        expect(dto.timeRange).toEqual(mockTimeRange);
      });

      it('应该复制 timeRange 对象', () => {
        const config = new TaskTimeConfig({
          timeType: 'TIME_RANGE',
          timeRange: mockTimeRange,
        });

        const dto = config.toServerDTO();
        dto.timeRange!.start = 0;

        // 原配置不应受影响
        expect(config.timeRange?.start).toBe(mockStartDate);
      });
    });

    describe('toClientDTO()', () => {
      it('应该正确转换 ALL_DAY 配置为 ClientDTO', () => {
        const config = new TaskTimeConfig({
          timeType: 'ALL_DAY',
          startDate: mockStartDate,
          endDate: mockEndDate,
        });

        const dto = config.toClientDTO();

        expect(dto.timeType).toBe('ALL_DAY');
        expect(dto.timeTypeText).toBe('全天');
        expect(dto.displayText).toBe('全天');
        expect(dto.hasDateRange).toBe(true);
        expect(dto.formattedStartDate).toBeDefined();
        expect(dto.formattedEndDate).toBeDefined();
      });

      it('应该正确转换 TIME_POINT 配置为 ClientDTO', () => {
        const config = new TaskTimeConfig({
          timeType: 'TIME_POINT',
          timePoint: mockTimePoint,
        });

        const dto = config.toClientDTO();

        expect(dto.timeType).toBe('TIME_POINT');
        expect(dto.timeTypeText).toBe('时间点');
        expect(dto.displayText).toBeDefined();
        expect(dto.displayText.length).toBeGreaterThan(0);
        expect(dto.formattedTimePoint).toBeDefined();
      });

      it('应该正确转换 TIME_RANGE 配置为 ClientDTO', () => {
        const config = new TaskTimeConfig({
          timeType: 'TIME_RANGE',
          timeRange: mockTimeRange,
        });

        const dto = config.toClientDTO();

        expect(dto.timeType).toBe('TIME_RANGE');
        expect(dto.timeTypeText).toBe('时间段');
        expect(dto.displayText).toContain('-');
        expect(dto.formattedTimeRange).toContain('-');
      });

      it('应该标记有日期范围的配置', () => {
        const config = new TaskTimeConfig({
          timeType: 'ALL_DAY',
          startDate: mockStartDate,
          endDate: mockEndDate,
        });

        const dto = config.toClientDTO();

        expect(dto.hasDateRange).toBe(true);
      });

      it('应该标记没有日期范围的配置', () => {
        const config = new TaskTimeConfig({
          timeType: 'TIME_POINT',
          timePoint: mockTimePoint,
        });

        const dto = config.toClientDTO();

        expect(dto.hasDateRange).toBe(false);
      });

      it('应该处理 null startDate', () => {
        const config = new TaskTimeConfig({
          timeType: 'ALL_DAY',
          startDate: null,
          endDate: mockEndDate,
        });

        const dto = config.toClientDTO();

        expect(dto.hasDateRange).toBe(false);
        expect(dto.formattedStartDate).toBe('');
      });

      it('应该处理 null endDate', () => {
        const config = new TaskTimeConfig({
          timeType: 'ALL_DAY',
          startDate: mockStartDate,
          endDate: null,
        });

        const dto = config.toClientDTO();

        expect(dto.hasDateRange).toBe(false);
        expect(dto.formattedEndDate).toBe('');
      });

      it('应该处理 null timePoint', () => {
        const config = new TaskTimeConfig({
          timeType: 'TIME_POINT',
          timePoint: null,
        });

        const dto = config.toClientDTO();

        expect(dto.formattedTimePoint).toBe('');
      });

      it('应该处理 null timeRange', () => {
        const config = new TaskTimeConfig({
          timeType: 'TIME_RANGE',
          timeRange: null,
        });

        const dto = config.toClientDTO();

        expect(dto.formattedTimeRange).toBe('');
      });
    });

    describe('toPersistenceDTO()', () => {
      it('应该正确转换 ALL_DAY 配置', () => {
        const config = new TaskTimeConfig({
          timeType: 'ALL_DAY',
          startDate: mockStartDate,
          endDate: mockEndDate,
        });

        const dto = config.toPersistenceDTO();

        expect(dto.timeType).toBe('ALL_DAY');
        expect(dto.startDate).toBe(mockStartDate);
        expect(dto.endDate).toBe(mockEndDate);
        expect(dto.timePoint).toBeNull();
        expect(dto.timeRange).toBeNull();
      });

      it('应该序列化 timeRange 为 JSON 字符串', () => {
        const config = new TaskTimeConfig({
          timeType: 'TIME_RANGE',
          timeRange: mockTimeRange,
        });

        const dto = config.toPersistenceDTO();

        expect(typeof dto.timeRange).toBe('string');
        expect(JSON.parse(dto.timeRange as string)).toEqual(mockTimeRange);
      });

      it('应该处理 null timeRange', () => {
        const config = new TaskTimeConfig({
          timeType: 'ALL_DAY',
          timeRange: null,
        });

        const dto = config.toPersistenceDTO();

        expect(dto.timeRange).toBeNull();
      });
    });
  });

  // ==================== 工厂方法测试 ====================
  describe('Factory Methods', () => {
    describe('fromServerDTO()', () => {
      it('应该从 ALL_DAY ServerDTO 正确恢复配置', () => {
        const dto: TaskTimeConfigServerDTO = {
          timeType: 'ALL_DAY',
          startDate: mockStartDate,
          endDate: mockEndDate,
          timePoint: null,
          timeRange: null,
        };

        const config = TaskTimeConfig.fromServerDTO(dto);

        expect(config.timeType).toBe('ALL_DAY');
        expect(config.startDate).toBe(mockStartDate);
        expect(config.endDate).toBe(mockEndDate);
      });

      it('应该从 TIME_POINT ServerDTO 正确恢复配置', () => {
        const dto: TaskTimeConfigServerDTO = {
          timeType: 'TIME_POINT',
          startDate: null,
          endDate: null,
          timePoint: mockTimePoint,
          timeRange: null,
        };

        const config = TaskTimeConfig.fromServerDTO(dto);

        expect(config.timeType).toBe('TIME_POINT');
        expect(config.timePoint).toBe(mockTimePoint);
      });

      it('应该从 TIME_RANGE ServerDTO 正确恢复配置', () => {
        const dto: TaskTimeConfigServerDTO = {
          timeType: 'TIME_RANGE',
          startDate: null,
          endDate: null,
          timePoint: null,
          timeRange: mockTimeRange,
        };

        const config = TaskTimeConfig.fromServerDTO(dto);

        expect(config.timeType).toBe('TIME_RANGE');
        expect(config.timeRange).toEqual(mockTimeRange);
      });
    });

    describe('fromPersistenceDTO()', () => {
      it('应该从 ALL_DAY PersistenceDTO 正确恢复配置', () => {
        const dto: TaskTimeConfigPersistenceDTO = {
          timeType: 'ALL_DAY',
          startDate: mockStartDate,
          endDate: mockEndDate,
          timePoint: null,
          timeRange: null,
        };

        const config = TaskTimeConfig.fromPersistenceDTO(dto);

        expect(config.timeType).toBe('ALL_DAY');
        expect(config.startDate).toBe(mockStartDate);
        expect(config.endDate).toBe(mockEndDate);
      });

      it('应该从 TIME_RANGE PersistenceDTO 正确恢复配置', () => {
        const dto: TaskTimeConfigPersistenceDTO = {
          timeType: 'TIME_RANGE',
          startDate: null,
          endDate: null,
          timePoint: null,
          timeRange: JSON.stringify(mockTimeRange),
        };

        const config = TaskTimeConfig.fromPersistenceDTO(dto);

        expect(config.timeType).toBe('TIME_RANGE');
        expect(config.timeRange).toEqual(mockTimeRange);
      });

      it('应该处理 null timeRange', () => {
        const dto: TaskTimeConfigPersistenceDTO = {
          timeType: 'ALL_DAY',
          startDate: mockStartDate,
          endDate: null,
          timePoint: null,
          timeRange: null,
        };

        const config = TaskTimeConfig.fromPersistenceDTO(dto);

        expect(config.timeRange).toBeNull();
      });
    });
  });

  // ==================== 往返转换测试 ====================
  describe('Round-trip Conversion', () => {
    it('应该正确处理 ALL_DAY ServerDTO 往返转换', () => {
      const original = new TaskTimeConfig({
        timeType: 'ALL_DAY',
        startDate: mockStartDate,
        endDate: mockEndDate,
      });

      const dto = original.toServerDTO();
      const restored = TaskTimeConfig.fromServerDTO(dto);

      expect(restored.equals(original)).toBe(true);
    });

    it('应该正确处理 TIME_POINT ServerDTO 往返转换', () => {
      const original = new TaskTimeConfig({
        timeType: 'TIME_POINT',
        timePoint: mockTimePoint,
      });

      const dto = original.toServerDTO();
      const restored = TaskTimeConfig.fromServerDTO(dto);

      expect(restored.equals(original)).toBe(true);
    });

    it('应该正确处理 TIME_RANGE ServerDTO 往返转换', () => {
      const original = new TaskTimeConfig({
        timeType: 'TIME_RANGE',
        timeRange: mockTimeRange,
      });

      const dto = original.toServerDTO();
      const restored = TaskTimeConfig.fromServerDTO(dto);

      expect(restored.equals(original)).toBe(true);
    });

    it('应该正确处理 PersistenceDTO 往返转换', () => {
      const original = new TaskTimeConfig({
        timeType: 'TIME_RANGE',
        timeRange: mockTimeRange,
      });

      const dto = original.toPersistenceDTO();
      const restored = TaskTimeConfig.fromPersistenceDTO(dto);

      expect(restored.equals(original)).toBe(true);
    });
  });

  // ==================== 边界条件测试 ====================
  describe('Edge Cases', () => {
    it('应该处理所有字段为 null 的配置', () => {
      const config = new TaskTimeConfig({
        timeType: 'ALL_DAY',
        startDate: null,
        endDate: null,
        timePoint: null,
        timeRange: null,
      });

      expect(config.startDate).toBeNull();
      expect(config.endDate).toBeNull();
      expect(config.timePoint).toBeNull();
      expect(config.timeRange).toBeNull();
    });

    it('应该处理极小的时间范围', () => {
      const tinyRange = {
        start: mockStartDate,
        end: mockStartDate + 1, // 1ms
      };

      const config = new TaskTimeConfig({
        timeType: 'TIME_RANGE',
        timeRange: tinyRange,
      });

      expect(config.timeRange).toEqual(tinyRange);
    });

    it('应该处理极大的时间戳', () => {
      const farFuture = Date.now() + 365 * 24 * 3600 * 1000 * 100; // 100年后

      const config = new TaskTimeConfig({
        timeType: 'TIME_POINT',
        timePoint: farFuture,
      });

      expect(config.timePoint).toBe(farFuture);
    });

    it('应该正确处理三种时间类型的中文文本', () => {
      const types: TimeType[] = ['ALL_DAY', 'TIME_POINT', 'TIME_RANGE'];
      const expectedTexts = ['全天', '时间点', '时间段'];

      types.forEach((type, index) => {
        const config = new TaskTimeConfig({ timeType: type });
        const dto = config.toClientDTO();
        expect(dto.timeTypeText).toBe(expectedTexts[index]);
      });
    });

    it('应该处理 startDate 大于 endDate 的情况（不验证逻辑）', () => {
      const config = new TaskTimeConfig({
        timeType: 'ALL_DAY',
        startDate: mockEndDate,
        endDate: mockStartDate, // 反过来
      });

      // 不应该抛出错误，仅存储数据
      expect(config.startDate).toBe(mockEndDate);
      expect(config.endDate).toBe(mockStartDate);
    });

    it('应该处理 timeRange start 大于 end 的情况', () => {
      const invalidRange = {
        start: mockEndDate,
        end: mockStartDate,
      };

      const config = new TaskTimeConfig({
        timeType: 'TIME_RANGE',
        timeRange: invalidRange,
      });

      expect(config.timeRange).toEqual(invalidRange);
    });
  });
});
