/**
 * Web Composition Root
 *
 * 配置 Web 环境（浏览器）的依赖注入
 * 使用 HTTP 适配器与 API 通信
 */

import type { IHttpClient } from '../../shared';
import {
  GoalContainer,
  GoalHttpAdapter,
  GoalFolderHttpAdapter,
} from '../../goal';
import {
  TaskContainer,
  TaskTemplateHttpAdapter,
  TaskInstanceHttpAdapter,
  TaskDependencyHttpAdapter,
  TaskStatisticsHttpAdapter,
} from '../../task';
import {
  ScheduleContainer,
  ScheduleTaskHttpAdapter,
  ScheduleEventHttpAdapter,
} from '../../schedule';
import { ReminderContainer, ReminderHttpAdapter } from '../../reminder';
import { AccountContainer, AccountHttpAdapter } from '../../account';
import { AuthContainer, AuthHttpAdapter } from '../../authentication';
import { NotificationContainer, NotificationHttpAdapter } from '../../notification';
import {
  AIContainer,
  AIConversationHttpAdapter,
  AIMessageHttpAdapter,
  AIGenerationTaskHttpAdapter,
  AIUsageQuotaHttpAdapter,
  AIProviderConfigHttpAdapter,
} from '../../ai';
import { DashboardContainer, DashboardHttpAdapter } from '../../dashboard';
import { RepositoryContainer, RepositoryHttpAdapter } from '../../repository';
import { SettingContainer, SettingHttpAdapter } from '../../setting';

/**
 * 配置 Web 环境的依赖
 *
 * @param httpClient - HTTP 客户端实例
 */
export function configureWebDependencies(httpClient: IHttpClient): void {
  // Goal Module
  GoalContainer.getInstance()
    .registerApiClient(new GoalHttpAdapter(httpClient))
    .registerFolderApiClient(new GoalFolderHttpAdapter(httpClient));

  // Task Module
  TaskContainer.getInstance()
    .registerTemplateApiClient(new TaskTemplateHttpAdapter(httpClient))
    .registerInstanceApiClient(new TaskInstanceHttpAdapter(httpClient))
    .registerDependencyApiClient(new TaskDependencyHttpAdapter(httpClient))
    .registerStatisticsApiClient(new TaskStatisticsHttpAdapter(httpClient));

  // Schedule Module
  ScheduleContainer.getInstance()
    .registerTaskApiClient(new ScheduleTaskHttpAdapter(httpClient))
    .registerEventApiClient(new ScheduleEventHttpAdapter(httpClient));

  // Reminder Module
  ReminderContainer.getInstance()
    .registerApiClient(new ReminderHttpAdapter(httpClient));

  // Account Module
  AccountContainer.getInstance()
    .registerApiClient(new AccountHttpAdapter(httpClient));

  // Authentication Module
  AuthContainer.getInstance()
    .registerApiClient(new AuthHttpAdapter(httpClient));

  // Notification Module
  NotificationContainer.getInstance()
    .registerApiClient(new NotificationHttpAdapter(httpClient));

  // AI Module
  AIContainer.getInstance()
    .registerConversationApiClient(new AIConversationHttpAdapter(httpClient))
    .registerMessageApiClient(new AIMessageHttpAdapter(httpClient))
    .registerGenerationTaskApiClient(new AIGenerationTaskHttpAdapter(httpClient))
    .registerUsageQuotaApiClient(new AIUsageQuotaHttpAdapter(httpClient))
    .registerProviderConfigApiClient(new AIProviderConfigHttpAdapter(httpClient));

  // Dashboard Module
  DashboardContainer.getInstance()
    .registerApiClient(new DashboardHttpAdapter(httpClient));

  // Repository Module
  RepositoryContainer.getInstance()
    .registerApiClient(new RepositoryHttpAdapter(httpClient));

  // Setting Module
  SettingContainer.getInstance()
    .registerApiClient(new SettingHttpAdapter(httpClient));
}
