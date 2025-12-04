/**
 * Reminder Module - Infrastructure Client
 *
 * Ports and Adapters for Reminder module communication.
 */

// Ports (Interfaces)
export {
  type IReminderApiClient,
  type ReminderTemplatesResponse,
  type ReminderGroupsResponse,
} from './ports/reminder-api-client.port';

// HTTP Adapters
export {
  ReminderHttpAdapter,
  createReminderHttpAdapter,
} from './adapters/http/reminder-http.adapter';

// IPC Adapters
export {
  ReminderIpcAdapter,
  createReminderIpcAdapter,
} from './adapters/ipc/reminder-ipc.adapter';
