/**
 * 语言和地区设置值对象
 */
export class LocaleSettings {
  constructor(
    public readonly language: string,
    public readonly timezone: string,
    public readonly dateFormat: string,
    public readonly timeFormat: '12H' | '24H',
    public readonly weekStartsOn: number,
    public readonly currency: string,
  ) {
    this.validate();
  }

  private validate(): void {
    // 验证时间格式
    if (!['12H', '24H'].includes(this.timeFormat)) {
      throw new Error(`Invalid time format: ${this.timeFormat}`);
    }

    // 验证星期开始日（0=周日, 1=周一, ..., 6=周六）
    if (this.weekStartsOn < 0 || this.weekStartsOn > 6) {
      throw new Error(`Invalid week start day: ${this.weekStartsOn}`);
    }
  }

  static createDefault(): LocaleSettings {
    return new LocaleSettings(
      'zh-CN',
      'Asia/Shanghai',
      'YYYY-MM-DD',
      '24H',
      1,
      'CNY',
    );
  }

  static fromJSON(data: any): LocaleSettings {
    return new LocaleSettings(
      data.language || 'zh-CN',
      data.timezone || 'Asia/Shanghai',
      data.dateFormat || 'YYYY-MM-DD',
      data.timeFormat || '24H',
      data.weekStartsOn ?? 1,
      data.currency || 'CNY',
    );
  }

  toJSON(): Record<string, any> {
    return {
      language: this.language,
      timezone: this.timezone,
      dateFormat: this.dateFormat,
      timeFormat: this.timeFormat,
      weekStartsOn: this.weekStartsOn,
      currency: this.currency,
    };
  }

  equals(other: LocaleSettings): boolean {
    return (
      this.language === other.language &&
      this.timezone === other.timezone &&
      this.dateFormat === other.dateFormat &&
      this.timeFormat === other.timeFormat &&
      this.weekStartsOn === other.weekStartsOn &&
      this.currency === other.currency
    );
  }
}
