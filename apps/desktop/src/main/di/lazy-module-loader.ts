/**
 * Lazy Module Loading Utility
 * 
 * Provides a mechanism for lazy loading modules to optimize application startup time.
 * Core modules can be loaded immediately, while non-core modules are loaded on demand
 * or preloaded during idle time.
 *
 * @module di/lazy-module-loader
 */

/**
 * Type definition for a module initialization function.
 */
type ModuleInitializer = () => Promise<void>;

/**
 * Configuration and state for a lazy-loaded module.
 */
interface LazyModuleConfig {
  /** The unique name of the module. */
  name: string;
  /** The function to initialize the module. */
  initializer: ModuleInitializer;
  /** Whether the module has been successfully loaded. */
  loaded: boolean;
  /** Whether the module is currently being loaded. */
  loading: boolean;
  /** The promise representing the active loading process. */
  loadPromise: Promise<void> | null;
}

// Registry for lazy modules
const lazyModules = new Map<string, LazyModuleConfig>();

// Records of module loading times (ms) for performance monitoring
const moduleLoadTimes = new Map<string, number>();

/**
 * Registers a module for lazy loading.
 *
 * @param {string} name - The unique name of the module.
 * @param {ModuleInitializer} initializer - The async function to initialize the module.
 */
export function registerLazyModule(name: string, initializer: ModuleInitializer): void {
  lazyModules.set(name, {
    name,
    initializer,
    loaded: false,
    loading: false,
    loadPromise: null,
  });
  console.log(`[LazyModule] Registered: ${name}`);
}

/**
 * Ensures that a specific module is loaded.
 *
 * If the module is already loaded, returns immediately.
 * If the module is currently loading, waits for the existing promise.
 * If the module is not loaded, triggers the initialization.
 *
 * @param {string} name - The name of the module to load.
 * @returns {Promise<void>} A promise that resolves when the module is fully loaded.
 */
export async function ensureModuleLoaded(name: string): Promise<void> {
  const module = lazyModules.get(name);
  
  if (!module) {
    console.warn(`[LazyModule] Module not registered: ${name}`);
    return;
  }
  
  // Already loaded
  if (module.loaded) {
    return;
  }
  
  // Already loading, wait for it
  if (module.loading && module.loadPromise) {
    return module.loadPromise;
  }
  
  // Start loading
  module.loading = true;
  const startTime = performance.now();
  
  console.log(`[LazyModule] Loading: ${name}...`);
  
  module.loadPromise = module.initializer()
    .then(() => {
      module.loaded = true;
      const loadTime = performance.now() - startTime;
      moduleLoadTimes.set(name, loadTime);
      console.log(`[LazyModule] Loaded: ${name} (${loadTime.toFixed(2)}ms)`);
    })
    .catch((error) => {
      console.error(`[LazyModule] Failed to load: ${name}`, error);
      throw error;
    })
    .finally(() => {
      module.loading = false;
    });
  
  return module.loadPromise;
}

/**
 * Preloads a module during idle time.
 * Uses `requestIdleCallback` if available (browser/electron renderer),
 * otherwise falls back to `setImmediate` (Node.js/electron main).
 *
 * @param {string} name - The name of the module to preload.
 */
export function preloadModule(name: string): void {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      ensureModuleLoaded(name).catch(console.error);
    });
  } else {
    // Node.js environment fallback
    setImmediate(() => {
      ensureModuleLoaded(name).catch(console.error);
    });
  }
}

/**
 * Batch preloads multiple modules.
 *
 * @param {string[]} names - Array of module names to preload.
 */
export function preloadModules(names: string[]): void {
  names.forEach(preloadModule);
}

/**
 * Checks if a specific module has been loaded.
 *
 * @param {string} name - The name of the module.
 * @returns {boolean} True if the module is loaded, false otherwise.
 */
export function isModuleLoaded(name: string): boolean {
  return lazyModules.get(name)?.loaded ?? false;
}

/**
 * Retrieves a list of all names of currently loaded modules.
 *
 * @returns {string[]} Array of loaded module names.
 */
export function getLoadedModules(): string[] {
  return Array.from(lazyModules.entries())
    .filter(([, config]) => config.loaded)
    .map(([name]) => name);
}

/**
 * Retrieves the loading times for all loaded modules.
 *
 * @returns {Record<string, number>} A map of module names to their load times in milliseconds.
 */
export function getModuleLoadTimes(): Record<string, number> {
  return Object.fromEntries(moduleLoadTimes);
}

/**
 * Retrieves statistics about the lazy module system.
 *
 * @returns {Object} Statistics object containing total registered, loaded count, pending count, and load times.
 */
export function getLazyModuleStats(): {
  total: number;
  loaded: number;
  pending: number;
  loadTimes: Record<string, number>;
} {
  const entries = Array.from(lazyModules.values());
  return {
    total: entries.length,
    loaded: entries.filter(m => m.loaded).length,
    pending: entries.filter(m => !m.loaded).length,
    loadTimes: Object.fromEntries(moduleLoadTimes),
  };
}

/**
 * Resets the lazy module registry and stats.
 * Primarily used for testing purposes.
 */
export function resetLazyModules(): void {
  lazyModules.clear();
  moduleLoadTimes.clear();
}
