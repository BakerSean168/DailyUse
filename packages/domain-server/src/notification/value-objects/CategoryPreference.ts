/**
 * CategoryPreference 值对象
 * 分类偏好 - 不可变值对象
 */

import type { NotificationContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type ICategoryPreference = NotificationContracts.CategoryPreferenceServerDTO;
type CategoryPreferencePersistenceDTO = NotificationContracts.CategoryPreferencePersistenceDTO;
type CategoryPreferenceClientDTO = NotificationContracts.CategoryPreferenceClientDTO;
type ImportanceLevel = NotificationContracts.ImportanceLevel;
type ChannelPreference = NotificationContracts.ChannelPreference;

/**
 * CategoryPreference 值对象
 */
export class CategoryPreference extends ValueObject implements ICategoryPreference {
  public readonly enabled: boolean;
  public readonly channels: ChannelPreference;
  public readonly importance: ImportanceLevel[];

  constructor(params: {
    enabled: boolean;
    channels: ChannelPreference;
    importance: ImportanceLevel[];
  }) {
    super();

    this.enabled = params.enabled;
    this.channels = { ...params.channels }; // 深拷贝
    this.importance = [...params.importance]; // 复制数组

    // 确保不可变
    Object.freeze(this);
    Object.freeze(this.channels);
    Object.freeze(this.importance);
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      enabled: boolean;
      channels: ChannelPreference;
      importance: ImportanceLevel[];
    }>,
  ): CategoryPreference {
    return new CategoryPreference({
      enabled: changes.enabled ?? this.enabled,
      channels: changes.channels ?? this.channels,
      importance: changes.importance ?? this.importance,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof CategoryPreference)) {
      return false;
    }

    return (
      this.enabled === other.enabled &&
      this.channels.inApp === other.channels.inApp &&
      this.channels.email === other.channels.email &&
      this.channels.push === other.channels.push &&
      this.channels.sms === other.channels.sms &&
      this.importance.length === other.importance.length &&
      this.importance.every((level, index) => level === other.importance[index])
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): ICategoryPreference {
    return {
      enabled: this.enabled,
      channels: { ...this.channels },
      importance: [...this.importance],
    };
  }

  public toClientDTO(): CategoryPreferenceClientDTO {
    const enabledChannels = Object.entries(this.channels).filter(([_, enabled]) => enabled);
    return {
      enabled: this.enabled,
      channels: { ...this.channels },
      importance: [...this.importance],
      enabledChannelsCount: enabledChannels.length,
      enabledChannelsList: enabledChannels.map(([name]) => name),
      importanceText: this.importance.join(', '),
    };
  }

  public toPersistenceDTO(): CategoryPreferencePersistenceDTO {
    return {
      enabled: this.enabled,
      channels: JSON.stringify(this.channels),
      importance: JSON.stringify(this.importance),
    };
  }

  public toContract(): ICategoryPreference {
    return this.toServerDTO();
  }

  public static fromServerDTO(dto: ICategoryPreference): CategoryPreference {
    return new CategoryPreference(dto);
  }

  public static fromContract(preference: ICategoryPreference): CategoryPreference {
    return CategoryPreference.fromServerDTO(preference);
  }

  /**
   * 创建默认偏好
   */
  public static createDefault(): CategoryPreference {
    return new CategoryPreference({
      enabled: true,
      channels: {
        inApp: true,
        email: false,
        push: false,
        sms: false,
      },
      importance: [],
    });
  }
}
