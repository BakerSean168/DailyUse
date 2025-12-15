/**
 * Shared DI Container Infrastructure Adapter
 *
 * NOTE: These exports are only available in the main process.
 * This file exists for structural completeness but should not be imported
 * from the renderer process.
 * 
 * The actual DI configuration is done via:
 * - Main process: import from '../../main/di' directly
 * - Renderer process: use @dailyuse/infrastructure-client
 */

// Main-process only exports - import directly from main/di when needed
export const MAIN_PROCESS_ONLY = true;
