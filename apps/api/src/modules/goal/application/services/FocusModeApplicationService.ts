/**
 * FocusMode Application Service
 * 专注周期模式应用服务
 *
 * 负责专注周期的创建、查询、延期、失效和自动过期检查。
 */

import type { IFocusModeRepository, IGoalRepository } from '@dailyuse/domain-server/goal';
import { FocusMode } from '@dailyuse/domain-server/goal';
import type { GoalServerDTO, GoalClientDTO, KeyResultServerDTO, HiddenGoalsMode, FocusModeClientDTO } from '@dailyuse/contracts/goal';
import { GoalContainer } from '../../infrastructure/di/GoalContainer';

/**
 * 启用专注模式参数
 */
export interface ActivateFocusModeParams {
  accountUuid: string;
  focusedGoalUuids: string[];
  startTime: number;
  endTime: number;
  hiddenGoalsMode: HiddenGoalsMode;
}

/**
 * 延期专注模式参数
 */
export interface ExtendFocusModeParams {
  uuid: string;
  newEndTime: number;
}

/**
 * 专注周期应用服务
 *
 * **职责**:
 * - 启用/关闭专注模式
 * - 延期专注周期
 * - 查询当前活跃周期
 * - 自动失效过期周期（Cron Job）
 * - 校验目标存在性和数量限制
 *
 * **设计模式**: Singleton
 * **依赖注入**: FocusModeRepository, GoalRepository
 */
export class FocusModeApplicationService {
  private static instance: FocusModeApplicationService;

  private constructor(
    private readonly focusModeRepository: IFocusModeRepository,
    private readonly goalRepository: IGoalRepository,
  ) {}

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    focusModeRepository?: IFocusModeRepository,
    goalRepository?: IGoalRepository,
  ): Promise<FocusModeApplicationService> {
    const container = GoalContainer.getInstance();
    const focusRepo = focusModeRepository || container.getFocusModeRepository();
    const goalRepo = goalRepository || container.getGoalRepository();

    FocusModeApplicationService.instance = new FocusModeApplicationService(focusRepo, goalRepo);
    return FocusModeApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<FocusModeApplicationService> {
    if (!FocusModeApplicationService.instance) {
      FocusModeApplicationService.instance = await FocusModeApplicationService.createInstance();
    }
    return FocusModeApplicationService.instance;
  }

  // ===== 专注模式管理 =====

  /**
   * 启用专注模式
   *
   * 业务规则：
   * - 同一账户同时只能有一个活跃的专注周期
   * - 必须选择 1-3 个目标
   * - 所有目标必须存在且属于该账户
   * - endTime 必须大于 startTime
   *
   * @throws Error 如果账户已有活跃周期
   * @throws Error 如果目标数量不在 1-3 范围
   * @throws Error 如果目标不存在或不属于该账户
   */
  async activateFocusMode(params: ActivateFocusModeParams): Promise<FocusModeClientDTO> {
    const { accountUuid, focusedGoalUuids, startTime, endTime, hiddenGoalsMode } = params;

    // 1. 校验账户是否已有活跃周期
    const existingActive = await this.focusModeRepository.findActiveByAccountUuid(accountUuid);
    if (existingActive) {
      throw new Error(`Account ${accountUuid} already has an active focus mode`);
    }

    // 2. 校验目标数量
    if (focusedGoalUuids.length < 1 || focusedGoalUuids.length > 3) {
      throw new Error('Must select 1-3 goals for focus mode');
    }

    // 3. 校验所有目标存在且属于该账户
    await this.validateGoalsExist(accountUuid, focusedGoalUuids);

    // 4. 创建 FocusMode 值对象（会进行时间范围校验）
    const focusMode = FocusMode.create(
      crypto.randomUUID(),
      accountUuid,
      focusedGoalUuids,
      endTime,
      hiddenGoalsMode || 'hide',
    );

    // 5. 持久化
    await this.focusModeRepository.save(focusMode);

    // 6. 返回 ClientDTO
    return focusMode.toClientDTO();
  }

  /**
   * 关闭专注模式（手动失效）
   *
   * @throws Error 如果专注周期不存在
   * @throws Error 如果专注周期已失效
   */
  async deactivateFocusMode(uuid: string): Promise<FocusModeClientDTO> {
    // 1. 查找专注周期
    const focusMode = await this.focusModeRepository.findById(uuid);
    if (!focusMode) {
      throw new Error(`Focus mode not found: ${uuid}`);
    }

    // 2. 检查是否已失效
    if (!focusMode.isActive) {
      throw new Error(`Focus mode ${uuid} is already inactive`);
    }

    // 3. 失效（返回新实例）
    const deactivated = focusMode.deactivate();

    // 4. 持久化
    await this.focusModeRepository.save(deactivated);

    // 5. 返回 ClientDTO
    return deactivated.toClientDTO();
  }

  /**
   * 延期专注模式
   *
   * @throws Error 如果专注周期不存在
   * @throws Error 如果专注周期已失效
   * @throws Error 如果 newEndTime <= endTime（不允许缩短）
   */
  async extendFocusMode(params: ExtendFocusModeParams): Promise<FocusModeClientDTO> {
    const { uuid, newEndTime } = params;

    // 1. 查找专注周期
    const focusMode = await this.focusModeRepository.findById(uuid);
    if (!focusMode) {
      throw new Error(`Focus mode not found: ${uuid}`);
    }

    // 2. 检查是否已失效
    if (!focusMode.isActive) {
      throw new Error(`Focus mode ${uuid} is inactive, cannot extend`);
    }

    // 3. 延期（会校验 newEndTime > endTime）
    const extended = focusMode.extend(newEndTime);

    // 4. 持久化
    await this.focusModeRepository.save(extended);

    // 5. 返回 ClientDTO
    return extended.toClientDTO();
  }

  /**
   * 获取账户当前活跃的专注周期
   *
   * @returns 活跃周期，不存在则返回 null
   */
  async getActiveFocusMode(accountUuid: string): Promise<FocusModeClientDTO | null> {
    const focusMode = await this.focusModeRepository.findActiveByAccountUuid(accountUuid);
    return focusMode ? focusMode.toClientDTO() : null;
  }

  /**
   * 获取账户的所有专注周期（包括历史）
   *
   * @returns 周期列表（按创建时间倒序）
   */
  async getFocusModeHistory(accountUuid: string): Promise<FocusModeClientDTO[]> {
    const focusModes = await this.focusModeRepository.findByAccountUuid(accountUuid);
    return focusModes.map((fm) => fm.toClientDTO());
  }

  /**
   * 检查并失效过期的专注周期
   *
   * 由 Cron Job 定时调用（每小时一次）
   *
   * @returns 失效的周期数量
   */
  async checkAndDeactivateExpired(): Promise<number> {
    return await this.focusModeRepository.deactivateExpired();
  }

  // ===== 私有方法 =====

  /**
   * 校验所有目标存在且属于指定账户
   *
   * @throws Error 如果任何目标不存在或不属于该账户
   */
  private async validateGoalsExist(accountUuid: string, goalUuids: string[]): Promise<void> {
    for (const goalUuid of goalUuids) {
      const goal = await this.goalRepository.findById(goalUuid, { includeChildren: false });
      if (!goal) {
        throw new Error(`Goal not found: ${goalUuid}`);
      }
      if (goal.accountUuid !== accountUuid) {
        throw new Error(`Goal ${goalUuid} does not belong to account ${accountUuid}`);
      }
    }
  }
}

