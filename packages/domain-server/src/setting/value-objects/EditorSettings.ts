/**
 * 编辑器设置值对象
 */
export class EditorSettings {
  constructor(
    public readonly theme: string,
    public readonly fontSize: number,
    public readonly tabSize: number,
    public readonly wordWrap: boolean,
    public readonly lineNumbers: boolean,
    public readonly minimap: boolean,
  ) {
    this.validate();
  }

  private validate(): void {
    // 验证字体大小范围
    if (this.fontSize < 8 || this.fontSize > 32) {
      throw new Error(`Font size must be between 8 and 32: ${this.fontSize}`);
    }

    // 验证 Tab 大小范围
    if (this.tabSize < 1 || this.tabSize > 8) {
      throw new Error(`Tab size must be between 1 and 8: ${this.tabSize}`);
    }
  }

  static createDefault(): EditorSettings {
    return new EditorSettings('default', 14, 2, true, true, true);
  }

  static fromJSON(data: any): EditorSettings {
    return new EditorSettings(
      data.theme || 'default',
      data.fontSize ?? 14,
      data.tabSize ?? 2,
      data.wordWrap ?? true,
      data.lineNumbers ?? true,
      data.minimap ?? true,
    );
  }

  toJSON(): Record<string, any> {
    return {
      theme: this.theme,
      fontSize: this.fontSize,
      tabSize: this.tabSize,
      wordWrap: this.wordWrap,
      lineNumbers: this.lineNumbers,
      minimap: this.minimap,
    };
  }

  equals(other: EditorSettings): boolean {
    return (
      this.theme === other.theme &&
      this.fontSize === other.fontSize &&
      this.tabSize === other.tabSize &&
      this.wordWrap === other.wordWrap &&
      this.lineNumbers === other.lineNumbers &&
      this.minimap === other.minimap
    );
  }
}
