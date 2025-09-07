/**
 * 领域核心类型定义
 * 从各个领域模块中提取的核心接口定义
 * 这些类型作为整个系统的契约，各个domain包根据这些接口来实现具体逻辑
 */

// 重新导出账户领域类型
export * from './account';
// 重新导出认证领域类型
export * from './authentication';
// 重新导出重要性级别类型
export * from './importance';
// 重新导出紧急性级别类型
export * from './urgency';
// 重新导出共享的类型
export * from '../shared';