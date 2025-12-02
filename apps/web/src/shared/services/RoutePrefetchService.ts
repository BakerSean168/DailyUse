/**
 * Route Prefetch Service
 * 路由预加载服务 - 鼠标悬停时预加载目标页面的 JS chunks
 * 
 * 优化策略：
 * 1. 鼠标悬停 150ms 后开始预加载（避免快速划过触发）
 * 2. 使用 <link rel="prefetch"> 进行低优先级预加载
 * 3. 缓存已预加载的路由，避免重复加载
 */

// 已预加载的路由集合
const prefetchedRoutes = new Set<string>();

// 悬停定时器
let hoverTimer: ReturnType<typeof setTimeout> | null = null;

// 路由到模块的映射（懒加载的 chunk）
const routeModuleMap: Record<string, () => Promise<any>> = {
  '/': () => import('@/modules/dashboard/presentation/views/DashboardView.vue'),
  '/tasks': () => import('@/modules/task/presentation/views/TaskManagementView.vue'),
  '/goals': () => import('@/modules/goal/presentation/views/GoalListView.vue'),
  '/reminders': () => import('@/modules/reminder/presentation/views/ReminderDesktopView.vue'),
  '/schedule': () => import('@/modules/schedule/presentation/views/ScheduleDashboardView.vue'),
  '/repository': () => import('@/modules/repository/presentation/views/RepositoryView.vue'),
  '/notifications': () => import('@/modules/notification/presentation/views/NotificationListPage.vue'),
  '/ai': () => import('@/modules/ai/presentation/components/generation/KnowledgeGenerationWizard.vue'),
  '/settings': () => import('@/modules/setting/presentation/views/UserSettingsView.vue'),
};

/**
 * 预加载指定路由的模块
 */
const prefetchRoute = async (path: string): Promise<void> => {
  // 规范化路径
  const normalizedPath = path === '' ? '/' : path;
  
  // 已经预加载过，跳过
  if (prefetchedRoutes.has(normalizedPath)) {
    return;
  }

  // 查找匹配的模块加载器
  const loader = routeModuleMap[normalizedPath];
  
  if (loader) {
    try {
      console.log(`🔮 [Prefetch] 预加载路由: ${normalizedPath}`);
      prefetchedRoutes.add(normalizedPath);
      
      // 使用 requestIdleCallback 在空闲时加载（如果支持）
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          loader().catch((err) => {
            console.warn(`⚠️ [Prefetch] 预加载失败: ${normalizedPath}`, err);
            prefetchedRoutes.delete(normalizedPath);
          });
        }, { timeout: 2000 });
      } else {
        // 降级方案：延迟 100ms 执行
        setTimeout(() => {
          loader().catch((err) => {
            console.warn(`⚠️ [Prefetch] 预加载失败: ${normalizedPath}`, err);
            prefetchedRoutes.delete(normalizedPath);
          });
        }, 100);
      }
    } catch (err) {
      console.warn(`⚠️ [Prefetch] 预加载出错: ${normalizedPath}`, err);
    }
  }
};

/**
 * 处理鼠标进入导航项
 * 延迟 150ms 后触发预加载，避免快速划过
 */
export const handleNavMouseEnter = (path: string): void => {
  // 清除之前的定时器
  if (hoverTimer) {
    clearTimeout(hoverTimer);
  }

  // 设置新的定时器
  hoverTimer = setTimeout(() => {
    prefetchRoute(path);
  }, 150);
};

/**
 * 处理鼠标离开导航项
 * 取消预加载定时器
 */
export const handleNavMouseLeave = (): void => {
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
};

/**
 * 手动预加载多个路由（用于空闲时批量预加载）
 */
export const prefetchRoutes = (paths: string[]): void => {
  paths.forEach((path) => {
    // 使用 requestIdleCallback 分批加载
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => prefetchRoute(path), { timeout: 5000 });
    } else {
      setTimeout(() => prefetchRoute(path), 1000);
    }
  });
};

/**
 * 检查路由是否已预加载
 */
export const isRoutePrefetched = (path: string): boolean => {
  const normalizedPath = path === '' ? '/' : path;
  return prefetchedRoutes.has(normalizedPath);
};

/**
 * 获取已预加载的路由列表（调试用）
 */
export const getPrefetchedRoutes = (): string[] => {
  return Array.from(prefetchedRoutes);
};
