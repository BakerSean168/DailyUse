/**
 * Reset User Setting
 *
 * 重置用户设置为默认值
 */

import type { IUserSettingRepository } from '@dailyuse/domain-server/setting';
import { UserSetting } from '@dailyuse/domain-server/setting';
import type { UserSettingClientDTO } from '@dailyuse/contracts/setting';
import { SettingContainer } from '@dailyuse/infrastructure-server';

/**
 * Reset User Setting Input
 */
export interface ResetUserSettingInput {
  accountUuid: string;
}

/**
 * Reset User Setting Output
 */
export interface ResetUserSettingOutput {
  setting: UserSettingClientDTO;
}

/**
 * Reset User Setting
 */
export class ResetUserSetting {
  private static instance: ResetUserSetting;

  private constructor(private readonly userSettingRepository: IUserSettingRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(userSettingRepository?: IUserSettingRepository): ResetUserSetting {
    const container = SettingContainer.getInstance();
    const repo = userSettingRepository || container.getUserSettingRepository();
    ResetUserSetting.instance = new ResetUserSetting(repo);
    return ResetUserSetting.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ResetUserSetting {
    if (!ResetUserSetting.instance) {
      ResetUserSetting.instance = ResetUserSetting.createInstance();
    }
    return ResetUserSetting.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ResetUserSetting.instance = undefined as unknown as ResetUserSetting;
  }

  /**
   * 执行用例
   */
  async execute(input: ResetUserSettingInput): Promise<ResetUserSettingOutput> {
    const { accountUuid } = input;

    const setting = await this.userSettingRepository.findByAccountUuid(accountUuid);

    if (!setting) {
      throw new Error('User setting not found');
    }

    const newSetting = UserSetting.create({ accountUuid });
    (newSetting as any)._uuid = setting.uuid;

    await this.userSettingRepository.save(newSetting);
    return { setting: newSetting.toClientDTO() };
  }
}

/**
 * 便捷函数
 */
export const resetUserSetting = (input: ResetUserSettingInput): Promise<ResetUserSettingOutput> =>
  ResetUserSetting.getInstance().execute(input);
