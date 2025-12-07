/**
 * EPIC-003: Lazy Module Loading
 * 
 * 模块懒加载机制，优化启动时间
 * 核心模块立即加载，非核心模块按需加载
 */

type ModuleInitializer = () => Promise<void>;

interface LazyModuleConfig {
  name: string;
  initializer: ModuleInitializer;
  loaded: boolean;
  loading: boolean;
  loadPromise: Promise<void> | null;
}

// 懒加载模块注册表
const lazyModules = new Map<string, LazyModuleConfig>();

// 模块加载时间记录（用于性能监控）
const moduleLoadTimes = new Map<string, number>();

/**
 * 注册懒加载模块
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
 * 确保模块已加载
 * 如果模块正在加载，等待加载完成
 * 如果模块已加载，立即返回
 */
export async function ensureModuleLoaded(name: string): Promise<void> {
  const module = lazyModules.get(name);
  
  if (!module) {
    console.warn(`[LazyModule] Module not registered: ${name}`);
    return;
  }
  
  // 已加载
  if (module.loaded) {
    return;
  }
  
  // 正在加载，等待完成
  if (module.loading && module.loadPromise) {
    return module.loadPromise;
  }
  
  // 开始加载
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
 * 预加载模块（在空闲时加载，不阻塞）
 */
export function preloadModule(name: string): void {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      ensureModuleLoaded(name).catch(console.error);
    });
  } else {
    // Node.js 环境使用 setImmediate
    setImmediate(() => {
      ensureModuleLoaded(name).catch(console.error);
    });
  }
}

/**
 * 批量预加载模块
 */
export function preloadModules(names: string[]): void {
  names.forEach(preloadModule);
}

/**
 * 检查模块是否已加载
 */
export function isModuleLoaded(name: string): boolean {
  return lazyModules.get(name)?.loaded ?? false;
}

/**
 * 获取所有已加载的模块
 */
export function getLoadedModules(): string[] {
  return Array.from(lazyModules.entries())
    .filter(([, config]) => config.loaded)
    .map(([name]) => name);
}

/**
 * 获取模块加载时间
 */
export function getModuleLoadTimes(): Record<string, number> {
  return Object.fromEntries(moduleLoadTimes);
}

/**
 * 获取懒加载模块统计
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
 * 重置所有懒加载模块（用于测试）
 */
export function resetLazyModules(): void {
  lazyModules.clear();
  moduleLoadTimes.clear();
}
