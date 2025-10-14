/**
 * TaskTemplateHistory 实体实现 (Server)
 * 任务模板历史记录 - 实体
 */

import type { TaskContracts } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';

type ITaskTemplateHistory = TaskContracts.TaskTemplateHistoryServer;
type TaskTemplateHistoryServerDTO = TaskContracts.TaskTemplateHistoryServerDTO;
type TaskTemplateHistoryClientDTO = TaskContracts.TaskTemplateHistoryClientDTO;
type TaskTemplateHistoryPersistenceDTO = TaskContracts.TaskTemplateHistoryPersistenceDTO;

/**
 * TaskTemplateHistory 实体
 *
 * DDD 实体特点：
 * - 有唯一标识符（uuid）
 * - 有生命周期
 * - 可变性
 */
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
    super(params.uuid ?? Entity.generateUUID());
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

  /**
   * DTO 转换
   */
  public toServerDTO(): TaskTemplateHistoryServerDTO {
    return {
      uuid: this.uuid,
      templateUuid: this._templateUuid,
      action: this._action,
      changes: this._changes,
      createdAt: this._createdAt,
    };
  }

  public toClientDTO(): TaskTemplateHistoryClientDTO {
    return {
      uuid: this.uuid,
      templateUuid: this._templateUuid,
      action: this._action,
      changes: this._changes,
      createdAt: this._createdAt,
      actionText: this.getActionText(),
      formattedCreatedAt: this.getFormattedCreatedAt(),
      hasChanges: this._changes !== null && Object.keys(this._changes).length > 0,
      changesSummary: this.getChangesSummary(),
    };
  }

  public toPersistenceDTO(): TaskTemplateHistoryPersistenceDTO {
    return {
      uuid: this.uuid,
      template_uuid: this._templateUuid,
      action: this._action,
      changes: this._changes ? JSON.stringify(this._changes) : null,
      created_at: this._createdAt,
    };
  }

  /**
   * 静态工厂方法
   */
  public static create(params: {
    templateUuid: string;
    action: string;
    changes?: any | null;
  }): TaskTemplateHistory {
    return new TaskTemplateHistory({
      templateUuid: params.templateUuid,
      action: params.action,
      changes: params.changes,
      createdAt: Date.now(),
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

  public static fromPersistenceDTO(dto: TaskTemplateHistoryPersistenceDTO): TaskTemplateHistory {
    return new TaskTemplateHistory({
      uuid: dto.uuid,
      templateUuid: dto.template_uuid,
      action: dto.action,
      changes: dto.changes ? JSON.parse(dto.changes) : null,
      createdAt: dto.created_at,
    });
  }

  /**
   * 辅助方法（用于 ClientDTO）
   */
  private getActionText(): string {
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

  private getFormattedCreatedAt(): string {
    return new Date(this._createdAt).toLocaleString('zh-CN');
  }

  private getChangesSummary(): string | null {
    if (!this._changes || Object.keys(this._changes).length === 0) {
      return null;
    }

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
}
