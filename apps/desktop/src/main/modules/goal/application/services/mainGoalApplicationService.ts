import type {
  IGoal,
  IGoalRecord,
  IGoalFolder,
  IGoalReview,
} from '../../../../../common/modules/goal/types/goal';
import { Goal } from '../../domain/aggregates/goal';
import { GoalReview } from '../../domain/entities/goalReview';
import { GoalFolder } from '../../domain/aggregates/GoalFolder';
import { GoalRecord } from '../../domain/entities/record';
import { GoalContainer } from '../../infrastructure/di/goalContainer';
import type { IGoalRepository } from '../../domain/repositories/iGoalRepository';
import { SYSTEM_GOAL_DIRS } from '../../../../../common/modules/goal/types/goal';
/**
 * 主进程目标应用服务
 * 处理目标相关的业务逻辑和数据库操作
 *
 * 职责：
 * 1. 目标的CRUD操作
 * 2. 关键结果管理
 * 3. 记录管理
 * 4. 目标目录管理
 * 5. 数据验证和业务规则执行
 */
export class MainGoalApplicationService {
  private static instance: MainGoalApplicationService;
  private goalRepository: IGoalRepository;

  constructor(goalRepository: IGoalRepository) {
    this.goalRepository = goalRepository;
  }

  static async createInstance(
    goalRepository?: IGoalRepository,
  ): Promise<MainGoalApplicationService> {
    const goalContainer = GoalContainer.getInstance();
    goalRepository = goalRepository || (await goalContainer.getGoalRepository());
    this.instance = new MainGoalApplicationService(goalRepository);
    return this.instance;
  }

  static async getInstance(): Promise<MainGoalApplicationService> {
    if (!this.instance) {
      MainGoalApplicationService.instance = await MainGoalApplicationService.createInstance();
    }
    return this.instance;
  }
  // ========== 初始化目标应用服务 ==========

  /**
   * 初始化系统内置目标目录（文件夹）
   * @param accountUuid 用户账号ID
   */
  async initializeSystemGoalFolders(accountUuid: string): Promise<void> {
    for (const config of Object.values(SYSTEM_GOAL_DIRS)) {
      // 检查是否已存在
      const exists = await this.goalRepository.getGoalFolderectoryByUuid(accountUuid, config.uuid);
      if (!exists) {
        const dir: IGoalFolder = {
          uuid: config.uuid,
          name: config.name,
          icon: config.icon,
          color: config.color,
          description: '',
          sortConfig: { sortKey: 'createdAt', sortOrder: 0 },
          lifecycle: {
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'active',
          },
        };
        await this.goalRepository.createGoalFolderectory(accountUuid, GoalFolder.fromDTO(dir));
      }
    }
  }

  // ========== 目标管理 ==========

  /**
   * 创建目标
   */
  async createGoal(accountUuid: string, goalDTO: IGoal): Promise<Goal> {
    const goal = Goal.fromDTO(goalDTO);
    console.log('🔄 [MainGoalApplicationService.createGoal] 创建目标:', goal);
    const createdGoal = await this.goalRepository.createGoal(accountUuid, goal);
    return createdGoal;
  }

  /**
   * 获取所有目标
   */
  async getAllGoals(accountUuid: string): Promise<Goal[]> {
    const goals = await this.goalRepository.getAllGoals(accountUuid);
    return goals;
  }

  /**
   * 根据ID获取目标
   */
  async getGoalById(accountUuid: string, goalUuid: string): Promise<Goal | null> {
    const goal = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
    return goal || null;
  }

  /**
   * 更新目标
   */
  async updateGoal(accountUuid: string, goalData: IGoal): Promise<Goal> {
    const existingGoal = await this.goalRepository.getGoalByUuid(accountUuid, goalData.uuid);
    if (!existingGoal) {
      throw new Error(`目标不存在: ${goalData.uuid}`);
    }

    // Convert DTO to Goal object
    const updatedGoal = Goal.fromDTO(goalData);
    const result = await this.goalRepository.updateGoal(accountUuid, updatedGoal);
    return result;
  }

