import type { PrismaClient, Goal as PrismaGoal } from '@prisma/client';
import type { IGoalRepository } from '@dailyuse/domain-server';
import { Goal, KeyResult } from '@dailyuse/domain-server';
import { GoalContracts } from '@dailyuse/contracts';

// 类型别名（从命名空间导入）
type GoalStatus = GoalContracts.GoalStatus;
type ImportanceLevel = GoalContracts.ImportanceLevel;
type UrgencyLevel = GoalContracts.UrgencyLevel;

// 枚举值别名
const ImportanceLevel = GoalContracts.ImportanceLevel;
const UrgencyLevel = GoalContracts.UrgencyLevel;

export class PrismaGoalRepository implements IGoalRepository {
  constructor(private prisma: PrismaClient) {}

  private importanceMap: Record<ImportanceLevel, number> = {
    [ImportanceLevel.Vital]: 4,
    [ImportanceLevel.Important]: 3,
    [ImportanceLevel.Moderate]: 2,
    [ImportanceLevel.Minor]: 1,
    [ImportanceLevel.Trivial]: 0,
  };

  private reverseImportanceMap: Record<number, ImportanceLevel> = {
    4: ImportanceLevel.Vital,
    3: ImportanceLevel.Important,
    2: ImportanceLevel.Moderate,
    1: ImportanceLevel.Minor,
    0: ImportanceLevel.Trivial,
  };

  private urgencyMap: Record<UrgencyLevel, number> = {
    [UrgencyLevel.Critical]: 4,
    [UrgencyLevel.High]: 3,
    [UrgencyLevel.Medium]: 2,
    [UrgencyLevel.Low]: 1,
    [UrgencyLevel.None]: 0,
  };

  private reverseUrgencyMap: Record<number, UrgencyLevel> = {
    4: UrgencyLevel.Critical,
    3: UrgencyLevel.High,
    2: UrgencyLevel.Medium,
    1: UrgencyLevel.Low,
    0: UrgencyLevel.None,
  };

  /**
   * 将 Prisma 模型映射为领域实体
   * 注意：Prisma Client 自动将 @map 的字段转换为 camelCase
   */
  private mapToEntity(data: PrismaGoal & { keyResults?: any[] }): Goal {
    const goal = Goal.fromPersistenceDTO({
      uuid: data.uuid,
      accountUuid: data.accountUuid, // Prisma camelCase
      title: data.title,
      description: data.description,
      color: data.color, // 新字段
      feasibilityAnalysis: data.feasibilityAnalysis, // 新字段 (Prisma camelCase)
      motivation: data.motivation, // 新字段
      status: data.status as GoalStatus,
      importance: this.reverseImportanceMap[data.importance],
      urgency: this.reverseUrgencyMap[data.urgency],
      category: data.category,
      tags: data.tags ?? '[]',
      startDate: data.startDate ? data.startDate.getTime() : null, // Prisma camelCase
      targetDate: data.targetDate ? data.targetDate.getTime() : null, // Prisma camelCase
      completedAt: data.completedAt ? data.completedAt.getTime() : null, // Prisma camelCase
      archivedAt: data.archivedAt ? data.archivedAt.getTime() : null, // Prisma camelCase
      folderUuid: data.folderUuid, // Prisma camelCase
      parentGoalUuid: data.parentGoalUuid, // Prisma camelCase
      sortOrder: data.sortOrder, // Prisma camelCase
      reminderConfig: data.reminderConfig, // Prisma camelCase
      createdAt: data.createdAt.getTime(), // Prisma camelCase
      updatedAt: data.updatedAt.getTime(), // Prisma camelCase
      deletedAt: data.deletedAt ? data.deletedAt.getTime() : null, // Prisma camelCase
    });

    // 恢复 KeyResults（如果有）
    if (data.keyResults && data.keyResults.length > 0) {
      for (const krData of data.keyResults) {
        const keyResult = KeyResult.fromPersistenceDTO({
          uuid: krData.uuid,
          goalUuid: krData.goalUuid,
          title: krData.title,
          description: krData.description,
          progress: JSON.stringify({
            valueType: krData.valueType,
            aggregation_method: krData.aggregationMethod,
            target_value: krData.targetValue,
            current_value: krData.currentValue,
            unit: krData.unit,
          }),
          weight: krData.weight, // 添加 weight 属性
          order: krData.order,
          createdAt:
            krData.createdAt instanceof Date ? krData.createdAt.getTime() : krData.createdAt,
          updatedAt:
            krData.updatedAt instanceof Date ? krData.updatedAt.getTime() : krData.updatedAt,
        });
        goal.addKeyResult(keyResult);
      }
    }

    return goal;
  }

