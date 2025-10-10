/**
 * Editor Module - Aggregates
 * 编辑器模块 - 聚合根统一导出
 *
 * ⚠️ 只导出聚合根，不导出实体
 * EditorSession 现在是实体，已移到 entities/ 文件夹
 */

// Editor Workspace Aggregate (唯一的聚合根)
export * from './EditorWorkspaceServer';
export * from './EditorWorkspaceClient';
