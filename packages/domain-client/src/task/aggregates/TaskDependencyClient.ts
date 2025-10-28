/**
 * TaskDependency 聚合根实现 (Client)
 * 任务依赖关系 - 客户端
 */

import type { TaskContracts } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';

type TaskDependencyClientDTO = TaskContracts.TaskDependencyClientDTO;
type TaskDependencyServerDTO = TaskContracts.TaskDependencyServerDTO;
type DependencyType = TaskContracts.DependencyType;

/**
 * TaskDependency 聚合根 (Client)
 */
export class TaskDependencyClient extends AggregateRoot {
  private _predecessorTaskUuid: string;
  private _successorTaskUuid: string;
  private _dependencyType: DependencyType;
  private _lagDays: number | undefined;
  private _createdAt: number;
  private _updatedAt: number;

  private constructor(params: {
    uuid: string;
    predecessorTaskUuid: string;
    successorTaskUuid: string;
    dependencyType: DependencyType;
    lagDays?: number;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid);
    this._predecessorTaskUuid = params.predecessorTaskUuid;
    this._successorTaskUuid = params.successorTaskUuid;
    this._dependencyType = params.dependencyType;
    this._lagDays = params.lagDays;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ========== Getters ==========

  get predecessorTaskUuid(): string {
    return this._predecessorTaskUuid;
  }

  get successorTaskUuid(): string {
    return this._successorTaskUuid;
  }

  get dependencyType(): DependencyType {
    return this._dependencyType;
  }

  get lagDays(): number | undefined {
    return this._lagDays;
  }

  get createdAt(): number {
    return this._createdAt;
  }

  get updatedAt(): number {
    return this._updatedAt;
  }

  // ========== UI 计算属性 ==========

  /**
   * 获取依赖类型文本
   */
  get dependencyTypeText(): string {
    const typeTexts: Record<DependencyType, string> = {
      FINISH_TO_START: '完成后开始',
      START_TO_START: '同时开始',
      FINISH_TO_FINISH: '同时完成',
      START_TO_FINISH: '开始后完成',
    };
    return typeTexts[this._dependencyType] || this._dependencyType;
  }

  /**
   * 获取延迟文本
   */
  get lagDaysText(): string {
    if (this._lagDays === undefined || this._lagDays === 0) {
      return '无延迟';
    }
    return `延迟 ${this._lagDays} 天`;
  }

  /**
   * 获取依赖关系描述
   */
  get dependencyDescription(): string {
    const baseDesc = this.dependencyTypeText;
    if (this._lagDays && this._lagDays > 0) {
      return `${baseDesc}（延迟 ${this._lagDays} 天）`;
    }
    return baseDesc;
  }

  /**
   * 获取创建时间文本
   */
  get createdAtText(): string {
    return new Date(this._createdAt).toLocaleString('zh-CN');
  }

  /**
   * 获取更新时间文本
   */
  get updatedAtText(): string {
    return new Date(this._updatedAt).toLocaleString('zh-CN');
  }

  // ========== UI 业务方法 ==========

  /**
   * 检查是否涉及某个任务
   */
  involvesTasks(taskUuid: string): boolean {
    return this._predecessorTaskUuid === taskUuid || this._successorTaskUuid === taskUuid;
  }

  /**
   * 检查是否是特定任务的前置依赖
   */
  isPredecessorOf(taskUuid: string): boolean {
    return this._successorTaskUuid === taskUuid;
  }

  /**
   * 检查是否是特定任务的后续依赖
   */
  isSuccessorOf(taskUuid: string): boolean {
    return this._predecessorTaskUuid === taskUuid;
  }

  /**
   * 获取依赖类型图标
   */
  getDependencyTypeIcon(): string {
    const icons: Record<DependencyType, string> = {
      FINISH_TO_START: '→',
      START_TO_START: '⇉',
      FINISH_TO_FINISH: '⇄',
      START_TO_FINISH: '⇆',
    };
    return icons[this._dependencyType] || '→';
  }

  /**
   * 获取依赖类型颜色
   */
  getDependencyTypeColor(): string {
    const colors: Record<DependencyType, string> = {
      FINISH_TO_START: '#3B82F6', // 蓝色
      START_TO_START: '#10B981', // 绿色
      FINISH_TO_FINISH: '#F59E0B', // 橙色
      START_TO_FINISH: '#EF4444', // 红色
    };
    return colors[this._dependencyType] || '#3B82F6';
  }

  /**
   * 获取依赖关系徽章
   */
  getDependencyBadge(): {
    text: string;
    icon: string;
    color: string;
    description: string;
  } {
    return {
      text: this.dependencyTypeText,
      icon: this.getDependencyTypeIcon(),
      color: this.getDependencyTypeColor(),
      description: this.dependencyDescription,
    };
  }

  // ========== DTO 转换 ==========

  toServerDTO(): TaskDependencyServerDTO {
    return {
      uuid: this.uuid,
      predecessorTaskUuid: this._predecessorTaskUuid,
      successorTaskUuid: this._successorTaskUuid,
      dependencyType: this._dependencyType,
      lagDays: this._lagDays,
      createdAt: new Date(this._createdAt),
      updatedAt: new Date(this._updatedAt),
    };
  }

  toClientDTO(): TaskDependencyClientDTO {
    return {
      uuid: this.uuid,
      predecessorTaskUuid: this._predecessorTaskUuid,
      successorTaskUuid: this._successorTaskUuid,
      dependencyType: this._dependencyType,
      lagDays: this._lagDays,
      createdAt: new Date(this._createdAt),
      updatedAt: new Date(this._updatedAt),
    };
  }

  // ========== 静态工厂方法 ==========

  /**
   * 创建新的依赖关系（用于前端表单）
   */
  static create(params: {
    predecessorTaskUuid: string;
    successorTaskUuid: string;
    dependencyType: DependencyType;
    lagDays?: number;
  }): TaskDependencyClient {
    const now = Date.now();

    return new TaskDependencyClient({
      uuid: AggregateRoot.generateUUID(),
      predecessorTaskUuid: params.predecessorTaskUuid,
      successorTaskUuid: params.successorTaskUuid,
      dependencyType: params.dependencyType,
      lagDays: params.lagDays,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 从 Server DTO 创建客户端实体
   */
  static fromServerDTO(dto: TaskDependencyServerDTO): TaskDependencyClient {
    return new TaskDependencyClient({
      uuid: dto.uuid,
      predecessorTaskUuid: dto.predecessorTaskUuid,
      successorTaskUuid: dto.successorTaskUuid,
      dependencyType: dto.dependencyType,
      lagDays: dto.lagDays,
      createdAt: dto.createdAt.getTime(),
      updatedAt: dto.updatedAt.getTime(),
    });
  }

  /**
   * 从 Client DTO 创建客户端实体
   */
  static fromClientDTO(dto: TaskDependencyClientDTO): TaskDependencyClient {
    return new TaskDependencyClient({
      uuid: dto.uuid,
      predecessorTaskUuid: dto.predecessorTaskUuid,
      successorTaskUuid: dto.successorTaskUuid,
      dependencyType: dto.dependencyType,
      lagDays: dto.lagDays,
      createdAt: dto.createdAt.getTime(),
      updatedAt: dto.updatedAt.getTime(),
    });
  }
}
