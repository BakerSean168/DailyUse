/**
 * Get User Setting
 *
 * 获取用户设置（如果不存在则创建默认设置）
 */

import type { IUserSettingRepository } from '@dailyuse/domain-server/setting';
import { UserSetting } from '@dailyuse/domain-server/setting';
import type { UserSettingClientDTO } from '@dailyuse/contracts/setting';
import { SettingContainer } from '@dailyuse/infrastructure-server';

/**
 * Get User Setting Input
 */
export interface GetUserSettingInput {
  accountUuid: string;
}

/**
 * Get User Setting Output
 */
export interface GetUserSettingOutput {
  setting: UserSettingClientDTO;
}

/**
 * Get User Setting
 */
export class GetUserSetting {
  private static instance: GetUserSetting;

  private constructor(private readonly userSettingRepository: IUserSettingRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(userSettingRepository?: IUserSettingRepository): GetUserSetting {
    const container = SettingContainer.getInstance();
    const repo = userSettingRepository || container.getUserSettingRepository();
    GetUserSetting.instance = new GetUserSetting(repo);
    return GetUserSetting.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetUserSetting {
    if (!GetUserSetting.instance) {
      GetUserSetting.instance = GetUserSetting.createInstance();
    }
    return GetUserSetting.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetUserSetting.instance = undefined as unknown as GetUserSetting;
  }

  /**
   * 执行用例
   */
  async execute(input: GetUserSettingInput): Promise<GetUserSettingOutput> {
    const { accountUuid } = input;

    let setting = await this.userSettingRepository.findByAccountUuid(accountUuid);

    if (!setting) {
      setting = UserSetting.create({ accountUuid });
      await this.userSettingRepository.save(setting);
    }

    return { setting: setting.toClientDTO() };
  }
}

/**
 * 便捷函数
 */
export const getUserSetting = (input: GetUserSettingInput): Promise<GetUserSettingOutput> =>
  GetUserSetting.getInstance().execute(input);
