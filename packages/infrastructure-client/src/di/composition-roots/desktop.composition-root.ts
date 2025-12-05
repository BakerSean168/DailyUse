/**
 * Desktop Composition Root
 *
 * 配置 Desktop 环境（Electron）的依赖注入
 * 使用 IPC 适配器与主进程通信
 */

import type { ElectronAPI } from '../../shared';
import {
  GoalContainer,
  GoalIpcAdapter,
  GoalFolderIpcAdapter,
} from '../../goal';
import {
  TaskContainer,
  TaskTemplateIpcAdapter,
  TaskInstanceIpcAdapter,
  TaskDependencyIpcAdapter,
  TaskStatisticsIpcAdapter,
} from '../../task';
import {
  ScheduleContainer,
  ScheduleTaskIpcAdapter,
  ScheduleEventIpcAdapter,
} from '../../schedule';
import { ReminderContainer, ReminderIpcAdapter } from '../../reminder';
import { AccountContainer, AccountIpcAdapter } from '../../account';
import { AuthContainer, AuthIpcAdapter } from '../../authentication';
import { NotificationContainer, NotificationIpcAdapter } from '../../notification';

/**
 * 配置 Desktop 环境的依赖
 *
 * @param electronApi - Electron API（暴露给渲染进程的 API）
 */
export function configureDesktopDependencies(electronApi: ElectronAPI): void {
  // Goal Module
  GoalContainer.getInstance()
    .registerApiClient(new GoalIpcAdapter(electronApi))
    .registerFolderApiClient(new GoalFolderIpcAdapter(electronApi));

  // Task Module
  TaskContainer.getInstance()
    .registerTemplateApiClient(new TaskTemplateIpcAdapter(electronApi))
    .registerInstanceApiClient(new TaskInstanceIpcAdapter(electronApi))
    .registerDependencyApiClient(new TaskDependencyIpcAdapter(electronApi))
    .registerStatisticsApiClient(new TaskStatisticsIpcAdapter(electronApi));

  // Schedule Module
  ScheduleContainer.getInstance()
    .registerTaskApiClient(new ScheduleTaskIpcAdapter(electronApi))
    .registerEventApiClient(new ScheduleEventIpcAdapter(electronApi));

  // Reminder Module
  ReminderContainer.getInstance()
    .registerApiClient(new ReminderIpcAdapter(electronApi));

  // Account Module
  AccountContainer.getInstance()
    .registerApiClient(new AccountIpcAdapter(electronApi));

  // Authentication Module
  AuthContainer.getInstance()
    .registerApiClient(new AuthIpcAdapter(electronApi));

  // Notification Module
  NotificationContainer.getInstance()
    .registerApiClient(new NotificationIpcAdapter(electronApi));
}
