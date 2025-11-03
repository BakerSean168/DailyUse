/**
 * GroupStats 值对象实现 ()
 */

import { ReminderContracts } from '@dailyuse/contracts';

type GroupStatsDTO = ReminderContracts.GroupStatsDTO;
type GroupStatsServerDTO = ReminderContracts.GroupStatsServerDTO;

export class GroupStats implements ReminderContracts.GroupStats {
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

  public equals(other: ReminderContracts.GroupStats): boolean {
    return JSON.stringify(this.dto) === JSON.stringify((other as GroupStats).dto);
  }

  public toDTO(): GroupStatsDTO {
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

  public static fromServerDTO(dto: GroupStatsServerDTO): GroupStats {
    const clientDTO: GroupStatsDTO = {
      ...dto,
      templateCountText: `${dto.totalTemplates} 个提醒`,
      activeStatusText: `${dto.activeTemplates} 个活跃`,
    };
    return new GroupStats(clientDTO);
  }
}
