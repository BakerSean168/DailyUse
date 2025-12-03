/**
 * HTTP Adapters
 *
 * REST API client implementations for web applications.
 * These adapters implement the port interfaces using HTTP/REST.
 */

// Goal Module
export { GoalHttpAdapter, createGoalHttpAdapter } from './goal-http.adapter';
export { GoalFolderHttpAdapter, createGoalFolderHttpAdapter } from './goal-folder-http.adapter';

// Task Module
export {
  TaskTemplateHttpAdapter,
  createTaskTemplateHttpAdapter,
} from './task-template-http.adapter';
export {
  TaskInstanceHttpAdapter,
  createTaskInstanceHttpAdapter,
} from './task-instance-http.adapter';
export {
  TaskDependencyHttpAdapter,
  createTaskDependencyHttpAdapter,
} from './task-dependency-http.adapter';
export {
  TaskStatisticsHttpAdapter,
  createTaskStatisticsHttpAdapter,
} from './task-statistics-http.adapter';

// Re-export types
export type { HttpClient, IHttpClient, HttpClientConfig } from './http-client.types';
