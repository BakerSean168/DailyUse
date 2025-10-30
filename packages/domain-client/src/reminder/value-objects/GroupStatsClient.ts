/**
 * GroupStats 值对象实现 (Client)
 */

import { ReminderContracts } from '@dailyuse/contracts';

type GroupStatsClientDTO = ReminderContracts.GroupStatsClientDTO;
type GroupStatsServerDTO = ReminderContracts.GroupStatsServerDTO;

export class GroupStatsClient implements ReminderContracts.GroupStatsClient {
  private readonly dto: GroupStatsClientDTO;

  private constructor(dto: GroupStatsClientDTO) {
    this.dto = dto;
  }

  get totalTemplates(): number { return this.dto.totalTemplates; }
  get activeTemplates(): number { return this.dto.activeTemplates; }
  get pausedTemplates(): number { return this.dto.pausedTemplates; }
  get selfEnabledTemplates(): number { return this.dto.selfEnabledTemplates; }
  get selfPausedTemplates(): number { return this.dto.selfPausedTemplates; }
  get templateCountText(): string { return this.dto.templateCountText; }
  get activeStatusText(): string { return this.dto.activeStatusText; }

  public equals(other: ReminderContracts.GroupStatsClient): boolean {
    return JSON.stringify(this.dto) === JSON.stringify((other as GroupStatsClient).dto);
  }

  public toClientDTO(): GroupStatsClientDTO {
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

  public static fromClientDTO(dto: GroupStatsClientDTO): GroupStatsClient {
    return new GroupStatsClient(dto);
  }

  public static fromServerDTO(dto: GroupStatsServerDTO): GroupStatsClient {
    const clientDTO: GroupStatsClientDTO = {
      ...dto,
      templateCountText: `${dto.totalTemplates} 个提醒`,
      activeStatusText: `${dto.activeTemplates} 个活跃`,
    };
    return new GroupStatsClient(clientDTO);
  }
}
