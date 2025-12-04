/**
 * Export Settings
 *
 * 导出用户设置为 JSON 对象
 */

import type { IUserSettingRepository } from '@dailyuse/domain-server/setting';
import { SettingContainer } from '../SettingContainer';

/**
 * Export Settings Input
 */
export interface ExportSettingsInput {
  accountUuid: string;
}

/**
 * Export Settings Output
 */
export interface ExportSettingsOutput {
  data: Record<string, any>;
}

/**
 * Export Settings
 */
export class ExportSettings {
  private static instance: ExportSettings;

  private constructor(private readonly userSettingRepository: IUserSettingRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(userSettingRepository?: IUserSettingRepository): ExportSettings {
    const container = SettingContainer.getInstance();
    const repo = userSettingRepository || container.getUserSettingRepository();
    ExportSettings.instance = new ExportSettings(repo);
    return ExportSettings.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ExportSettings {
    if (!ExportSettings.instance) {
      ExportSettings.instance = ExportSettings.createInstance();
    }
    return ExportSettings.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ExportSettings.instance = undefined as unknown as ExportSettings;
  }

  /**
   * 执行用例
   */
  async execute(input: ExportSettingsInput): Promise<ExportSettingsOutput> {
    const { accountUuid } = input;

    const setting = await this.userSettingRepository.findByAccountUuid(accountUuid);

    if (!setting) {
      throw new Error('User setting not found');
    }

    const dto = setting.toServerDTO();

    return {
      data: {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        accountUuid: accountUuid,
        settings: dto,
      },
    };
  }
}

/**
 * 便捷函数
 */
export const exportSettings = (input: ExportSettingsInput): Promise<ExportSettingsOutput> =>
  ExportSettings.getInstance().execute(input);