  /**
   * 删除目标
   */
  async deleteGoal(accountUuid: string, goalUuid: string): Promise<void> {
    const goal = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!goal) {
      throw new Error(`目标不存在: ${goalUuid}`);
    }
    await this.goalRepository.deleteGoal(accountUuid, goalUuid);
  }

  /**
   * 删除所有目标
   */
  async deleteAllGoals(accountUuid: string): Promise<void> {
    const goals = await this.goalRepository.getAllGoals(accountUuid);
    const goalUuids = goals.map((goal) => goal.uuid);
    await this.goalRepository.batchDeleteGoals(accountUuid, goalUuids);
  }

  // ========== 关键结果管理 ==========

  /**
   * 为目标的关键结果添加记录（通过聚合根）
   */
  async addGoalRecordToGoal(
    accountUuid: string,
    recordDTO: IGoalRecord,
  ): Promise<{ goal: Goal; record: GoalRecord }> {
    if (recordDTO.value <= 0) {
      throw new Error('记录值必须大于0');
    }
    const goal = await this.goalRepository.getGoalByUuid(accountUuid, recordDTO.goalUuid);
    if (!goal) {
      throw new Error(`目标不存在: ${recordDTO.goalUuid}`);
    }

    // 将 record 进行持久化存储
    const record = GoalRecord.fromDTO(recordDTO);
    const createdGoalRecord = await this.goalRepository.createGoalRecord(accountUuid, record);

    // 调用聚合根的方法将记录添加到目标中，这会更新关键结果的值
    goal.addGoalRecord(createdGoalRecord);

    // 更新目标的关键结果和进度
    const updatedGoal = await this.goalRepository.updateGoal(accountUuid, goal);

    return { goal: updatedGoal, record: createdGoalRecord };
  }

  /**
   * 获取所有记录
   */
  async getAllGoalRecords(accountUuid: string): Promise<GoalRecord[]> {
    const goals = await this.goalRepository.getAllGoals(accountUuid);
    const allGoalRecords: GoalRecord[] = [];
    for (const goal of goals) {
      const records = await this.goalRepository.getGoalRecordsByGoal(accountUuid, goal.uuid);
      allGoalRecords.push(...records);
    }
    return allGoalRecords;
  }

  /**
   * 根据目标ID获取记录
   */
  async getGoalRecordsByGoalUuid(accountUuid: string, goalUuid: string): Promise<GoalRecord[]> {
    const records = await this.goalRepository.getGoalRecordsByGoal(accountUuid, goalUuid);
    return records;
  }

  /**
   * 删除记录
   */
  async deleteGoalRecord(accountUuid: string, recordId: string): Promise<void> {
    await this.goalRepository.deleteGoalRecord(accountUuid, recordId);
  }

  // ========== 目标复盘管理（聚合根驱动）==========

  /**
   * 为目标添加复盘（聚合根驱动）
   */
  async addReviewToGoal(
    accountUuid: string,
    goalReviewDTO: IGoalReview,
  ): Promise<{ goal: Goal; review: GoalReview }> {
    try {
      console.log('🔄 [MainGoalApplicationService.addReviewToGoal] 添加复盘:', goalReviewDTO);

      // Create review entity and add to goal
      const goalReview = GoalReview.fromDTO(goalReviewDTO);

      // Update goal with new review
      await this.goalRepository.createGoalReview(accountUuid, goalReview);
      const goal = await this.goalRepository.getGoalByUuid(accountUuid, goalReviewDTO.goalUuid);
      if (!goal) {
        throw new Error(`目标不存在: ${goalReviewDTO.goalUuid}`);
      }
      return { goal, review: goalReview };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`添加复盘失败：${error.message}`);
      } else {
        throw new Error(`添加复盘失败：${String(error)}`);
      }
    }
  }

  /**
   * 更新目标的复盘（聚合根驱动）
   */
  async updateReviewInGoal(
    accountUuid: string,
    goalReviewDTO: IGoalReview,
  ): Promise<{ goal: Goal; review: GoalReview }> {
    const review = GoalReview.fromDTO(goalReviewDTO);
    await this.goalRepository.updateGoalReview(accountUuid, review);
    const goal = await this.goalRepository.getGoalByUuid(accountUuid, goalReviewDTO.goalUuid);
    if (!goal) {
      throw new Error(`目标不存在: ${goalReviewDTO.goalUuid}`);
    }
    return { goal, review };
  }

  /**
   * 从目标中移除复盘
   */
  async removeReviewFromGoal(accountUuid: string, goalReviewDTO: IGoalReview): Promise<Goal> {
    await this.goalRepository.removeGoalReview(accountUuid, goalReviewDTO.uuid);
    const goal = await this.goalRepository.getGoalByUuid(accountUuid, goalReviewDTO.goalUuid);
    if (!goal) {
      throw new Error(`目标不存在: ${goalReviewDTO.goalUuid}`);
    }
    return goal;
  }

  // ========== 目标目录管理 ==========

  /**
   * 创建目标目录
   */
  async createGoalFolder(accountUuid: string, GoalFolderDTO: IGoalFolder): Promise<GoalFolder> {
    const validation = GoalFolder.validate(GoalFolderDTO);
    if (!validation.isValid) {
      throw new Error(`目录数据验证失败: ${validation.errors.join(', ')}`);
    }

    // Convert DTO to domain object
    const GoalFolder = GoalFolder.fromDTO(GoalFolderDTO);
    const createdGoalFolder = await this.goalRepository.createGoalFolderectory(accountUuid, GoalFolder);
    console.log('✅ [MainGoalApplicationService.createGoalFolder]:创建目标目录成功', createdGoalFolder);
    return createdGoalFolder;
  }

  /**
   * 获取所有目标目录
   */
  async getAllGoalFolders(accountUuid: string): Promise<GoalFolder[]> {
    const GoalFolders = await this.goalRepository.getAllGoalFolderectories(accountUuid);
    return GoalFolders;
  }

  /**
   * 删除目标目录
   */
  async deleteGoalFolder(accountUuid: string, GoalFolderId: string): Promise<void> {
    const GoalFolder = await this.goalRepository.getGoalFolderectoryByUuid(accountUuid, GoalFolderId);
    if (!GoalFolder) {
      throw new Error(`目标目录不存在: ${GoalFolderId}`);
    }

    const goalsInDir = await this.goalRepository.getGoalsByDirectory(accountUuid, GoalFolderId);
    if (goalsInDir.length > 0) {
      throw new Error(`无法删除目录，还有 ${goalsInDir.length} 个目标在使用此目录`);
    }

    await this.goalRepository.deleteGoalFolderectory(accountUuid, GoalFolderId);
  }

  /**
   * 更新目标目录
   */
  async updateGoalFolder(accountUuid: string, GoalFolderData: IGoalFolder): Promise<GoalFolder> {
    const existingGoalFolder = await this.goalRepository.getGoalFolderectoryByUuid(
      accountUuid,
      GoalFolderData.uuid,
    );
    if (!existingGoalFolder) {
      throw new Error(`目标目录不存在: ${GoalFolderData.uuid}`);
    }

    // Convert DTO to domain object
    const updatedGoalFolder = GoalFolder.fromDTO(GoalFolderData);
    const result = await this.goalRepository.updateGoalFolderectory(accountUuid, updatedGoalFolder);
    return result;
  }

  /**
   * 删除目标的关键结果（通过聚合根）
   */
  async removeKeyResultFromGoal(
    accountUuid: string,
    goalUuid: string,
    keyResultId: string,
  ): Promise<Goal> {
    const goal = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!goal) {
      throw new Error('目标不存在');
    }

    goal.removeKeyResult(keyResultId);
    await this.goalRepository.updateGoal(accountUuid, goal);
    return goal;
  }
  // ========== 记录管理 ==========

  /**
   * 从目标中删除记录（通过聚合根）
   */
  async removeGoalRecordFromGoal(
    accountUuid: string,
    goalUuid: string,
    recordId: string,
  ): Promise<Goal> {
    const goal = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
    if (!goal) {
      throw new Error('目标不存在');
    }

    goal.removeGoalRecord(recordId);
    await this.goalRepository.updateGoal(accountUuid, goal);
    return goal;
  }
}
