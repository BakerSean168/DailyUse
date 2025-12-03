/**
 * HTTP Adapters
 *
 * REST API client implementations for web applications.
 * These adapters implement the port interfaces using HTTP/REST.
 */

export { GoalHttpAdapter, createGoalHttpAdapter } from './goal-http.adapter';
export { GoalFolderHttpAdapter, createGoalFolderHttpAdapter } from './goal-folder-http.adapter';

// Re-export types
export type { HttpClient, HttpClientConfig } from './http-client.types';
