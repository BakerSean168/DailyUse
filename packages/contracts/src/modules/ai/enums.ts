/**
 * AI Module Enums
 * AI 模块枚举定义
 */

// ============ 对话相关枚举 ============

export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

export enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
}

// ============ 生成任务相关枚举 ============

export enum GenerationTaskType {
  GOAL_KEY_RESULTS = 'GOAL_KEY_RESULTS',
  TASK_TEMPLATES = 'TASK_TEMPLATES',
  DOCUMENT_SUMMARY = 'DOCUMENT_SUMMARY',
  KNOWLEDGE_DOCUMENTS = 'KNOWLEDGE_DOCUMENTS',
  GENERAL_CHAT = 'GENERAL_CHAT',
  /** 目标生成（从想法到完整 Goal） */
  GOAL_GENERATION = 'GOAL_GENERATION',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// ============ AI 提供商相关枚举 ============

export enum AIProvider {
  OPENAI = 'OPENAI',
  ANTHROPIC = 'ANTHROPIC',
  CUSTOM = 'CUSTOM',
}

/**
 * AI 服务提供商类型
 * 用于用户自定义 Provider 配置
 */
export enum AIProviderType {
  /** OpenAI 官方 */
  OPENAI = 'OPENAI',
  /** 七牛云 AI (OpenAI 兼容) */
  QINIU = 'QINIU',
  /** Anthropic Claude */
  ANTHROPIC = 'ANTHROPIC',
  /** OpenRouter 聚合服务 */
  OPENROUTER = 'OPENROUTER',
  /** Groq 高速推理 */
  GROQ = 'GROQ',
  /** DeepSeek */
  DEEPSEEK = 'DEEPSEEK',
  /** SiliconFlow 硅基流动 */
  SILICONFLOW = 'SILICONFLOW',
  /** Google AI Studio */
  GOOGLE = 'GOOGLE',
  /** 自定义 OpenAI 兼容接口 */
  CUSTOM_OPENAI_COMPATIBLE = 'CUSTOM_OPENAI_COMPATIBLE',
}

export enum AIModel {
  GPT4 = 'gpt-4',
  GPT4_TURBO = 'gpt-4-turbo-preview',
  GPT35_TURBO = 'gpt-3.5-turbo',
  CLAUDE3_OPUS = 'claude-3-opus-20240229',
  CLAUDE3_SONNET = 'claude-3-sonnet-20240229',
  CLAUDE3_HAIKU = 'claude-3-haiku-20240307',
}

// ============ 业务相关枚举 ============

export enum KnowledgeDocumentTemplateType {
  OVERVIEW = 'OVERVIEW',
  ACTION_GUIDE = 'ACTION_GUIDE',
  BEST_PRACTICE = 'BEST_PRACTICE',
  DATA_ANALYSIS = 'DATA_ANALYSIS',
  FAQ = 'FAQ',
}

export enum MetricType {
  NUMBER = 'NUMBER',
  PERCENTAGE = 'PERCENTAGE',
  TIME = 'TIME',
  BOOLEAN = 'BOOLEAN',
}

export enum QuotaResetPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

// ============ 任务相关枚举 ============

/**
 * 任务优先级
 */
export enum TaskPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}
