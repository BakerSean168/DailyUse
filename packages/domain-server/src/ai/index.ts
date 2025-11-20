/**
 * AI Module - Domain Server Layer
 * AI 模块 - 领域服务层导出
 *
 * DDD 原则：
 * - 只导出领域层纯业务逻辑
 * - 不包含基础设施实现（Adapters、Prompt 模板等）
 * - 基础设施细节由 API 层的 infrastructure/ 处理
 *
 * 导出内容：
 * - 仓储接口（Repository Interfaces）
 * - 领域服务（Domain Services）
 * - 领域错误（Domain Errors）
 */

// ===== Repositories =====
export * from './repositories';

// ===== Domain Services =====
export * from './services';

// ===== Domain Errors =====
export * from './errors/AIErrors';
