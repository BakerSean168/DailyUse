/**
 * SyncConfig 值对象实现
 * 实现 SyncConfigServer 接口
 */

import type {
  SyncConfigClientDTO,
  SyncConfigServer,
  SyncConfigServerDTO,
} from '@dailyuse/contracts/setting';

/**
 * SyncConfig 值对象
 * 不可变的同步配置
 */
export class SyncConfig implements SyncConfigServer {
  public readonly enabled: boolean;
  public readonly syncToCloud: boolean;
  public readonly syncToDevices: boolean;

  private constructor(params: { enabled: boolean; syncToCloud: boolean; syncToDevices: boolean }) {
    this.enabled = params.enabled;
    this.syncToCloud = params.syncToCloud;
    this.syncToDevices = params.syncToDevices;
  }

  /**
   * 创建新的 SyncConfig
   */
  public static create(params: {
    enabled?: boolean;
    syncToCloud?: boolean;
    syncToDevices?: boolean;
  }): SyncConfig {
    return new SyncConfig({
      enabled: params.enabled ?? false,
      syncToCloud: params.syncToCloud ?? false,
      syncToDevices: params.syncToDevices ?? false,
    });
  }

  /**
   * 从 ServerDTO 创建
   */
  public static fromServerDTO(dto: SyncConfigServerDTO): SyncConfig {
    return new SyncConfig(dto);
  }

  /**
   * 检查是否启用同步
   */
  public isSyncEnabled(): boolean {
    return this.enabled && (this.syncToCloud || this.syncToDevices);
  }

  /**
   * 转换为 ServerDTO
   */
  public toServerDTO(): SyncConfigServerDTO {
    return {
      enabled: this.enabled,
      syncToCloud: this.syncToCloud,
      syncToDevices: this.syncToDevices,
    };
  }

  public toClientDTO(): SyncConfigClientDTO {
    return {
      enabled: this.enabled,
      syncToCloud: this.syncToCloud,
      syncToDevices: this.syncToDevices,
    };
  }
}
