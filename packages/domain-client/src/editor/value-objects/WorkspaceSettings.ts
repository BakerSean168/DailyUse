/**
 * WorkspaceSettings 值对象
 * 工作区设置 - 客户端值对象
 */

import type { IWorkspaceSettingsClient, WorkspaceSettingsClientDTO, WorkspaceSettingsServerDTO } from '@dailyuse/contracts/editor';
import { ValueObject } from '@dailyuse/utils';

/**
 * WorkspaceSettings 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class WorkspaceSettings extends ValueObject implements IWorkspaceSettingsClient {
  public readonly theme: string;
  public readonly fontSize: number;
  public readonly fontFamily: string;
  public readonly lineHeight: number;
  public readonly tabSize: number;
  public readonly wordWrap: boolean;
  public readonly lineNumbers: boolean;
  public readonly minimap: boolean;
  public readonly autoSave: {
    enabled: boolean;
    interval: number;
  };

  constructor(params: {
    theme: string;
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    tabSize: number;
    wordWrap: boolean;
    lineNumbers: boolean;
    minimap: boolean;
    autoSave: {
      enabled: boolean;
      interval: number;
    };
  }) {
    super();

    this.theme = params.theme;
    this.fontSize = params.fontSize;
    this.fontFamily = params.fontFamily;
    this.lineHeight = params.lineHeight;
    this.tabSize = params.tabSize;
    this.wordWrap = params.wordWrap;
    this.lineNumbers = params.lineNumbers;
    this.minimap = params.minimap;
    this.autoSave = { ...params.autoSave };

    // 确保不可变
    Object.freeze(this);
    Object.freeze(this.autoSave);
  }

  // UI 辅助属性
  public get autoSaveFormatted(): string {
    if (!this.autoSave.enabled) {
      return '已禁用';
    }
    const interval = this.autoSave.interval;
    if (interval < 60) {
      return `每 ${interval} 秒`;
    }
    const minutes = Math.floor(interval / 60);
    return `每 ${minutes} 分钟`;
  }

  /**
   * 值相等性比较
   */
  public override equals(other: ValueObject): boolean {
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
      this.autoSave.enabled === other.autoSave.enabled &&
      this.autoSave.interval === other.autoSave.interval
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
      autoSave: { ...this.autoSave },
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): WorkspaceSettingsClientDTO {
    return {
      theme: this.theme,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      lineHeight: this.lineHeight,
      tabSize: this.tabSize,
      wordWrap: this.wordWrap,
      lineNumbers: this.lineNumbers,
      minimap: this.minimap,
      autoSave: { ...this.autoSave },
      autoSaveFormatted: this.autoSaveFormatted,
    };
  }

  /**
   * 从 Server DTO 创建
   */
  public static fromServerDTO(dto: WorkspaceSettingsServerDTO): WorkspaceSettings {
    return new WorkspaceSettings({
      theme: dto.theme ?? 'default',
      fontSize: dto.fontSize ?? 14,
      fontFamily: dto.fontFamily ?? 'Consolas, "Courier New", monospace',
      lineHeight: dto.lineHeight ?? 1.5,
      tabSize: dto.tabSize ?? 2,
      wordWrap: dto.wordWrap ?? true,
      lineNumbers: dto.lineNumbers ?? true,
      minimap: dto.minimap ?? true,
      autoSave: dto.autoSave ?? { enabled: true, interval: 30 },
    });
  }

  /**
   * 从 Client DTO 创建
   */
  public static fromClientDTO(dto: WorkspaceSettingsClientDTO): WorkspaceSettings {
    return new WorkspaceSettings({
      theme: dto.theme,
      fontSize: dto.fontSize,
      fontFamily: dto.fontFamily,
      lineHeight: dto.lineHeight,
      tabSize: dto.tabSize,
      wordWrap: dto.wordWrap,
      lineNumbers: dto.lineNumbers,
      minimap: dto.minimap,
      autoSave: { ...dto.autoSave },
    });
  }

  /**
   * 创建默认设置
   */
  public static createDefault(): WorkspaceSettings {
    return new WorkspaceSettings({
      theme: 'default',
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      lineHeight: 1.5,
      tabSize: 2,
      wordWrap: true,
      lineNumbers: true,
      minimap: true,
      autoSave: { enabled: true, interval: 30 },
    });
  }
}
