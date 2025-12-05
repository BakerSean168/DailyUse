/**
 * Update Locale
 *
 * 更新语言区域设置用例
 */

import type { ISettingApiClient } from '@dailyuse/infrastructure-client';
import type { UserSettingClientDTO, UpdateLocaleRequest } from '@dailyuse/contracts/setting';
import { SettingContainer } from '@dailyuse/infrastructure-client';

/**
 * Update Locale Input
 */
export type UpdateLocaleInput = UpdateLocaleRequest;

/**
 * Update Locale
 */
export class UpdateLocale {
  private static instance: UpdateLocale;

  private constructor(private readonly apiClient: ISettingApiClient) {}

  static createInstance(apiClient?: ISettingApiClient): UpdateLocale {
    const container = SettingContainer.getInstance();
    const client = apiClient || container.getApiClient();
    UpdateLocale.instance = new UpdateLocale(client);
    return UpdateLocale.instance;
  }

  static getInstance(): UpdateLocale {
    if (!UpdateLocale.instance) {
      UpdateLocale.instance = UpdateLocale.createInstance();
    }
    return UpdateLocale.instance;
  }

  static resetInstance(): void {
    UpdateLocale.instance = undefined as unknown as UpdateLocale;
  }

  async execute(input: UpdateLocaleInput): Promise<UserSettingClientDTO> {
    return this.apiClient.updateLocale(input);
  }
}

export const updateLocale = (input: UpdateLocaleInput): Promise<UserSettingClientDTO> =>
  UpdateLocale.getInstance().execute(input);
