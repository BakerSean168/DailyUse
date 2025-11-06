/**
 * 通知设置值对象
 */
export class NotificationSettings {
  constructor(
    public readonly email: boolean,
    public readonly push: boolean,
    public readonly inApp: boolean,
    public readonly sound: boolean,
  ) {}

  static createDefault(): NotificationSettings {
    return new NotificationSettings(true, true, true, true);
  }

  static fromJSON(data: any): NotificationSettings {
    return new NotificationSettings(
      data.email ?? true,
      data.push ?? true,
      data.inApp ?? true,
      data.sound ?? true,
    );
  }

  toJSON(): Record<string, any> {
    return {
      email: this.email,
      push: this.push,
      inApp: this.inApp,
      sound: this.sound,
    };
  }

  equals(other: NotificationSettings): boolean {
    return (
      this.email === other.email &&
      this.push === other.push &&
      this.inApp === other.inApp &&
      this.sound === other.sound
    );
  }
}
