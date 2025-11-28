/**
 * GroupStats 值对象实现 (分组统计信息)
 */

import type { GroupStatsClientDTO, GroupStatsServerDTO, IGroupStatsClient } from '@dailyuse/contracts/reminder';

export class GroupStats implements GroupStats {
  private readonly dto: GroupStatsDTO;

  private constructor(dto: GroupStatsDTO) {
    this.dto = dto;
  }

  get totalTemplates(): number { return this.dto.totalTemplates; }
  get activeTemplates(): number { return this.dto.activeTemplates; }
  get pausedTemplates(): number { return this.dto.pausedTemplates; }
  get selfEnabledTemplates(): number { return this.dto.selfEnabledTemplates; }
  get selfPausedTemplates(): number { return this.dto.selfPausedTemplates; }
  get templateCountText(): string { return this.dto.templateCountText; }
  get activeStatusText(): string { return this.dto.activeStatusText; }

  public equals(other: IGroupStats): boolean {
    return JSON.stringify(this.dto) === JSON.stringify((other as GroupStats).dto);
  }

  public toDTO(): GroupStatsDTO {
    return this.dto;
  }

  public toClientDTO(): GroupStatsDTO {
    return this.dto;
  }

  public toServerDTO(): GroupStatsServerDTO {
    return {
      totalTemplates: this.dto.totalTemplates,
      activeTemplates: this.dto.activeTemplates,
      pausedTemplates: this.dto.pausedTemplates,
      selfEnabledTemplates: this.dto.selfEnabledTemplates,
      selfPausedTemplates: this.dto.selfPausedTemplates,
    };
  }

  public static fromDTO(dto: GroupStatsDTO): GroupStats {
    return new GroupStats(dto);
  }

  public static fromClientDTO(dto: GroupStatsDTO): GroupStats {
    return new GroupStats(dto);
  }

  public static fromServerDTO(dto: GroupStatsServerDTO): GroupStats {
    const clientDTO: GroupStatsDTO = {
      ...dto,
      templateCountText: `${dto.totalTemplates} 个提醒`,
      activeStatusText: `${dto.activeTemplates} 个活跃`,
    };
    return new GroupStats(clientDTO);
  }
}
