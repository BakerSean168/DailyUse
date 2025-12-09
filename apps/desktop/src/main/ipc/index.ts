/**
 * IPC Handlers Index
 *
 * 所有 IPC 处理器已迁移到 modules/ 目录
 *
 * NOTE: Goal handlers have been moved to modules/goal/ (STORY-002)
 * NOTE: Task handlers have been moved to modules/task/ (STORY-003)
 * NOTE: Schedule handlers have been moved to modules/schedule/ (STORY-004)
 * NOTE: Reminder handlers have been moved to modules/reminder/ (STORY-005)
 * NOTE: Notification handlers have been moved to modules/notification/ (STORY-006)
 * NOTE: Dashboard handlers have been moved to modules/dashboard/ (STORY-007)
 * NOTE: AI handlers have been moved to modules/ai/ (STORY-008)
 * NOTE: Account & Auth handlers have been moved to modules/account/ (STORY-009)
 * NOTE: Repository handlers have been moved to modules/repository/ (STORY-010)
 * NOTE: Setting handlers have been moved to modules/setting/ (STORY-011)
 *
 * ALL IPC HANDLERS ARE NOW MANAGED BY THE MODULE SYSTEM
 * See: modules/index.ts -> registerAllModules()
 */

/**
 * @deprecated All IPC handlers are now registered via the module system.
 * This function is kept for backward compatibility but does nothing.
 * Use registerAllModules() and initializeAllModules() instead.
 */
export function registerAllIpcHandlers(): void {
  console.log('[IPC] All handlers are now managed by the module system.');
  console.log('[IPC] Use registerAllModules() and initializeAllModules() instead.');
}

