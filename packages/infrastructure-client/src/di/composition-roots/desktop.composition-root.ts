/**
 * Desktop Composition Root
 *
 * 配置 Desktop 环境（Electron）的依赖注入
 * 使用 IPC 适配器与主进程通信
 */

import type { ElectronAPI } from '../../shared';
import {
  GoalIpcAdapter,
  GoalFolderIpcAdapter,
} from '../../goal';
import {
  TaskTemplateIpcAdapter,
  TaskInstanceIpcAdapter,
  TaskDependencyIpcAdapter,
  TaskStatisticsIpcAdapter,
} from '../../task';
import {
  ScheduleTaskIpcAdapter,
  ScheduleEventIpcAdapter,
} from '../../schedule';
import { ReminderIpcAdapter } from '../../reminder';
import { AccountIpcAdapter } from '../../account';
import { AuthIpcAdapter } from '../../authentication';
import { NotificationIpcAdapter } from '../../notification';

import { GoalContainer } from '../containers/GoalContainer';
import { TaskContainer } from '../containers/TaskContainer';
import { ScheduleContainer } from '../containers/ScheduleContainer';
import { ReminderContainer } from '../containers/ReminderContainer';
import { AccountContainer } from '../containers/AccountContainer';
import { AuthenticationContainer } from '../containers/AuthenticationContainer';
import { NotificationContainer } from '../containers/NotificationContainer';

/**
 * 配置 Desktop 环境的依赖
 *
 * @param electronApi - Electron API（暴露给渲染进程的 API）
 */
export function configureDesktopDependencies(electronApi: ElectronAPI): void {
  // Goal Module
  const goalContainer = GoalContainer.getInstance();
  goalContainer.registerGoalApiClient(new GoalIpcAdapter(electronApi));
  goalContainer.registerGoalFolderApiClient(new GoalFolderIpcAdapter(electronApi));

  // Task Module
  const taskContainer = TaskContainer.getInstance();
  taskContainer.registerTaskTemplateApiClient(new TaskTemplateIpcAdapter(electronApi));
  taskContainer.registerTaskInstanceApiClient(new TaskInstanceIpcAdapter(electronApi));
  taskContainer.registerTaskDependencyApiClient(new TaskDependencyIpcAdapter(electronApi));
  taskContainer.registerTaskStatisticsApiClient(new TaskStatisticsIpcAdapter(electronApi));

  // Schedule Module
  const scheduleContainer = ScheduleContainer.getInstance();
  scheduleContainer.registerScheduleTaskApiClient(new ScheduleTaskIpcAdapter(electronApi));
  scheduleContainer.registerScheduleEventApiClient(new ScheduleEventIpcAdapter(electronApi));

  // Reminder Module
  const reminderContainer = ReminderContainer.getInstance();
  reminderContainer.registerReminderApiClient(new ReminderIpcAdapter(electronApi));

  // Account Module
  const accountContainer = AccountContainer.getInstance();
  accountContainer.registerAccountApiClient(new AccountIpcAdapter(electronApi));

  // Authentication Module
  const authContainer = AuthenticationContainer.getInstance();
  authContainer.registerAuthApiClient(new AuthIpcAdapter(electronApi));

  // Notification Module
  const notificationContainer = NotificationContainer.getInstance();
  notificationContainer.registerNotificationApiClient(new NotificationIpcAdapter(electronApi));
}
