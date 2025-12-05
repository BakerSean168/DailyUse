/**
 * Web Composition Root
 *
 * 配置 Web 环境（浏览器）的依赖注入
 * 使用 HTTP 适配器与 API 通信
 */

import type { IHttpClient } from '../../shared';
import {
  GoalHttpAdapter,
  GoalFolderHttpAdapter,
} from '../../goal';
import {
  TaskTemplateHttpAdapter,
  TaskInstanceHttpAdapter,
  TaskDependencyHttpAdapter,
  TaskStatisticsHttpAdapter,
} from '../../task';
import {
  ScheduleTaskHttpAdapter,
  ScheduleEventHttpAdapter,
} from '../../schedule';
import { ReminderHttpAdapter } from '../../reminder';
import { AccountHttpAdapter } from '../../account';
import { AuthHttpAdapter } from '../../authentication';
import { NotificationHttpAdapter } from '../../notification';

import { GoalContainer } from '../containers/GoalContainer';
import { TaskContainer } from '../containers/TaskContainer';
import { ScheduleContainer } from '../containers/ScheduleContainer';
import { ReminderContainer } from '../containers/ReminderContainer';
import { AccountContainer } from '../containers/AccountContainer';
import { AuthenticationContainer } from '../containers/AuthenticationContainer';
import { NotificationContainer } from '../containers/NotificationContainer';

/**
 * 配置 Web 环境的依赖
 *
 * @param httpClient - HTTP 客户端实例
 */
export function configureWebDependencies(httpClient: IHttpClient): void {
  // Goal Module
  const goalContainer = GoalContainer.getInstance();
  goalContainer.registerGoalApiClient(new GoalHttpAdapter(httpClient));
  goalContainer.registerGoalFolderApiClient(new GoalFolderHttpAdapter(httpClient));

  // Task Module
  const taskContainer = TaskContainer.getInstance();
  taskContainer.registerTaskTemplateApiClient(new TaskTemplateHttpAdapter(httpClient));
  taskContainer.registerTaskInstanceApiClient(new TaskInstanceHttpAdapter(httpClient));
  taskContainer.registerTaskDependencyApiClient(new TaskDependencyHttpAdapter(httpClient));
  taskContainer.registerTaskStatisticsApiClient(new TaskStatisticsHttpAdapter(httpClient));

  // Schedule Module
  const scheduleContainer = ScheduleContainer.getInstance();
  scheduleContainer.registerScheduleTaskApiClient(new ScheduleTaskHttpAdapter(httpClient));
  scheduleContainer.registerScheduleEventApiClient(new ScheduleEventHttpAdapter(httpClient));

  // Reminder Module
  const reminderContainer = ReminderContainer.getInstance();
  reminderContainer.registerReminderApiClient(new ReminderHttpAdapter(httpClient));

  // Account Module
  const accountContainer = AccountContainer.getInstance();
  accountContainer.registerAccountApiClient(new AccountHttpAdapter(httpClient));

  // Authentication Module
  const authContainer = AuthenticationContainer.getInstance();
  authContainer.registerAuthApiClient(new AuthHttpAdapter(httpClient));

  // Notification Module
  const notificationContainer = NotificationContainer.getInstance();
  notificationContainer.registerNotificationApiClient(new NotificationHttpAdapter(httpClient));
}
