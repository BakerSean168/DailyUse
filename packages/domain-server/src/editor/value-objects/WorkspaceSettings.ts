/**
 * WorkspaceSettings 值对象
 * 工作区设置 - 不可变值对象
 */

import type {
  IWorkspaceSettingsServer,
  WorkspaceSettingsClientDTO,
  WorkspaceSettingsPersistenceDTO,
  WorkspaceSettingsServerDTO,
} from '@dailyuse/contracts/editor';
import { ValueObject } from '@dailyuse/utils';

/**
 * WorkspaceSettings 值对象
 */
export class WorkspaceSettings extends ValueObject implements WorkspaceSettings {
  public readonly theme: string | null;
  public readonly fontSize: number | null;
  public readonly fontFamily: string | null;
  public readonly lineHeight: number | null;
  public readonly tabSize: number | null;
  public readonly wordWrap: boolean | null;
  public readonly lineNumbers: boolean | null;
  public readonly minimap: boolean | null;
  public readonly autoSave: { enabled: boolean; interval: number } | null;

  constructor(params: {
    theme?: string | null;
    fontSize?: number | null;
    fontFamily?: string | null;
    lineHeight?: number | null;
    tabSize?: number | null;
    wordWrap?: boolean | null;
    lineNumbers?: boolean | null;
    minimap?: boolean | null;
    autoSave?: { enabled: boolean; interval: number } | null;
  }) {
    super();

    this.theme = params.theme ?? null;
    this.fontSize = params.fontSize ?? null;
    this.fontFamily = params.fontFamily ?? null;
    this.lineHeight = params.lineHeight ?? null;
    this.tabSize = params.tabSize ?? null;
    this.wordWrap = params.wordWrap ?? null;
    this.lineNumbers = params.lineNumbers ?? null;
    this.minimap = params.minimap ?? null;
    this.autoSave = params.autoSave ? { ...params.autoSave } : null;

    // 确保不可变
    Object.freeze(this);
    if (this.autoSave) {
      Object.freeze(this.autoSave);
    }
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      theme: string | null;
      fontSize: number | null;
      fontFamily: string | null;
      lineHeight: number | null;
      tabSize: number | null;
      wordWrap: boolean | null;
      lineNumbers: boolean | null;
      minimap: boolean | null;
      autoSave: { enabled: boolean; interval: number } | null;
    }>,
  ): WorkspaceSettings {
    return new WorkspaceSettings({
      theme: changes.theme !== undefined ? changes.theme : this.theme,
      fontSize: changes.fontSize !== undefined ? changes.fontSize : this.fontSize,
      fontFamily: changes.fontFamily !== undefined ? changes.fontFamily : this.fontFamily,
      lineHeight: changes.lineHeight !== undefined ? changes.lineHeight : this.lineHeight,
      tabSize: changes.tabSize !== undefined ? changes.tabSize : this.tabSize,
      wordWrap: changes.wordWrap !== undefined ? changes.wordWrap : this.wordWrap,
      lineNumbers: changes.lineNumbers !== undefined ? changes.lineNumbers : this.lineNumbers,
      minimap: changes.minimap !== undefined ? changes.minimap : this.minimap,
      autoSave: changes.autoSave !== undefined ? changes.autoSave : this.autoSave,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: IWorkspaceSettingsServer): boolean {
    if (!(other instanceof WorkspaceSettings)) {
      return false;
    }

    return (
      this.theme === other.theme &&
      this.fontSize === other.fontSize &&
      this.fontFamily === other.fontFamily &&
      this.lineHeight === other.lineHeight &&
      this.tabSize === other.tabSize &&
      this.wordWrap === other.wordWrap &&
      this.lineNumbers === other.lineNumbers &&
      this.minimap === other.minimap &&
      JSON.stringify(this.autoSave) === JSON.stringify(other.autoSave)
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): WorkspaceSettingsServerDTO {
    return {
      theme: this.theme,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      lineHeight: this.lineHeight,
      tabSize: this.tabSize,
      wordWrap: this.wordWrap,
      lineNumbers: this.lineNumbers,
      minimap: this.minimap,
      autoSave: this.autoSave ? { ...this.autoSave } : null,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): WorkspaceSettingsClientDTO {
    return {
      theme: this.theme ?? 'light',
      fontSize: this.fontSize ?? 14,
      fontFamily: this.fontFamily ?? 'Consolas, Monaco, monospace',
      lineHeight: this.lineHeight ?? 1.5,
      tabSize: this.tabSize ?? 2,
      wordWrap: this.wordWrap ?? true,
      lineNumbers: this.lineNumbers ?? true,
      minimap: this.minimap ?? true,
      autoSave: this.autoSave ?? { enabled: true, interval: 5000 },
      autoSaveFormatted: this.autoSave ? `每 ${this.autoSave.interval / 1000} 秒` : '已禁用',
    };
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): WorkspaceSettingsPersistenceDTO {
    return {
      theme: this.theme,
      font_size: this.fontSize,
      font_family: this.fontFamily,
      line_height: this.lineHeight,
      tab_size: this.tabSize,
      word_wrap: this.wordWrap,
      line_numbers: this.lineNumbers,
      minimap: this.minimap,
      auto_save: this.autoSave ? JSON.stringify(this.autoSave) : null,
    };
  }

  /**
   * 从 Server DTO 创建实例
   */
  public static fromServerDTO(dto: WorkspaceSettingsServerDTO): WorkspaceSettings {
    return new WorkspaceSettings({
      theme: dto.theme,
      fontSize: dto.fontSize,
      fontFamily: dto.fontFamily,
      lineHeight: dto.lineHeight,
      tabSize: dto.tabSize,
      wordWrap: dto.wordWrap,
      lineNumbers: dto.lineNumbers,
      minimap: dto.minimap,
      autoSave: dto.autoSave,
    });
  }

  /**
   * 从 Persistence DTO 创建实例
   */
  public static fromPersistenceDTO(dto: WorkspaceSettingsPersistenceDTO): WorkspaceSettings {
    return new WorkspaceSettings({
      theme: dto.theme,
      fontSize: dto.font_size,
      fontFamily: dto.font_family,
      lineHeight: dto.line_height,
      tabSize: dto.tab_size,
      wordWrap: dto.word_wrap,
      lineNumbers: dto.line_numbers,
      minimap: dto.minimap,
      autoSave: dto.auto_save ? JSON.parse(dto.auto_save) : null,
    });
  }

  /**
   * 创建默认实例
   */
  public static createDefault(): WorkspaceSettings {
    return new WorkspaceSettings({
      theme: 'light',
      fontSize: 14,
      fontFamily: 'Consolas, Monaco, monospace',
      lineHeight: 1.5,
      tabSize: 2,
      wordWrap: true,
      lineNumbers: true,
      minimap: true,
      autoSave: { enabled: true, interval: 5000 },
    });
  }
}
