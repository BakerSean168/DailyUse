/**
 * ActiveTimeConfig 值对象实现 (Client)
 * 
 * 重构说明：
 * - 移除 endDate 字段（生效控制改由 status 字段负责）
 * - startDate 重命名为 activatedAt（语义更清晰）
 * - activatedAt 作为循环提醒的计算基准
 */

import type { IActiveTimeConfigClient, ActiveTimeConfigClientDTO, ActiveTimeConfigServerDTO } from '@dailyuse/contracts/reminder';

export class ActiveTimeConfig implements IActiveTimeConfigClient {
  private readonly _activatedAt: number;
  private readonly _displayText: string;

  private constructor(params: {
    activatedAt: number;
    displayText: string;
  }) {
    this._activatedAt = params.activatedAt;
    this._displayText = params.displayText;
  }

  // ===== Getters =====
  get activatedAt(): number {
    return this._activatedAt;
  }

  get displayText(): string {
    return this._displayText;
  }

  // ===== 业务方法 =====
  public equals(other: IActiveTimeConfigClient): boolean {
    return this._activatedAt === other.activatedAt;
  }

  // ===== DTO 转换方法 =====
  public toClientDTO(): ActiveTimeConfigClientDTO {
    return {
      activatedAt: this._activatedAt,
      displayText: this._displayText,
    };
  }

  public toServerDTO(): ActiveTimeConfigServerDTO {
    return {
      activatedAt: this._activatedAt,
    };
  }

  // ===== 静态工厂方法 =====
  public static fromClientDTO(dto: ActiveTimeConfigClientDTO): ActiveTimeConfig {
    return new ActiveTimeConfig({
      activatedAt: dto.activatedAt,
      displayText: dto.displayText,
    });
  }

  public static fromServerDTO(dto: ActiveTimeConfigServerDTO): ActiveTimeConfig {
    // 生成 displayText
    const activatedAtStr = new Date(dto.activatedAt).toLocaleString('zh-CN');
    const displayText = `启动于 ${activatedAtStr}`;

    return new ActiveTimeConfig({
      activatedAt: dto.activatedAt,
      displayText,
    });
  }
}
