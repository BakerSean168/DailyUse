import type { IGoalRepository } from '@dailyuse/domain-server';
import { GoalContainer } from '../../infrastructure/di/GoalContainer';
import { GoalRecord } from '@dailyuse/domain-server';
import type { GoalContracts } from '@dailyuse/contracts';
import { GoalEventPublisher } from './GoalEventPublisher';

/**
 * GoalRecord 应用服务
 * 负责目标记录的增删查改
 * 
 * 职责：
 * - 创建目标记录（value 变更追踪）
 * - 查询关键结果的记录历史
 * - 查询目标的所有记录
 * - 删除记录
 * - 获取进度分解详情
 */
export class GoalRecordApplicationService {
  private static instance: GoalRecordApplicationService;
  private goalRepository: IGoalRepository;

  private constructor(goalRepository: IGoalRepository) {
    this.goalRepository = goalRepository;
  }

  /**
   * 创建应用服务实例
   */
  static async createInstance(goalRepository?: IGoalRepository): Promise<GoalRecordApplicationService> {
    const container = GoalContainer.getInstance();
    const repo = goalRepository || container.getGoalRepository();

    GoalRecordApplicationService.instance = new GoalRecordApplicationService(repo);
    return GoalRecordApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<GoalRecordApplicationService> {
    if (!GoalRecordApplicationService.instance) {
      GoalRecordApplicationService.instance = await GoalRecordApplicationService.createInstance();
    }
    return GoalRecordApplicationService.instance;
  }

  /**
   * 创建目标记录
   */
  async createGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    params: {
      value: number;
      note?: string;
      recordedAt?: number;
    },
  ): Promise<GoalContracts.GoalRecordClientDTO> {
    // 1. 查询目标（包含子实体）
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }

    // 2. 查找关键结果
    const keyResult = goal.keyResults.find((kr) => kr.uuid === keyResultUuid);
    if (!keyResult) {
      throw new Error(`KeyResult not found: ${keyResultUuid}`);
    }

    // 3. 获取当前值作为 previousValue
    const previousValue = keyResult.progress.currentValue;
    const newValue = params.value;

    // 4. 创建记录实体
    const record = GoalRecord.create({
      keyResultUuid,
      goalUuid,
      previousValue,
      newValue,
      note: params.note || undefined,
      recordedAt: params.recordedAt || Date.now(),
    });

    // 5. 添加到关键结果
    keyResult.addRecord(record);

    // 6. 更新关键结果的当前值
    keyResult.updateProgress(newValue);

    // 7. 持久化
    await this.goalRepository.save(goal);

    // 8. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);

    // 9. 返回 ClientDTO
    return record.toClientDTO();
  }

  /**
   * 获取关键结果的所有记录（分页）
   */
  async getGoalRecordsByKeyResult(
    goalUuid: string,
    keyResultUuid: string,
    options?: {
      page?: number;
      limit?: number;
      dateRange?: { start?: string; end?: string };
    },
  ): Promise<GoalContracts.GoalRecordsResponse> {
    // 1. 查询目标（包含子实体）
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }

    // 2. 查找关键结果
    const keyResult = goal.keyResults.find((kr) => kr.uuid === keyResultUuid);
    if (!keyResult) {
      throw new Error(`KeyResult not found: ${keyResultUuid}`);
    }

    // 3. 获取记录并过滤
    let records = keyResult.records ? [...keyResult.records.map(dto => GoalRecord.fromServerDTO(dto))] : [];

    // 日期范围过滤
    if (options?.dateRange) {
      const { start, end } = options.dateRange;
      if (start) {
        const startTime = new Date(start).getTime();
        records = records.filter((r) => r.recordedAt >= startTime);
      }
      if (end) {
        const endTime = new Date(end).getTime();
        records = records.filter((r) => r.recordedAt <= endTime);
      }
    }

    // 排序（最新的在前）
    records.sort((a, b) => b.recordedAt - a.recordedAt);

    // 4. 分页
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const total = records.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecords = records.slice(startIndex, endIndex);

    // 5. 返回响应
    return {
      records: paginatedRecords.map((r) => r.toClientDTO()),
      total,
    };
  }

  /**
   * 获取目标的所有记录（所有关键结果）
   */
  async getGoalRecordsByGoal(
    goalUuid: string,
    options?: {
      page?: number;
      limit?: number;
    },
  ): Promise<GoalContracts.GoalRecordsResponse> {
    // 1. 查询目标（包含子实体）
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }

    // 2. 收集所有关键结果的记录
    const allRecords: GoalRecord[] = [];
    for (const keyResult of goal.keyResults) {
      if (keyResult.records) {
        const recordEntities = keyResult.records.map(dto => GoalRecord.fromServerDTO(dto));
        allRecords.push(...recordEntities);
      }
    }

    // 3. 排序（最新的在前）
    allRecords.sort((a, b) => b.recordedAt - a.recordedAt);

    // 4. 分页
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const total = allRecords.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecords = allRecords.slice(startIndex, endIndex);

    // 5. 返回响应
    return {
      records: paginatedRecords.map((r) => r.toClientDTO()),
      total,
    };
  }

  /**
   * 删除目标记录
   */
  async deleteGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    recordUuid: string,
  ): Promise<void> {
    // 1. 查询目标（包含子实体）
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }

    // 2. 查找关键结果
    const keyResult = goal.keyResults.find((kr) => kr.uuid === keyResultUuid);
    if (!keyResult) {
      throw new Error(`KeyResult not found: ${keyResultUuid}`);
    }

    // 3. 删除记录
    keyResult.removeRecord(recordUuid);

    // 4. 持久化
    await this.goalRepository.save(goal);

    // 5. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);
  }

  /**
   * 获取目标进度分解详情
   */
  async getGoalProgressBreakdown(
    goalUuid: string,
  ): Promise<GoalContracts.ProgressBreakdown> {
    // 1. 查询目标（包含子实体）
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }

    // 2. 计算每个关键结果的贡献度
    const keyResultContributions = goal.keyResults.map((kr) => {
      const progress = kr.progress;
      const progressPercentage = progress.targetValue !== 0 
        ? (progress.currentValue / progress.targetValue) * 100 
        : 0;
      const contribution = (progressPercentage / 100) * kr.weight;

      return {
        keyResultUuid: kr.uuid,
        keyResultName: kr.title,
        weight: kr.weight,
        progress: progressPercentage,
        contribution,
      };
    });

    // 3. 计算总进度（加权平均）
    const totalProgress = goal.keyResults.reduce((sum, kr) => {
      const progress = kr.progress;
      const progressPercentage = progress.targetValue !== 0
        ? (progress.currentValue / progress.targetValue) * 100
        : 0;
      return sum + (progressPercentage * kr.weight / 100);
    }, 0);

    return {
      totalProgress,
      calculationMode: 'weighted_average' as const,
      krContributions: keyResultContributions,
      lastUpdateTime: Date.now(),
      updateTrigger: 'manual_request',
    };
  }
}
