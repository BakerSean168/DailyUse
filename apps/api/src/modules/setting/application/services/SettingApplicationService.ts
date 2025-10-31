import type { IUserSettingRepository } from '@dailyuse/domain-server';
import { SettingContainer } from '../../infrastructure/di/SettingContainer';
import { UserSetting } from '@dailyuse/domain-server';
import type { SettingContracts } from '@dailyuse/contracts';

/**
 * Setting 应用服务
 * 负责协调领域服务和仓储，处理业务用例
 *
 * 架构职责：
 * - 委托给 DomainService 处理业务逻辑
 * - 协调多个领域服务
 * - 事务管理
 * - DTO 转换（Domain → ClientDTO）
 * - 调用 Repository 进行持久化
 *
 * 注意：返回给客户端的数据必须使用 ClientDTO（通过 toClientDTO() 方法）
 */
export class SettingApplicationService {
  private static instance: SettingApplicationService;
  private userSettingRepository: IUserSettingRepository;

  private constructor(userSettingRepository: IUserSettingRepository) {
    this.userSettingRepository = userSettingRepository;
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    userSettingRepository?: IUserSettingRepository,
  ): Promise<SettingApplicationService> {
    const container = SettingContainer.getInstance();
    const repo = userSettingRepository || container.getUserSettingRepository();

    SettingApplicationService.instance = new SettingApplicationService(repo);
    return SettingApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<SettingApplicationService> {
    if (!SettingApplicationService.instance) {
      SettingApplicationService.instance = await SettingApplicationService.createInstance();
    }
    return SettingApplicationService.instance;
  }

  // ===== UserSetting CRUD 操作 =====

  /**
   * 获取用户设置（如果不存在则创建默认设置）
   */
  async getUserSetting(accountUuid: string): Promise<SettingContracts.UserSettingDTO> {
    let setting = await this.userSettingRepository.findByAccountUuid(accountUuid);

    if (!setting) {
      // 首次访问，创建默认设置
      setting = UserSetting.createDefault(accountUuid);
      await this.userSettingRepository.save(setting);
    }

    return setting.toClientDTO();
  }

  /**
   * 更新用户设置
   */
  async updateUserSetting(
    accountUuid: string,
    updates: SettingContracts.UpdateUserSettingDTO,
  ): Promise<SettingContracts.UserSettingDTO> {
    let setting = await this.userSettingRepository.findByAccountUuid(accountUuid);

    if (!setting) {
      // 如果设置不存在，先创建默认设置
      setting = UserSetting.createDefault(accountUuid);
    }

    // 更新设置
    setting.update(updates);
    await this.userSettingRepository.save(setting);

    return setting.toClientDTO();
  }

  /**
   * 重置用户设置为默认值
   */
  async resetUserSetting(accountUuid: string): Promise<SettingContracts.UserSettingDTO> {
    const setting = await this.userSettingRepository.findByAccountUuid(accountUuid);

    if (!setting) {
      throw new Error('User setting not found');
    }

    setting.resetToDefaults();
    await this.userSettingRepository.save(setting);

    return setting.toClientDTO();
  }

  /**
   * 获取默认设置
   */
  async getDefaultSettings(): Promise<SettingContracts.DefaultSettingsDTO> {
    const defaultSetting = UserSetting.createDefault('temp-uuid');
    return defaultSetting.toDefaultDTO();
  }
}
