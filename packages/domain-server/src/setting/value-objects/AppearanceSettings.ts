/**
 * 外观设置值对象
 * 封装所有与外观相关的配置
 */
export class AppearanceSettings {
  constructor(
    public readonly theme: 'AUTO' | 'LIGHT' | 'DARK',
    public readonly accentColor: string,
    public readonly fontSize: 'SMALL' | 'MEDIUM' | 'LARGE',
    public readonly fontFamily: string | null,
    public readonly compactMode: boolean,
  ) {
    this.validate();
  }

  private validate(): void {
    // 验证主题
    if (!['AUTO', 'LIGHT', 'DARK'].includes(this.theme)) {
      throw new Error(`Invalid theme: ${this.theme}`);
    }

    // 验证强调色格式（简单的 hex 颜色验证）
    if (!/^#[0-9A-F]{6}$/i.test(this.accentColor)) {
      throw new Error(`Invalid accent color format: ${this.accentColor}`);
    }

    // 验证字体大小
    if (!['SMALL', 'MEDIUM', 'LARGE'].includes(this.fontSize)) {
      throw new Error(`Invalid font size: ${this.fontSize}`);
    }
  }

  /**
   * 创建默认外观设置
   */
  static createDefault(): AppearanceSettings {
    return new AppearanceSettings('AUTO', '#3B82F6', 'MEDIUM', null, false);
  }

  /**
   * 从 JSON 对象创建
   */
  static fromJSON(data: any): AppearanceSettings {
    return new AppearanceSettings(
      data.theme || 'AUTO',
      data.accentColor || '#3B82F6',
      data.fontSize || 'MEDIUM',
      data.fontFamily || null,
      data.compactMode || false,
    );
  }

  /**
   * 转换为 JSON 对象
   */
  toJSON(): Record<string, any> {
    return {
      theme: this.theme,
      accentColor: this.accentColor,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      compactMode: this.compactMode,
    };
  }

  /**
   * 值对象相等性比较
   */
  equals(other: AppearanceSettings): boolean {
    return (
      this.theme === other.theme &&
      this.accentColor === other.accentColor &&
      this.fontSize === other.fontSize &&
      this.fontFamily === other.fontFamily &&
      this.compactMode === other.compactMode
    );
  }
}
