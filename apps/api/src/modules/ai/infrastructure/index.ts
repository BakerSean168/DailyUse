/**
 * AI Module Infrastructure Exports
 * AI 模块基础设施层导出
 *
 * 包含：
 * - AI Adapters (OpenAI, Mock)
 * - Prompt Templates
 * - Quota Enforcement Service
 */

// ===== Adapters =====
export * from './adapters/BaseAIAdapter';
export * from './adapters/OpenAIAdapter';
export * from './adapters/MockAIAdapter';

// ===== Prompts =====
export * from './prompts/templates';

// ===== Services =====
export * from './QuotaEnforcementService';
