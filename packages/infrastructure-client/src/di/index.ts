/**
 * Dependency Injection Module
 *
 * 导出 DI 相关的所有功能
 */

// Containers
export {
  DIContainer,
  DependencyKeys,
  type DependencyKey,
  GoalContainer,
  TaskContainer,
  ScheduleContainer,
  ReminderContainer,
  AccountContainer,
  AuthenticationContainer,
  NotificationContainer,
} from './containers';

// Composition Roots
export {
  configureWebDependencies,
  configureDesktopDependencies,
} from './composition-roots';
