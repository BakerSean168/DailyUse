/**
 * Task DAG Visualization Types
 * 任务依赖关系图可视化专用类型定义
 */

import type { TaskTemplateClientDTO, TaskInstanceClientDTO, TaskDependencyServerDTO } from '@dailyuse/contracts/task';

/**
 * 用于 DAG 可视化的任务数据类型
 * 结合了 TaskTemplate 和 TaskInstance 的信息
 */
export interface TaskForDAG {
  uuid: string;
  title: string;
  description?: string | null;
  status: string; // TaskInstanceStatus or TaskTemplateStatus
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  importance?: string;
  urgency?: string;
  estimatedMinutes?: number;
  dueDate?: string;
  tags?: string[];
  templateUuid?: string; // 如果是实例，指向模板
  instanceDate?: number; // 如果是实例
}

/**
 * 将 TaskTemplateClientDTO 转换为 TaskForDAG
 */
export function taskTemplateToDAG(template: TaskTemplateClientDTO): TaskForDAG {
  return {
    uuid: template.uuid,
    title: template.title,
    description: template.description,
    status: template.status,
    priority: mapImportanceUrgencyToPriority(template.importance, template.urgency),
    importance: template.importance,
    urgency: template.urgency,
    estimatedMinutes: extractEstimatedMinutes(template.timeConfig),
    tags: template.tags,
  };
}

/**
 * 将 TaskInstanceClientDTO 转换为 TaskForDAG
 */
export function taskInstanceToDAG(
  instance: TaskInstanceClientDTO,
  template?: TaskTemplateClientDTO,
): TaskForDAG {
  return {
    uuid: instance.uuid,
    title: template?.title || `Task ${instance.uuid.slice(0, 8)}`,
    description: template?.description,
    status: instance.status,
    priority: template
      ? mapImportanceUrgencyToPriority(template.importance, template.urgency)
      : 'MEDIUM',
    importance: template?.importance,
    urgency: template?.urgency,
    estimatedMinutes: extractEstimatedMinutes(instance.timeConfig),
    tags: template?.tags || [],
    templateUuid: instance.templateUuid,
    instanceDate: instance.instanceDate,
  };
}

/**
 * 从 importance 和 urgency 映射到 priority
 */
function mapImportanceUrgencyToPriority(
  importance: string,
  urgency: string,
): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  // 紧急且重要 -> CRITICAL
  if (importance === 'HIGH' && urgency === 'HIGH') return 'CRITICAL';

  // 重要或紧急 -> HIGH
  if (importance === 'HIGH' || urgency === 'HIGH') return 'HIGH';

  // 中等 -> MEDIUM
  if (importance === 'MEDIUM' || urgency === 'MEDIUM') return 'MEDIUM';

  // 其他 -> LOW
  return 'LOW';
}

/**
 * 从 timeConfig 中提取预估时长（分钟）
 */
function extractEstimatedMinutes(timeConfig: any): number | undefined {
  if (!timeConfig) return undefined;

  // 根据实际的 timeConfig 结构提取
  // TODO: 根据实际的 TaskTimeConfig 结构调整
  if (typeof timeConfig === 'object' && timeConfig.estimatedMinutes) {
    return timeConfig.estimatedMinutes;
  }

  // 默认估算：如果有具体时间配置，估算为 30 分钟
  return 30;
}

/**
 * 用于 Widget 显示的任务类型
 * 结合了 TaskInstance 和 TaskTemplate 的显示信息
 */
export interface TaskForWidget {
  uuid: string;
  title: string;
  description?: string | null;
  status: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  scheduledTime?: number | null;
  dueDate?: number | null;
  templateUuid: string;
  templateTitle?: string;
  instanceDate: number;
}

/**
 * 将 TaskInstanceClientDTO 和 TaskTemplateClientDTO 转换为 TaskForWidget
 */
export function taskInstanceToWidget(
  instance: TaskInstanceClientDTO,
  template?: TaskTemplateClientDTO,
): TaskForWidget {
  return {
    uuid: instance.uuid,
    title: template?.title || `Task ${instance.uuid.slice(0, 8)}`,
    description: template?.description,
    status: instance.status,
    priority: template
      ? mapImportanceUrgencyToPriority(template.importance, template.urgency)
      : 'MEDIUM',
    scheduledTime: instance.timeConfig?.startTime ?? null,
    dueDate: template?.dueDate ?? null,
    templateUuid: instance.templateUuid,
    templateTitle: template?.title,
    instanceDate: instance.instanceDate,
  };
}

