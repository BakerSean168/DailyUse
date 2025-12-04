/**
 * Reminder API Client Port Interface
 *
 * 定义提醒模块的 API 客户端接口。
 * 包含模板管理、分组管理和统计功能。
 */

import type {
  ReminderTemplateClientDTO,
  ReminderGroupClientDTO,
  ReminderStatisticsClientDTO,
  CreateReminderTemplateRequest,
  UpdateReminderTemplateRequest,
  CreateReminderGroupRequest,
  UpdateReminderGroupRequest,
  UpcomingRemindersResponseDTO,
  TemplateScheduleStatusDTO,
} from '@dailyuse/contracts/reminder';

/**
 * 模板列表响应
 */
export interface ReminderTemplatesResponse {
  templates: ReminderTemplateClientDTO[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * 分组列表响应
 */
export interface ReminderGroupsResponse {
  groups: ReminderGroupClientDTO[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * IReminderApiClient
 *
 * 提醒模块 API 客户端接口
 */
export interface IReminderApiClient {
  // ===== 模板 CRUD =====

  /**
   * 创建提醒模板
   */
  createReminderTemplate(
    request: CreateReminderTemplateRequest,
  ): Promise<ReminderTemplateClientDTO>;

  /**
   * 获取提醒模板详情
   */
  getReminderTemplate(uuid: string): Promise<ReminderTemplateClientDTO>;

  /**
   * 获取提醒模板列表
   */
  getReminderTemplates(params?: {
    page?: number;
    limit?: number;
  }): Promise<ReminderTemplatesResponse>;

  /**
   * 获取用户的所有提醒模板
   */
  getUserTemplates(accountUuid: string): Promise<ReminderTemplateClientDTO[]>;

  /**
   * 更新提醒模板
   */
  updateReminderTemplate(
    uuid: string,
    request: UpdateReminderTemplateRequest,
  ): Promise<ReminderTemplateClientDTO>;

  /**
   * 删除提醒模板
   */
  deleteReminderTemplate(uuid: string): Promise<void>;

  /**
   * 切换模板启用状态
   */
  toggleTemplateEnabled(uuid: string): Promise<ReminderTemplateClientDTO>;

  /**
   * 移动模板到指定分组
   */
  moveTemplateToGroup(
    templateUuid: string,
    targetGroupUuid: string | null,
  ): Promise<ReminderTemplateClientDTO>;

  /**
   * 搜索提醒模板
   */
  searchTemplates(
    accountUuid: string,
    query: string,
  ): Promise<ReminderTemplateClientDTO[]>;

  /**
   * 获取模板的调度状态
   */
  getTemplateScheduleStatus(templateUuid: string): Promise<TemplateScheduleStatusDTO>;

  /**
   * 获取即将到来的提醒
   */
  getUpcomingReminders(params?: {
    days?: number;
    limit?: number;
    importanceLevel?: string;
    type?: string;
  }): Promise<UpcomingRemindersResponseDTO>;

  // ===== 分组 CRUD =====

  /**
   * 创建提醒分组
   */
  createReminderGroup(request: CreateReminderGroupRequest): Promise<ReminderGroupClientDTO>;

  /**
   * 获取分组详情
   */
  getReminderGroup(uuid: string): Promise<ReminderGroupClientDTO>;

  /**
   * 获取分组列表
   */
  getReminderGroups(params?: {
    page?: number;
    limit?: number;
  }): Promise<ReminderGroupsResponse>;

  /**
   * 获取指定用户的所有分组
   */
  getUserReminderGroups(accountUuid: string): Promise<ReminderGroupClientDTO[]>;

  /**
   * 更新分组
   */
  updateReminderGroup(
    uuid: string,
    request: UpdateReminderGroupRequest,
  ): Promise<ReminderGroupClientDTO>;

  /**
   * 删除分组
   */
  deleteReminderGroup(uuid: string): Promise<void>;

  /**
   * 切换分组启用状态
   */
  toggleReminderGroupStatus(uuid: string): Promise<ReminderGroupClientDTO>;

  /**
   * 切换分组控制模式
   */
  toggleReminderGroupControlMode(uuid: string): Promise<ReminderGroupClientDTO>;

  // ===== 统计 =====

  /**
   * 获取提醒统计
   */
  getReminderStatistics(accountUuid: string): Promise<ReminderStatisticsClientDTO>;
}
