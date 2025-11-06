/**
 * 隐私设置值对象
 */
export class PrivacySettings {
  constructor(
    public readonly profileVisibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE',
    public readonly showOnlineStatus: boolean,
    public readonly allowSearchByEmail: boolean,
    public readonly allowSearchByPhone: boolean,
    public readonly shareUsageData: boolean,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!['PUBLIC', 'FRIENDS', 'PRIVATE'].includes(this.profileVisibility)) {
      throw new Error(`Invalid profile visibility: ${this.profileVisibility}`);
    }
  }

  static createDefault(): PrivacySettings {
    return new PrivacySettings('PRIVATE', true, true, false, false);
  }

  static fromJSON(data: any): PrivacySettings {
    return new PrivacySettings(
      data.profileVisibility || 'PRIVATE',
      data.showOnlineStatus ?? true,
      data.allowSearchByEmail ?? true,
      data.allowSearchByPhone ?? false,
      data.shareUsageData ?? false,
    );
  }

  toJSON(): Record<string, any> {
    return {
      profileVisibility: this.profileVisibility,
      showOnlineStatus: this.showOnlineStatus,
      allowSearchByEmail: this.allowSearchByEmail,
      allowSearchByPhone: this.allowSearchByPhone,
      shareUsageData: this.shareUsageData,
    };
  }

  equals(other: PrivacySettings): boolean {
    return (
      this.profileVisibility === other.profileVisibility &&
      this.showOnlineStatus === other.showOnlineStatus &&
      this.allowSearchByEmail === other.allowSearchByEmail &&
      this.allowSearchByPhone === other.allowSearchByPhone &&
      this.shareUsageData === other.shareUsageData
    );
  }
}
