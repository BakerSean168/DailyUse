/**
 * CompletionRecord 值对象单元测试
 *
 * 测试覆盖：
 * - 构造函数和验证
 * - 工厂方法 (fromServerDTO, fromPersistenceDTO)
 * - 值相等性比较 (equals)
 * - 不可变性 (with方法)
 * - DTO 转换 (toServerDTO, toClientDTO, toPersistenceDTO)
 * - 辅助方法（格式化时间、星级、时长）
 * - 边界条件和错误处理
 *
 * 目标覆盖率: 85%+
 */

import { describe, it, expect } from 'vitest';
import { CompletionRecord } from '../CompletionRecord';
import type { CompletionRecordPersistenceDTO, CompletionRecordServerDTO } from '@dailyuse/contracts/task';

describe('CompletionRecord Value Object', () => {
  // ==================== 测试数据 ====================
  const mockTaskUuid = 'task-uuid-123';
  const mockCompletedAt = Date.now();

  // ==================== 构造函数和验证测试 ====================
  describe('Constructor and Validation', () => {
    it('应该创建有效的 CompletionRecord', () => {
      const record = new CompletionRecord({
        completedAt: mockCompletedAt,
        note: 'Task completed successfully',
        rating: 5,
        actualDuration: 3600000, // 1小时
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      expect(record.completedAt).toBe(mockCompletedAt);
      expect(record.note).toBe('Task completed successfully');
      expect(record.rating).toBe(5);
      expect(record.actualDuration).toBe(3600000);
      expect(record.taskUuid).toBe(mockTaskUuid);
      expect(record.completionStatus).toBe('completed');
    });

    it('应该支持可选参数', () => {
      const record = new CompletionRecord({
        completedAt: mockCompletedAt,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      expect(record.note).toBeNull();
      expect(record.rating).toBeNull();
      expect(record.actualDuration).toBeNull();
    });

    it('应该将 undefined 转换为 null', () => {
      const record = new CompletionRecord({
        completedAt: mockCompletedAt,
        note: undefined,
        rating: undefined,
        actualDuration: undefined,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      expect(record.note).toBeNull();
      expect(record.rating).toBeNull();
      expect(record.actualDuration).toBeNull();
    });

    it('应该拒绝无效的评分（小于1）', () => {
      expect(() => {
        new CompletionRecord({
          completedAt: mockCompletedAt,
          rating: 0,
          taskUuid: mockTaskUuid,
          completionStatus: 'completed',
        });
      }).toThrow('Rating must be between 1 and 5');
    });

    it('应该拒绝无效的评分（大于5）', () => {
      expect(() => {
        new CompletionRecord({
          completedAt: mockCompletedAt,
          rating: 6,
          taskUuid: mockTaskUuid,
          completionStatus: 'completed',
        });
      }).toThrow('Rating must be between 1 and 5');
    });

    it('应该接受边界评分（1）', () => {
      const record = new CompletionRecord({
        completedAt: mockCompletedAt,
        rating: 1,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      expect(record.rating).toBe(1);
    });

    it('应该接受边界评分（5）', () => {
      const record = new CompletionRecord({
        completedAt: mockCompletedAt,
        rating: 5,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      expect(record.rating).toBe(5);
    });

    it('应该拒绝负数的实际耗时', () => {
      expect(() => {
        new CompletionRecord({
          completedAt: mockCompletedAt,
          actualDuration: -1000,
          taskUuid: mockTaskUuid,
          completionStatus: 'completed',
        });
      }).toThrow('Actual duration must be non-negative');
    });

    it('应该接受0作为实际耗时', () => {
      const record = new CompletionRecord({
        completedAt: mockCompletedAt,
        actualDuration: 0,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      expect(record.actualDuration).toBe(0);
    });

    it('应该是不可变的（frozen）', () => {
      const record = new CompletionRecord({
        completedAt: mockCompletedAt,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      expect(Object.isFrozen(record)).toBe(true);
    });
  });

  // ==================== 工厂方法测试 ====================
  describe('Factory Methods', () => {
    describe('fromServerDTO()', () => {
      it('应该从 ServerDTO 创建实例', () => {
        const dto: CompletionRecordServerDTO = {
          completedAt: mockCompletedAt,
          note: 'Test note',
          rating: 4,
          actualDuration: 7200000, // 2小时
        };

        const record = CompletionRecord.fromServerDTO(dto, mockTaskUuid);

        expect(record.completedAt).toBe(mockCompletedAt);
        expect(record.note).toBe('Test note');
        expect(record.rating).toBe(4);
        expect(record.actualDuration).toBe(7200000);
        expect(record.taskUuid).toBe(mockTaskUuid);
        expect(record.completionStatus).toBe('completed'); // 默认值
      });

      it('应该支持自定义 completionStatus', () => {
        const dto: CompletionRecordServerDTO = {
          completedAt: mockCompletedAt,
          note: null,
          rating: null,
          actualDuration: null,
        };

        const record = CompletionRecord.fromServerDTO(dto, mockTaskUuid, 'partial');

        expect(record.completionStatus).toBe('partial');
      });

      it('应该处理 null 值', () => {
        const dto: CompletionRecordServerDTO = {
          completedAt: mockCompletedAt,
          note: null,
          rating: null,
          actualDuration: null,
        };

        const record = CompletionRecord.fromServerDTO(dto, mockTaskUuid);

        expect(record.note).toBeNull();
        expect(record.rating).toBeNull();
        expect(record.actualDuration).toBeNull();
      });
    });

    describe('fromPersistenceDTO()', () => {
      it('应该从 PersistenceDTO 创建实例', () => {
        const dto: CompletionRecordPersistenceDTO = {
          taskUuid: mockTaskUuid,
          completedAt: mockCompletedAt,
          completionStatus: 'completed',
          note: 'Persistence note',
          rating: 3,
          actualDuration: 1800000, // 30分钟
        };

        const record = CompletionRecord.fromPersistenceDTO(dto);

        expect(record.taskUuid).toBe(mockTaskUuid);
        expect(record.completedAt).toBe(mockCompletedAt);
        expect(record.completionStatus).toBe('completed');
        expect(record.note).toBe('Persistence note');
        expect(record.rating).toBe(3);
        expect(record.actualDuration).toBe(1800000);
      });

      it('应该处理 null 值', () => {
        const dto: CompletionRecordPersistenceDTO = {
          taskUuid: mockTaskUuid,
          completedAt: mockCompletedAt,
          completionStatus: 'completed',
          note: null,
          rating: null,
          actualDuration: null,
        };

        const record = CompletionRecord.fromPersistenceDTO(dto);

        expect(record.note).toBeNull();
        expect(record.rating).toBeNull();
        expect(record.actualDuration).toBeNull();
      });
    });
  });

  // ==================== 值相等性测试 ====================
  describe('Value Equality', () => {
    it('应该判断相同值的记录为相等', () => {
      const record1 = new CompletionRecord({
        completedAt: mockCompletedAt,
        note: 'Same note',
        rating: 5,
        actualDuration: 3600000,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      const record2 = new CompletionRecord({
        completedAt: mockCompletedAt,
        note: 'Same note',
        rating: 5,
        actualDuration: 3600000,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      expect(record1.equals(record2)).toBe(true);
    });

    it('应该判断不同 completedAt 为不相等', () => {
      const record1 = new CompletionRecord({
        completedAt: mockCompletedAt,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      const record2 = new CompletionRecord({
        completedAt: mockCompletedAt + 1000,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      expect(record1.equals(record2)).toBe(false);
    });

    it('应该判断不同 note 为不相等', () => {
      const record1 = new CompletionRecord({
        completedAt: mockCompletedAt,
        note: 'Note 1',
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      const record2 = new CompletionRecord({
        completedAt: mockCompletedAt,
        note: 'Note 2',
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      expect(record1.equals(record2)).toBe(false);
    });

    it('应该判断不同 rating 为不相等', () => {
      const record1 = new CompletionRecord({
        completedAt: mockCompletedAt,
        rating: 3,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      const record2 = new CompletionRecord({
        completedAt: mockCompletedAt,
        rating: 4,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      expect(record1.equals(record2)).toBe(false);
    });

    it('应该判断不同 actualDuration 为不相等', () => {
      const record1 = new CompletionRecord({
        completedAt: mockCompletedAt,
        actualDuration: 1800000,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      const record2 = new CompletionRecord({
        completedAt: mockCompletedAt,
        actualDuration: 3600000,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      expect(record1.equals(record2)).toBe(false);
    });

    it('应该判断不同 taskUuid 为不相等', () => {
      const record1 = new CompletionRecord({
        completedAt: mockCompletedAt,
        taskUuid: 'uuid-1',
        completionStatus: 'completed',
      });

      const record2 = new CompletionRecord({
        completedAt: mockCompletedAt,
        taskUuid: 'uuid-2',
        completionStatus: 'completed',
      });

      expect(record1.equals(record2)).toBe(false);
    });

    it('应该判断不同 completionStatus 为不相等', () => {
      const record1 = new CompletionRecord({
        completedAt: mockCompletedAt,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      const record2 = new CompletionRecord({
        completedAt: mockCompletedAt,
        taskUuid: mockTaskUuid,
        completionStatus: 'partial',
      });

      expect(record1.equals(record2)).toBe(false);
    });
  });

  // ==================== 不可变性测试 (with方法) ====================
  describe('Immutability (with method)', () => {
    it('应该创建新实例（而不是修改原实例）', () => {
      const original = new CompletionRecord({
        completedAt: mockCompletedAt,
        note: 'Original note',
        rating: 3,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      const modified = original.with({ rating: 5 });

      expect(original.rating).toBe(3); // 原实例不变
      expect(modified.rating).toBe(5); // 新实例已修改
      expect(original).not.toBe(modified); // 不是同一个对象
    });

    it('应该修改 completedAt', () => {
      const original = new CompletionRecord({
        completedAt: mockCompletedAt,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      const newTime = mockCompletedAt + 3600000;
      const modified = original.with({ completedAt: newTime });

      expect(modified.completedAt).toBe(newTime);
      expect(original.completedAt).toBe(mockCompletedAt);
    });

    it('应该修改 note', () => {
      const original = new CompletionRecord({
        completedAt: mockCompletedAt,
        note: 'Original',
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      const modified = original.with({ note: 'Modified' });

      expect(modified.note).toBe('Modified');
      expect(original.note).toBe('Original');
    });

    it('应该修改 rating', () => {
      const original = new CompletionRecord({
        completedAt: mockCompletedAt,
        rating: 3,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      const modified = original.with({ rating: 5 });

      expect(modified.rating).toBe(5);
      expect(original.rating).toBe(3);
    });

    it('应该修改 actualDuration', () => {
      const original = new CompletionRecord({
        completedAt: mockCompletedAt,
        actualDuration: 1800000,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      const modified = original.with({ actualDuration: 3600000 });

      expect(modified.actualDuration).toBe(3600000);
      expect(original.actualDuration).toBe(1800000);
    });

    it('应该修改 completionStatus', () => {
      const original = new CompletionRecord({
        completedAt: mockCompletedAt,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      const modified = original.with({ completionStatus: 'partial' });

      expect(modified.completionStatus).toBe('partial');
      expect(original.completionStatus).toBe('completed');
    });

    it('应该支持修改多个字段', () => {
      const original = new CompletionRecord({
        completedAt: mockCompletedAt,
        note: 'Original',
        rating: 3,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      const modified = original.with({
        note: 'Modified',
        rating: 5,
        completionStatus: 'excellent',
      });

      expect(modified.note).toBe('Modified');
      expect(modified.rating).toBe(5);
      expect(modified.completionStatus).toBe('excellent');
      expect(original.note).toBe('Original');
      expect(original.rating).toBe(3);
    });

    it('应该保持 taskUuid 不变（with方法不修改taskUuid）', () => {
      const original = new CompletionRecord({
        completedAt: mockCompletedAt,
        taskUuid: 'original-uuid',
        completionStatus: 'completed',
      });

      const modified = original.with({ note: 'Modified' });

      expect(modified.taskUuid).toBe('original-uuid');
      expect(original.taskUuid).toBe('original-uuid');
    });
  });

  // ==================== DTO 转换测试 ====================
  describe('DTO Conversion', () => {
    describe('toServerDTO()', () => {
      it('应该转换为 ServerDTO', () => {
        const record = new CompletionRecord({
          completedAt: mockCompletedAt,
          note: 'Server note',
          rating: 4,
          actualDuration: 3600000,
          taskUuid: mockTaskUuid,
          completionStatus: 'completed',
        });

        const dto = record.toServerDTO();

        expect(dto.completedAt).toBe(mockCompletedAt);
        expect(dto.note).toBe('Server note');
        expect(dto.rating).toBe(4);
        expect(dto.actualDuration).toBe(3600000);
        // ServerDTO 不包含 taskUuid 和 completionStatus
        expect((dto as any).taskUuid).toBeUndefined();
        expect((dto as any).completionStatus).toBeUndefined();
      });

      it('应该处理 null 值', () => {
        const record = new CompletionRecord({
          completedAt: mockCompletedAt,
          taskUuid: mockTaskUuid,
          completionStatus: 'completed',
        });

        const dto = record.toServerDTO();

        expect(dto.note).toBeNull();
        expect(dto.rating).toBeNull();
        expect(dto.actualDuration).toBeNull();
      });
    });

    describe('toClientDTO()', () => {
      it('应该转换为 ClientDTO（完整数据）', () => {
        const record = new CompletionRecord({
          completedAt: mockCompletedAt,
          note: 'Client note',
          rating: 5,
          actualDuration: 3600000, // 1小时
          taskUuid: mockTaskUuid,
          completionStatus: 'completed',
        });

        const dto = record.toClientDTO();

        expect(dto.completedAt).toBe(mockCompletedAt);
        expect(dto.note).toBe('Client note');
        expect(dto.rating).toBe(5);
        expect(dto.actualDuration).toBe(3600000);
        expect(dto.formattedCompletedAt).toBeDefined();
        expect(dto.durationText).toBe('1小时0分钟');
        expect(dto.hasNote).toBe(true);
        expect(dto.hasRating).toBe(true);
        expect(dto.ratingStars).toBe('⭐⭐⭐⭐⭐');
      });

      it('应该正确格式化时间', () => {
        const record = new CompletionRecord({
          completedAt: mockCompletedAt,
          taskUuid: mockTaskUuid,
          completionStatus: 'completed',
        });

        const dto = record.toClientDTO();

        expect(dto.formattedCompletedAt).toContain('/');
        expect(typeof dto.formattedCompletedAt).toBe('string');
      });

      it('应该正确格式化时长（仅分钟）', () => {
        const record = new CompletionRecord({
          completedAt: mockCompletedAt,
          actualDuration: 1800000, // 30分钟
          taskUuid: mockTaskUuid,
          completionStatus: 'completed',
        });

        const dto = record.toClientDTO();

        expect(dto.durationText).toBe('30分钟');
      });

      it('应该正确格式化时长（小时+分钟）', () => {
        const record = new CompletionRecord({
          completedAt: mockCompletedAt,
          actualDuration: 5400000, // 1小时30分钟
          taskUuid: mockTaskUuid,
          completionStatus: 'completed',
        });

        const dto = record.toClientDTO();

        expect(dto.durationText).toBe('1小时30分钟');
      });

      it('应该正确格式化时长（多小时）', () => {
        const record = new CompletionRecord({
          completedAt: mockCompletedAt,
          actualDuration: 10800000, // 3小时
          taskUuid: mockTaskUuid,
          completionStatus: 'completed',
        });

        const dto = record.toClientDTO();

        expect(dto.durationText).toBe('3小时0分钟');
      });

      it('应该处理未记录的时长', () => {
        const record = new CompletionRecord({
          completedAt: mockCompletedAt,
          actualDuration: null,
          taskUuid: mockTaskUuid,
          completionStatus: 'completed',
        });

        const dto = record.toClientDTO();

        expect(dto.durationText).toBe('未记录');
      });

      it('应该正确显示星级（1星）', () => {
        const record = new CompletionRecord({
          completedAt: mockCompletedAt,
          rating: 1,
          taskUuid: mockTaskUuid,
          completionStatus: 'completed',
        });

        const dto = record.toClientDTO();

        expect(dto.ratingStars).toBe('⭐');
      });

      it('应该正确显示星级（3星）', () => {
        const record = new CompletionRecord({
          completedAt: mockCompletedAt,
          rating: 3,
          taskUuid: mockTaskUuid,
          completionStatus: 'completed',
        });

        const dto = record.toClientDTO();

        expect(dto.ratingStars).toBe('⭐⭐⭐');
      });

      it('应该处理无星级', () => {
        const record = new CompletionRecord({
          completedAt: mockCompletedAt,
          rating: null,
          taskUuid: mockTaskUuid,
          completionStatus: 'completed',
        });

        const dto = record.toClientDTO();

        expect(dto.ratingStars).toBe('');
      });

      it('应该正确设置 hasNote 标志', () => {
        const recordWithNote = new CompletionRecord({
          completedAt: mockCompletedAt,
          note: 'Has note',
          taskUuid: mockTaskUuid,
          completionStatus: 'completed',
        });

        const recordWithoutNote = new CompletionRecord({
          completedAt: mockCompletedAt,
          note: null,
          taskUuid: mockTaskUuid,
          completionStatus: 'completed',
        });

        expect(recordWithNote.toClientDTO().hasNote).toBe(true);
        expect(recordWithoutNote.toClientDTO().hasNote).toBe(false);
      });

      it('应该正确设置 hasRating 标志', () => {
        const recordWithRating = new CompletionRecord({
          completedAt: mockCompletedAt,
          rating: 4,
          taskUuid: mockTaskUuid,
          completionStatus: 'completed',
        });

        const recordWithoutRating = new CompletionRecord({
          completedAt: mockCompletedAt,
          rating: null,
          taskUuid: mockTaskUuid,
          completionStatus: 'completed',
        });

        expect(recordWithRating.toClientDTO().hasRating).toBe(true);
        expect(recordWithoutRating.toClientDTO().hasRating).toBe(false);
      });
    });

    describe('toPersistenceDTO()', () => {
      it('应该转换为 PersistenceDTO', () => {
        const record = new CompletionRecord({
          completedAt: mockCompletedAt,
          note: 'Persistence note',
          rating: 3,
          actualDuration: 1800000,
          taskUuid: mockTaskUuid,
          completionStatus: 'completed',
        });

        const dto = record.toPersistenceDTO();

        expect(dto.taskUuid).toBe(mockTaskUuid);
        expect(dto.completedAt).toBe(mockCompletedAt);
        expect(dto.completionStatus).toBe('completed');
        expect(dto.note).toBe('Persistence note');
        expect(dto.rating).toBe(3);
        expect(dto.actualDuration).toBe(1800000);
      });

      it('应该处理 null 值', () => {
        const record = new CompletionRecord({
          completedAt: mockCompletedAt,
          taskUuid: mockTaskUuid,
          completionStatus: 'completed',
        });

        const dto = record.toPersistenceDTO();

        expect(dto.note).toBeNull();
        expect(dto.rating).toBeNull();
        expect(dto.actualDuration).toBeNull();
      });
    });
  });

  // ==================== 边界条件和错误处理 ====================
  describe('Edge Cases', () => {
    it('应该处理极小的时长（0毫秒）', () => {
      const record = new CompletionRecord({
        completedAt: mockCompletedAt,
        actualDuration: 0,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      const dto = record.toClientDTO();

      expect(dto.durationText).toBe('0分钟');
    });

    it('应该处理极大的时长（24小时）', () => {
      const record = new CompletionRecord({
        completedAt: mockCompletedAt,
        actualDuration: 86400000, // 24小时
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      const dto = record.toClientDTO();

      expect(dto.durationText).toBe('24小时0分钟');
    });

    it('应该正确处理往返转换（ServerDTO）', () => {
      const original = new CompletionRecord({
        completedAt: mockCompletedAt,
        note: 'Test',
        rating: 4,
        actualDuration: 3600000,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      const dto = original.toServerDTO();
      const restored = CompletionRecord.fromServerDTO(dto, mockTaskUuid, 'completed');

      expect(restored.completedAt).toBe(original.completedAt);
      expect(restored.note).toBe(original.note);
      expect(restored.rating).toBe(original.rating);
      expect(restored.actualDuration).toBe(original.actualDuration);
    });

    it('应该正确处理往返转换（PersistenceDTO）', () => {
      const original = new CompletionRecord({
        completedAt: mockCompletedAt,
        note: 'Persistence test',
        rating: 5,
        actualDuration: 7200000,
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      const dto = original.toPersistenceDTO();
      const restored = CompletionRecord.fromPersistenceDTO(dto);

      expect(restored.taskUuid).toBe(original.taskUuid);
      expect(restored.completedAt).toBe(original.completedAt);
      expect(restored.completionStatus).toBe(original.completionStatus);
      expect(restored.note).toBe(original.note);
      expect(restored.rating).toBe(original.rating);
      expect(restored.actualDuration).toBe(original.actualDuration);
    });

    it('应该处理空字符串的 note', () => {
      const record = new CompletionRecord({
        completedAt: mockCompletedAt,
        note: '',
        taskUuid: mockTaskUuid,
        completionStatus: 'completed',
      });

      expect(record.note).toBe('');
      expect(record.toClientDTO().hasNote).toBe(true); // 空字符串也算有note
    });

    it('应该处理不同的 completionStatus 值', () => {
      const statuses = ['completed', 'partial', 'skipped', 'cancelled'];

      statuses.forEach((status) => {
        const record = new CompletionRecord({
          completedAt: mockCompletedAt,
          taskUuid: mockTaskUuid,
          completionStatus: status,
        });

        expect(record.completionStatus).toBe(status);
      });
    });
  });
});
