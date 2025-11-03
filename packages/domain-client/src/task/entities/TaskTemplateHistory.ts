/**
 * TaskTemplateHistory 实体实现 (Client)
 */

import type { TaskContracts } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';

type ITaskTemplateHistory = TaskContracts.TaskTemplateHistory;
type TaskTemplateHistoryDTO = TaskContracts.TaskTemplateHistoryDTO;
type TaskTemplateHistoryServerDTO = TaskContracts.TaskTemplateHistoryServerDTO;

export class TaskTemplateHistory extends Entity implements ITaskTemplateHistory {
  private _templateUuid: string;
  private _action: string;
  private _changes: any | null;
  private _createdAt: number;

  private constructor(params: {
    uuid?: string;
    templateUuid: string;
    action: string;
    changes?: any | null;
    createdAt: number;
  }) {
    super(params.uuid || Entity.generateUUID());
    this._templateUuid = params.templateUuid;
    this._action = params.action;
    this._changes = params.changes ?? null;
    this._createdAt = params.createdAt;
  }

  // Getters
  public override get uuid(): string {
    return this._uuid;
  }
  public get templateUuid(): string {
    return this._templateUuid;
  }
  public get action(): string {
    return this._action;
  }
  public get changes(): any | null {
    return this._changes;
  }
  public get createdAt(): number {
    return this._createdAt;
  }

  // UI 辅助属性
  public get actionText(): string {
    const actionMap: Record<string, string> = {
      created: '创建',
      updated: '更新',
      paused: '暂停',
      resumed: '恢复',
      archived: '归档',
      deleted: '删除',
    };
    return actionMap[this._action] || this._action;
  }

  public get formattedCreatedAt(): string {
    return new Date(this._createdAt).toLocaleString('zh-CN');
  }

  public get hasChanges(): boolean {
    return this._changes !== null && Object.keys(this._changes).length > 0;
  }

  public get changesSummary(): string | null {
    if (!this.hasChanges) return null;

    const changes: string[] = [];
    for (const [key, value] of Object.entries(this._changes)) {
      const keyMap: Record<string, string> = {
        title: '标题',
        description: '描述',
        importance: '重要程度',
        urgency: '紧急程度',
        status: '状态',
        timeConfig: '时间配置',
        recurrenceRule: '重复规则',
        reminderConfig: '提醒配置',
      };
      const displayKey = keyMap[key] || key;
      changes.push(`${displayKey}已变更`);
    }

    return changes.join('、');
  }

  // 实体方法
  public getActionIcon(): string {
    const iconMap: Record<string, string> = {
      created: '➕',
      updated: '✏️',
      paused: '⏸️',
      resumed: '▶️',
      archived: '📦',
      deleted: '🗑️',
    };
    return iconMap[this._action] || '📝';
  }

  public hasSpecificChange(key: string): boolean {
    if (!this.hasChanges) return false;
    return Object.prototype.hasOwnProperty.call(this._changes, key);
  }

  public getDisplayText(): string {
    return `${this.actionText} - ${this.formattedCreatedAt}`;
  }

  public getSummary(): string {
    let summary = this.getDisplayText();
    if (this.changesSummary) {
      summary += ` (${this.changesSummary})`;
    }
    return summary;
  }

  // DTO 转换
  public toClientDTO(): TaskTemplateHistoryDTO {
    return {
      uuid: this.uuid,
      templateUuid: this._templateUuid,
      action: this._action,
      changes: this._changes,
      createdAt: this._createdAt,
      actionText: this.actionText,
      formattedCreatedAt: this.formattedCreatedAt,
      hasChanges: this.hasChanges,
      changesSummary: this.changesSummary,
    };
  }

  public toServerDTO(): TaskTemplateHistoryServerDTO {
    return {
      uuid: this.uuid,
      templateUuid: this._templateUuid,
      action: this._action,
      changes: this._changes,
      createdAt: this._createdAt,
    };
  }

  // 静态工厂方法
  public static fromClientDTO(dto: TaskTemplateHistoryDTO): TaskTemplateHistory {
    return new TaskTemplateHistory({
      uuid: dto.uuid,
      templateUuid: dto.templateUuid,
      action: dto.action,
      changes: dto.changes,
      createdAt: dto.createdAt,
    });
  }

  public static fromServerDTO(dto: TaskTemplateHistoryServerDTO): TaskTemplateHistory {
    return new TaskTemplateHistory({
      uuid: dto.uuid,
      templateUuid: dto.templateUuid,
      action: dto.action,
      changes: dto.changes,
      createdAt: dto.createdAt,
    });
  }

  public clone(): TaskTemplateHistory {
    return TaskTemplateHistory.fromClientDTO(this.toClientDTO());
  }
}
