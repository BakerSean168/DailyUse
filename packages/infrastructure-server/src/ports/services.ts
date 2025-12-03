/**
 * Service Port Interfaces
 *
 * These interfaces define contracts for external services.
 */

/**
 * AI Service Interface
 *
 * For AI-powered features like key result generation.
 */
export interface IAIService {
  isAvailable(): Promise<boolean>;
  generateKeyResults(params: {
    goalTitle: string;
    goalDescription?: string;
    startDate: number;
    endDate: number;
  }): Promise<{
    keyResults: any[];
    tokenUsage: any;
  }>;
  generateText(prompt: string): Promise<string>;
}

/**
 * Notification Service Interface
 */
export interface INotificationService {
  send(params: {
    accountUuid: string;
    title: string;
    body: string;
    type: 'info' | 'warning' | 'error' | 'success';
    data?: any;
  }): Promise<void>;
}

/**
 * Email Service Interface
 */
export interface IEmailService {
  send(params: {
    to: string;
    subject: string;
    body: string;
    html?: string;
  }): Promise<void>;
}

/**
 * Event Bus Interface
 *
 * For publishing domain events.
 */
export interface IEventBus {
  publish<T>(event: { type: string; payload: T }): Promise<void>;
  subscribe<T>(eventType: string, handler: (payload: T) => Promise<void>): void;
}

/**
 * Cache Service Interface
 */
export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
}