  /**
   * 保存领域实体到数据库
   * 注意：这里处理 camelCase (PersistenceDTO) → snake_case (数据库) 的映射
   * 级联保存子实体：KeyResults（暂不保存 Reviews，因为接口不完整）
   */
  async save(goal: Goal): Promise<void> {
    const persistence = goal.toPersistenceDTO();
    const data = {
      title: persistence.title,
      description: persistence.description,
      status: persistence.status,
      importance: this.importanceMap[persistence.importance],
      urgency: this.urgencyMap[persistence.urgency],
      category: persistence.category,
      tags: persistence.tags,
      startDate: persistence.startDate ? new Date(persistence.startDate) : null,
      targetDate: persistence.targetDate ? new Date(persistence.targetDate) : null,
      completedAt: persistence.completedAt ? new Date(persistence.completedAt) : null,
      archivedAt: persistence.archivedAt ? new Date(persistence.archivedAt) : null,
      folderUuid: persistence.folderUuid,
      parentGoalUuid: persistence.parentGoalUuid,
      sortOrder: persistence.sortOrder,
      reminderConfig: persistence.reminderConfig,
      updatedAt: new Date(persistence.updatedAt),
      deletedAt: persistence.deletedAt ? new Date(persistence.deletedAt) : null,
    };

    await this.prisma.goal.upsert({
      where: { uuid: persistence.uuid },
      create: {
        uuid: persistence.uuid,
        accountUuid: persistence.accountUuid, // PersistenceDTO → database
        createdAt: new Date(persistence.createdAt), // PersistenceDTO → database
        ...data,
      },
      update: data,
    });

    // 级联保存 KeyResults（使用 ServerDTO 获取完整数据）
    const serverDTO = goal.toServerDTO(true); // includeChildren=true
    if (serverDTO.keyResults && serverDTO.keyResults.length > 0) {
      for (const kr of serverDTO.keyResults) {
        await (this.prisma as any).keyResult.upsert({
          where: { uuid: kr.uuid },
          create: {
            uuid: kr.uuid,
            goalUuid: goal.uuid,
            title: kr.title,
            description: kr.description || null,
            valueType: kr.progress.valueType,
            aggregationMethod: kr.progress.aggregationMethod,
            targetValue: kr.progress.targetValue,
            currentValue: kr.progress.currentValue,
            unit: kr.progress.unit || null,
            order: kr.order,
            createdAt: new Date(kr.createdAt),
            updatedAt: new Date(kr.updatedAt),
          },
          update: {
            title: kr.title,
            description: kr.description || null,
            valueType: kr.progress.valueType,
            aggregationMethod: kr.progress.aggregationMethod,
            targetValue: kr.progress.targetValue,
            currentValue: kr.progress.currentValue,
            unit: kr.progress.unit || null,
            order: kr.order,
            updatedAt: new Date(kr.updatedAt),
          },
        });
      }
    }
  }

  async findById(uuid: string, options?: { includeChildren?: boolean }): Promise<Goal | null> {
    const includeOptions = options?.includeChildren
      ? {
          keyResults: true,
        }
      : undefined;

    const data = await this.prisma.goal.findUnique({
      where: { uuid },
      include: includeOptions as any, // 使用 any 绕过类型检查（因为 keyResults 关系还未在 Prisma Client 中生成）
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findByAccountUuid(
    accountUuid: string,
    options?: {
      includeChildren?: boolean;
      status?: string;
      folderUuid?: string;
    },
  ): Promise<Goal[]> {
    const where: any = { accountUuid: accountUuid, deletedAt: null }; // Prisma 自动转换为 camelCase
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.folderUuid) {
      where.folderUuid = options.folderUuid; // Prisma 自动转换为 camelCase
    }
    const data = await this.prisma.goal.findMany({ where });
    return data.map((d) => this.mapToEntity(d));
  }

  async findByFolderUuid(folderUuid: string): Promise<Goal[]> {
    const data = await this.prisma.goal.findMany({
      where: { folderUuid: folderUuid, deletedAt: null }, // Prisma 自动转换为 camelCase
    });
    return data.map((d) => this.mapToEntity(d));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.goal.delete({ where: { uuid } });
  }

  async softDelete(uuid: string): Promise<void> {
    await this.prisma.goal.update({
      where: { uuid },
      data: { deletedAt: new Date() }, // database field
    });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.goal.count({ where: { uuid } });
    return count > 0;
  }

  async batchUpdateStatus(uuids: string[], status: string): Promise<void> {
    await this.prisma.goal.updateMany({
      where: { uuid: { in: uuids } },
      data: { status },
    });
  }

  async batchMoveToFolder(uuids: string[], folderUuid: string | null): Promise<void> {
    await this.prisma.goal.updateMany({
      where: { uuid: { in: uuids } },
      data: { folderUuid: folderUuid }, // database field
    });
  }
}
