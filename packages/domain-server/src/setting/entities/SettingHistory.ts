/**
 * SettingHistory 实体实现
 * 实现 SettingHistoryServer 接口
 */

import { Entity, generateUUID } from '@dailyuse/utils';
import type {
  SettingHistoryClientDTO,
  SettingHistoryPersistenceDTO,
  SettingHistoryServer,
  SettingHistoryServerDTO,
} from '@dailyuse/contracts/setting';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * SettingHistory 实体
 * 设置变更历史记录
 */
export class SettingHistory extends Entity implements SettingHistoryServer {
  public readonly settingUuid: string;
  public readonly settingKey: string;
  public readonly oldValue: any;
  public readonly newValue: any;
  public readonly operatorUuid?: string | null;
  public readonly operatorType: 'USER' | 'SYSTEM' | 'API';
  public readonly createdAt: number;

  private constructor(params: {
    uuid?: string;
    settingUuid: string;
    settingKey: string;
    oldValue: any;
    newValue: any;
    operatorUuid?: string | null;
    operatorType: 'USER' | 'SYSTEM' | 'API';
    createdAt: number;
  }) {
    super(params.uuid ?? generateUUID());
    this.settingUuid = params.settingUuid;
    this.settingKey = params.settingKey;
    this.oldValue = params.oldValue;
    this.newValue = params.newValue;
    this.operatorUuid = params.operatorUuid ?? null;
    this.operatorType = params.operatorType;
    this.createdAt = params.createdAt;
  }

  // ============ Helper Methods for Client DTO ============

  private getTimeAgo(): string {
    return formatDistanceToNow(new Date(this.createdAt), {
      addSuffix: true,
      locale: zhCN,
    });
  }

  private getChangeText(): string {
    const formatValue = (value: any): string => {
      if (value === null || value === undefined) return '空';
      if (typeof value === 'boolean') return value ? '是' : '否';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    };

    const oldStr = formatValue(this.oldValue);
    const newStr = formatValue(this.newValue);

    return `从 "${oldStr}" 变更为 "${newStr}"`;
  }

  /**
   * 创建新的 SettingHistory
   */
  public static create(params: {
    settingUuid: string;
    settingKey: string;
    oldValue: any;
    newValue: any;
    operatorUuid?: string;
    operatorType: 'USER' | 'SYSTEM' | 'API';
  }): SettingHistory {
    if (!params.settingUuid) {
      throw new Error('SettingUuid is required');
    }
    if (!params.settingKey) {
      throw new Error('SettingKey is required');
    }

    return new SettingHistory({
      settingUuid: params.settingUuid,
      settingKey: params.settingKey,
      oldValue: params.oldValue,
      newValue: params.newValue,
      operatorUuid: params.operatorUuid,
      operatorType: params.operatorType,
      createdAt: Date.now(),
    });
  }

  /**
   * 从 ServerDTO 重建
   */
  public static fromServerDTO(dto: SettingHistoryServerDTO): SettingHistory {
    return new SettingHistory({
      uuid: dto.uuid,
      settingUuid: dto.settingUuid,
      settingKey: dto.settingKey,
      oldValue: dto.oldValue,
      newValue: dto.newValue,
      operatorUuid: dto.operatorUuid,
      operatorType: dto.operatorType,
      createdAt: dto.createdAt,
    });
  }

  /**
   * 从 PersistenceDTO 重建
   */
  public static fromPersistenceDTO(dto: SettingHistoryPersistenceDTO): SettingHistory {
    return new SettingHistory({
      uuid: dto.uuid,
      settingUuid: dto.settingUuid,
      settingKey: dto.settingKey,
      oldValue: JSON.parse(dto.oldValue),
      newValue: JSON.parse(dto.newValue),
      operatorUuid: dto.operatorUuid,
      operatorType: dto.operatorType,
      createdAt: dto.createdAt,
    });
  }

  /**
   * 转换为 ServerDTO
   */
  public toServerDTO(): SettingHistoryServerDTO {
    return {
      uuid: this.uuid,
      settingUuid: this.settingUuid,
      settingKey: this.settingKey,
      oldValue: this.oldValue,
      newValue: this.newValue,
      operatorUuid: this.operatorUuid,
      operatorType: this.operatorType,
      createdAt: this.createdAt,
    };
  }

  public toClientDTO(): SettingHistoryClientDTO {
    return {
      uuid: this.uuid,
      settingUuid: this.settingUuid,
      settingKey: this.settingKey,
      oldValue: this.oldValue,
      newValue: this.newValue,
      operatorUuid: this.operatorUuid,
      operatorType: this.operatorType,
      createdAt: this.createdAt,
      // Computed properties
      timeAgo: this.getTimeAgo(),
      changeText: this.getChangeText(),
    };
  }

  /**
   * 转换为 PersistenceDTO
   */
  public toPersistenceDTO(): SettingHistoryPersistenceDTO {
    return {
      uuid: this.uuid,
      settingUuid: this.settingUuid,
      settingKey: this.settingKey,
      oldValue: JSON.stringify(this.oldValue),
      newValue: JSON.stringify(this.newValue),
      operatorUuid: this.operatorUuid,
      operatorType: this.operatorType,
      createdAt: this.createdAt,
    };
  }
}
