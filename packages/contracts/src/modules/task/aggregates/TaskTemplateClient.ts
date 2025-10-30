/**
 * TaskTemplate Aggregate Root - Client Interface
 */

import type { TaskTemplateServerDTO } from './TaskTemplateServer';
import type { TaskType, TaskTemplateStatus } from '../enums';
import { ImportanceLevel } from '../../../shared/importance';
import { UrgencyLevel } from '../../../shared/urgency';
import type {
  TaskTimeConfigClient,
  TaskTimeConfigClientDTO,
  RecurrenceRuleClient,
  RecurrenceRuleClientDTO,
  TaskReminderConfigClient,
  TaskReminderConfigClientDTO,
  TaskGoalBindingClient,
  TaskGoalBindingClientDTO,
} from '../value-objects';
import type { TaskInstanceClient } from './TaskInstanceClient';

export interface TaskTemplateClientDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string | null;
  taskType: TaskType;
  timeConfig: any;
  recurrenceRule?: any | null;
  reminderConfig?: any | null;
  importance: ImportanceLevel;
  urgency: UrgencyLevel;
  goalBinding?: any | null;
  folderUuid?: string | null;
  tags: string[];
  color?: string | null;
  status: TaskTemplateStatus;
  lastGeneratedDate?: number | null;
  generateAheadDays: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
  history?: any[];
  instances?: any[];
  displayTitle: string;
  taskTypeText: string;
  timeDisplayText: string;
  recurrenceText?: string | null;
  importanceText: string;
  urgencyText: string;
  statusText: string;
  hasReminder: boolean;
  reminderText?: string | null;
  isLinkedToGoal: boolean;
  goalLinkText?: string | null;
  instanceCount: number;
  completedInstanceCount: number;
  pendingInstanceCount: number;
  completionRate: number;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

export interface TaskTemplateClient {
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string | null;
  taskType: TaskType;
  timeConfig: TaskTimeConfigClient;
  recurrenceRule?: RecurrenceRuleClient | null;
  reminderConfig?: TaskReminderConfigClient | null;
  importance: ImportanceLevel;
  urgency: UrgencyLevel;
  goalBinding?: TaskGoalBindingClient | null;
  folderUuid?: string | null;
  tags: string[];
  color?: string | null;
  status: TaskTemplateStatus;
  lastGeneratedDate?: number | null;
  generateAheadDays: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
  instances?: TaskInstanceClient[];
  displayTitle: string;
  taskTypeText: string;
  timeDisplayText: string;
  recurrenceText?: string | null;
  importanceText: string;
  urgencyText: string;
  statusText: string;
  hasReminder: boolean;
  reminderText?: string | null;
  isLinkedToGoal: boolean;
  goalLinkText?: string | null;
  instanceCount: number;
  completedInstanceCount: number;
  pendingInstanceCount: number;
  completionRate: number;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;

  getDisplayTitle(): string;
  getStatusBadge(): { text: string; color: string };
  getImportanceBadge(): { text: string; color: string };
  getUrgencyBadge(): { text: string; color: string };
  getTimeDisplay(): string;
  getRecurrenceDisplay(): string;
  canEdit(): boolean;
  canDelete(): boolean;
  canPause(): boolean;
  canActivate(): boolean;
  canArchive(): boolean;
  isOneTime(): boolean;
  isRecurring(): boolean;
  createInstance(params: any): string;
  addInstance(instance: any): void;
  removeInstance(instanceUuid: string): any | null;
  getInstance(instanceUuid: string): any | null;
  getAllInstances(): any[];

  toClientDTO(includeChildren?: boolean): TaskTemplateClientDTO;
  toServerDTO(includeChildren?: boolean): TaskTemplateServerDTO;
}

export interface TaskTemplateClientStatic {
  fromClientDTO(dto: TaskTemplateClientDTO): TaskTemplateClient;
  fromServerDTO(dto: TaskTemplateServerDTO): TaskTemplateClient;
  forCreate(accountUuid: string): TaskTemplateClient;
  create(params: any): TaskTemplateClient;
}

export interface TaskTemplateClientInstance extends TaskTemplateClient {
  clone(): TaskTemplateClient;
}
