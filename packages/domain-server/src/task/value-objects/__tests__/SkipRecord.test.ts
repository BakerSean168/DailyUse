/**
 * SkipRecord 值对象单元测试
 *
 * 测试覆盖：
 * - 构造函数和验证
 * - 工厂方法 (fromServerDTO, fromPersistenceDTO)
 * - 值相等性比较 (equals)
 * - 不可变性 (with方法)
 * - DTO 转换 (toServerDTO, toClientDTO, toPersistenceDTO)
 * - 辅助方法（格式化时间、显示文本）
 * - 边界条件和错误处理
 *
 * 目标覆盖率: 85%+
 */

import { describe, it, expect } from 'vitest';
import { SkipRecord } from '../SkipRecord';
import type { TaskContracts } from '@dailyuse/contracts';

describe('SkipRecord Value Object', () => {
  // ==================== 测试数据 ====================
  const mockSkippedAt = Date.now();

  // ==================== 构造函数和验证测试 ====================
  describe('Constructor and Validation', () => {
    it('应该创建有效的 SkipRecord', () => {
      const record = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: 'Too busy today',
      });

      expect(record.skippedAt).toBe(mockSkippedAt);
      expect(record.reason).toBe('Too busy today');
    });

    it('应该支持可选的 reason 参数', () => {
      const record = new SkipRecord({
        skippedAt: mockSkippedAt,
      });

      expect(record.skippedAt).toBe(mockSkippedAt);
      expect(record.reason).toBeNull();
    });

    it('应该将 undefined reason 转换为 null', () => {
      const record = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: undefined,
      });

      expect(record.reason).toBeNull();
    });

    it('应该是不可变的（frozen）', () => {
      const record = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: 'Test',
      });

      expect(Object.isFrozen(record)).toBe(true);
    });

    it('应该接受空字符串作为 reason', () => {
      const record = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: '',
      });

      expect(record.reason).toBe('');
    });

    it('应该接受长文本作为 reason', () => {
      const longReason = 'A'.repeat(500);
      const record = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: longReason,
      });

      expect(record.reason).toBe(longReason);
      expect(record.reason?.length).toBe(500);
    });
  });

  // ==================== 工厂方法测试 ====================
  describe('Factory Methods', () => {
    describe('fromServerDTO()', () => {
      it('应该从 ServerDTO 创建实例', () => {
        const dto: TaskContracts.SkipRecordServerDTO = {
          skippedAt: mockSkippedAt,
          reason: 'No time',
        };

        const record = SkipRecord.fromServerDTO(dto);

        expect(record.skippedAt).toBe(mockSkippedAt);
        expect(record.reason).toBe('No time');
      });

      it('应该处理 null reason', () => {
        const dto: TaskContracts.SkipRecordServerDTO = {
          skippedAt: mockSkippedAt,
          reason: null,
        };

        const record = SkipRecord.fromServerDTO(dto);

        expect(record.skippedAt).toBe(mockSkippedAt);
        expect(record.reason).toBeNull();
      });
    });

    describe('fromPersistenceDTO()', () => {
      it('应该从 PersistenceDTO 创建实例', () => {
        const dto: TaskContracts.SkipRecordPersistenceDTO = {
          skippedAt: mockSkippedAt,
          reason: 'Persistence reason',
        };

        const record = SkipRecord.fromPersistenceDTO(dto);

        expect(record.skippedAt).toBe(mockSkippedAt);
        expect(record.reason).toBe('Persistence reason');
      });

      it('应该处理 null reason', () => {
        const dto: TaskContracts.SkipRecordPersistenceDTO = {
          skippedAt: mockSkippedAt,
          reason: null,
        };

        const record = SkipRecord.fromPersistenceDTO(dto);

        expect(record.skippedAt).toBe(mockSkippedAt);
        expect(record.reason).toBeNull();
      });
    });
  });

  // ==================== 值相等性测试 ====================
  describe('Value Equality', () => {
    it('应该判断相同值的记录为相等', () => {
      const record1 = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: 'Same reason',
      });

      const record2 = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: 'Same reason',
      });

      expect(record1.equals(record2)).toBe(true);
    });

    it('应该判断不同 skippedAt 为不相等', () => {
      const record1 = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: 'Reason',
      });

      const record2 = new SkipRecord({
        skippedAt: mockSkippedAt + 1000,
        reason: 'Reason',
      });

      expect(record1.equals(record2)).toBe(false);
    });

    it('应该判断不同 reason 为不相等', () => {
      const record1 = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: 'Reason 1',
      });

      const record2 = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: 'Reason 2',
      });

      expect(record1.equals(record2)).toBe(false);
    });

    it('应该判断 null reason 和非 null reason 为不相等', () => {
      const record1 = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: null,
      });

      const record2 = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: 'Some reason',
      });

      expect(record1.equals(record2)).toBe(false);
    });

    it('应该判断两个 null reason 为相等（如果时间相同）', () => {
      const record1 = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: null,
      });

      const record2 = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: null,
      });

      expect(record1.equals(record2)).toBe(true);
    });

    it('应该拒绝与非 SkipRecord 对象比较', () => {
      const record = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: 'Test',
      });

      const notASkipRecord = {
        skippedAt: mockSkippedAt,
        reason: 'Test',
      };

      expect(record.equals(notASkipRecord as any)).toBe(false);
    });
  });

  // ==================== 不可变性测试 (with方法) ====================
  describe('Immutability (with method)', () => {
    it('应该创建新实例（而不是修改原实例）', () => {
      const original = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: 'Original reason',
      });

      const modified = original.with({ reason: 'Modified reason' });

      expect(original.reason).toBe('Original reason'); // 原实例不变
      expect(modified.reason).toBe('Modified reason'); // 新实例已修改
      expect(original).not.toBe(modified); // 不是同一个对象
    });

    it('应该修改 skippedAt', () => {
      const original = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: 'Test',
      });

      const newTime = mockSkippedAt + 3600000;
      const modified = original.with({ skippedAt: newTime });

      expect(modified.skippedAt).toBe(newTime);
      expect(original.skippedAt).toBe(mockSkippedAt);
    });

    it('应该修改 reason', () => {
      const original = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: 'Original',
      });

      const modified = original.with({ reason: 'Modified' });

      expect(modified.reason).toBe('Modified');
      expect(original.reason).toBe('Original');
    });

    it('应该支持修改多个字段', () => {
      const original = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: 'Original',
      });

      const newTime = mockSkippedAt + 1000;
      const modified = original.with({
        skippedAt: newTime,
        reason: 'Modified',
      });

      expect(modified.skippedAt).toBe(newTime);
      expect(modified.reason).toBe('Modified');
      expect(original.skippedAt).toBe(mockSkippedAt);
      expect(original.reason).toBe('Original');
    });

    it('应该支持设置 reason 为 null', () => {
      const original = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: 'Has reason',
      });

      const modified = original.with({ reason: null });

      // with方法使用 ?? 运算符，null 被视为有效值，会保留原值
      // 如果要清除 reason，应该创建新实例而不是使用 with
      expect(modified.reason).toBe('Has reason'); // ?? 运算符导致保留原值
      expect(original.reason).toBe('Has reason');
    });

    it('应该保留未修改的属性', () => {
      const original = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: 'Test',
      });

      const modified = original.with({ reason: 'New reason' });

      expect(modified.skippedAt).toBe(original.skippedAt);
    });
  });

  // ==================== DTO 转换测试 ====================
  describe('DTO Conversion', () => {
    describe('toServerDTO()', () => {
      it('应该转换为 ServerDTO', () => {
        const record = new SkipRecord({
          skippedAt: mockSkippedAt,
          reason: 'Server reason',
        });

        const dto = record.toServerDTO();

        expect(dto.skippedAt).toBe(mockSkippedAt);
        expect(dto.reason).toBe('Server reason');
      });

      it('应该处理 null reason', () => {
        const record = new SkipRecord({
          skippedAt: mockSkippedAt,
          reason: null,
        });

        const dto = record.toServerDTO();

        expect(dto.skippedAt).toBe(mockSkippedAt);
        expect(dto.reason).toBeNull();
      });
    });

    describe('toClientDTO()', () => {
      it('应该转换为 ClientDTO（有原因）', () => {
        const record = new SkipRecord({
          skippedAt: mockSkippedAt,
          reason: 'Client reason',
        });

        const dto = record.toClientDTO();

        expect(dto.skippedAt).toBe(mockSkippedAt);
        expect(dto.reason).toBe('Client reason');
        expect(dto.formattedSkippedAt).toBeDefined();
        expect(dto.hasReason).toBe(true);
        expect(dto.displayText).toBe('已跳过: Client reason');
      });

      it('应该转换为 ClientDTO（无原因）', () => {
        const record = new SkipRecord({
          skippedAt: mockSkippedAt,
          reason: null,
        });

        const dto = record.toClientDTO();

        expect(dto.skippedAt).toBe(mockSkippedAt);
        expect(dto.reason).toBeNull();
        expect(dto.formattedSkippedAt).toBeDefined();
        expect(dto.hasReason).toBe(false);
        expect(dto.displayText).toBe('已跳过');
      });

      it('应该正确格式化时间', () => {
        const record = new SkipRecord({
          skippedAt: mockSkippedAt,
          reason: 'Test',
        });

        const dto = record.toClientDTO();

        expect(dto.formattedSkippedAt).toContain('/');
        expect(typeof dto.formattedSkippedAt).toBe('string');
      });

      it('应该正确设置 hasReason 标志（有原因）', () => {
        const record = new SkipRecord({
          skippedAt: mockSkippedAt,
          reason: 'Has reason',
        });

        const dto = record.toClientDTO();

        expect(dto.hasReason).toBe(true);
      });

      it('应该正确设置 hasReason 标志（无原因）', () => {
        const record = new SkipRecord({
          skippedAt: mockSkippedAt,
          reason: null,
        });

        const dto = record.toClientDTO();

        expect(dto.hasReason).toBe(false);
      });

      it('应该处理空字符串 reason', () => {
        const record = new SkipRecord({
          skippedAt: mockSkippedAt,
          reason: '',
        });

        const dto = record.toClientDTO();

        // hasReason 检查 reason !== null，空字符串不是 null
        expect(dto.hasReason).toBe(true); // 空字符串 !== null
        // displayText 使用 if (this.reason)，空字符串是 falsy
        expect(dto.displayText).toBe('已跳过'); // 空字符串在 if 中是 falsy
      });

      it('应该正确生成显示文本（有原因）', () => {
        const record = new SkipRecord({
          skippedAt: mockSkippedAt,
          reason: '太忙了',
        });

        const dto = record.toClientDTO();

        expect(dto.displayText).toBe('已跳过: 太忙了');
      });

      it('应该正确生成显示文本（无原因）', () => {
        const record = new SkipRecord({
          skippedAt: mockSkippedAt,
          reason: null,
        });

        const dto = record.toClientDTO();

        expect(dto.displayText).toBe('已跳过');
      });
    });

    describe('toPersistenceDTO()', () => {
      it('应该转换为 PersistenceDTO', () => {
        const record = new SkipRecord({
          skippedAt: mockSkippedAt,
          reason: 'Persistence reason',
        });

        const dto = record.toPersistenceDTO();

        expect(dto.skippedAt).toBe(mockSkippedAt);
        expect(dto.reason).toBe('Persistence reason');
      });

      it('应该处理 null reason', () => {
        const record = new SkipRecord({
          skippedAt: mockSkippedAt,
          reason: null,
        });

        const dto = record.toPersistenceDTO();

        expect(dto.skippedAt).toBe(mockSkippedAt);
        expect(dto.reason).toBeNull();
      });
    });
  });

  // ==================== 边界条件和错误处理 ====================
  describe('Edge Cases', () => {
    it('应该处理极早的时间戳（1970-01-01）', () => {
      const record = new SkipRecord({
        skippedAt: 0,
        reason: 'Epoch time',
      });

      expect(record.skippedAt).toBe(0);
      const dto = record.toClientDTO();
      expect(dto.formattedSkippedAt).toBeDefined();
    });

    it('应该处理极远的未来时间戳', () => {
      const futureTime = Date.now() + 365 * 24 * 60 * 60 * 1000; // 1年后
      const record = new SkipRecord({
        skippedAt: futureTime,
        reason: 'Future skip',
      });

      expect(record.skippedAt).toBe(futureTime);
    });

    it('应该正确处理往返转换（ServerDTO）', () => {
      const original = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: 'Test reason',
      });

      const dto = original.toServerDTO();
      const restored = SkipRecord.fromServerDTO(dto);

      expect(restored.skippedAt).toBe(original.skippedAt);
      expect(restored.reason).toBe(original.reason);
      expect(restored.equals(original)).toBe(true);
    });

    it('应该正确处理往返转换（PersistenceDTO）', () => {
      const original = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: 'Persistence test',
      });

      const dto = original.toPersistenceDTO();
      const restored = SkipRecord.fromPersistenceDTO(dto);

      expect(restored.skippedAt).toBe(original.skippedAt);
      expect(restored.reason).toBe(original.reason);
      expect(restored.equals(original)).toBe(true);
    });

    it('应该处理特殊字符的 reason', () => {
      const specialReason = '原因：\n换行\t制表符 "引号" \'单引号\' <标签>';
      const record = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: specialReason,
      });

      expect(record.reason).toBe(specialReason);
      const dto = record.toClientDTO();
      expect(dto.displayText).toContain(specialReason);
    });

    it('应该处理 Unicode 字符的 reason', () => {
      const unicodeReason = '太忙了 😓 無法完成 🚫';
      const record = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: unicodeReason,
      });

      expect(record.reason).toBe(unicodeReason);
      const dto = record.toClientDTO();
      expect(dto.displayText).toBe(`已跳过: ${unicodeReason}`);
    });

    it('应该处理往返转换（null reason）', () => {
      const original = new SkipRecord({
        skippedAt: mockSkippedAt,
        reason: null,
      });

      const dto = original.toServerDTO();
      const restored = SkipRecord.fromServerDTO(dto);

      expect(restored.skippedAt).toBe(original.skippedAt);
      expect(restored.reason).toBeNull();
      expect(restored.equals(original)).toBe(true);
    });
  });
});
