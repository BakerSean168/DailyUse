/**
 * Get User Settings
 *
 * 获取用户设置用例
 */

import type { ISettingApiClient } from '@dailyuse/infrastructure-client';
import type { UserSettingClientDTO } from '@dailyuse/contracts/setting';
import { SettingContainer } from '@dailyuse/infrastructure-client';

/**
 * Get User Settings
 */
export class GetUserSettings {
  private static instance: GetUserSettings;

  private constructor(private readonly apiClient: ISettingApiClient) {}

  static createInstance(apiClient?: ISettingApiClient): GetUserSettings {
    const container = SettingContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetUserSettings.instance = new GetUserSettings(client);
    return GetUserSettings.instance;
  }

  static getInstance(): GetUserSettings {
    if (!GetUserSettings.instance) {
      GetUserSettings.instance = GetUserSettings.createInstance();
    }
    return GetUserSettings.instance;
  }

  static resetInstance(): void {
    GetUserSettings.instance = undefined as unknown as GetUserSettings;
  }

  async execute(): Promise<UserSettingClientDTO> {
    return this.apiClient.getUserSettings();
  }
}

export const getUserSettings = (): Promise<UserSettingClientDTO> =>
  GetUserSettings.getInstance().execute();
