/**
 * Dependency Injection Module
 *
 * 导出 DI 相关的所有功能
 *
 * 注意: Container 现在位于各模块目录内 (goal/, task/, 等)
 * 这里只导出 Composition Roots 用于应用初始化
 */

// Composition Roots
export {
  configureWebDependencies,
  configureDesktopDependencies,
} from './composition-roots';

// Re-export shared DI utilities for convenience
export { DIContainer, ModuleContainerBase } from '../shared/di';
