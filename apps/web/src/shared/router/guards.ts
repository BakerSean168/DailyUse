/**
 * Router Guards
 * 路由守卫 - 处理认证和权限控制
 */

import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { AuthManager } from '@/shared/api';

/**
 * 需要认证的路由标记
 */
export interface RouteMeta {
  /** 是否需要认证 */
  requiresAuth?: boolean;
  /** 需要的权限列表 */
  permissions?: string[];
  /** 页面标题 */
  title?: string;
  /** 是否在导航中显示 */
  showInNav?: boolean;
  /** 图标 */
  icon?: string;
  /** 排序权重 */
  order?: number;
}

/**
 * 声明路由元信息类型
 */
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    permissions?: string[];
    title?: string;
    showInNav?: boolean;
    icon?: string;
    order?: number;
  }
}

/**
 * 认证守卫 - 检查用户是否已登录
 */
export const authGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  // 检查路由是否需要认证
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (!requiresAuth) {
    // 如果不需要认证，直接继续导航
    next();
    return;
  }

  // 等待应用初始化完成（包括认证状态恢复）
  const { AppInitializationManager } = await import('../initialization/AppInitializationManager');

  // 如果应用还没初始化完成，稍等一下
  if (!AppInitializationManager.isInitialized()) {
    console.log('⏳ [AuthGuard] 等待应用初始化完成...');
    // 等待最多2秒，减少等待时间
    let attempts = 0;
    while (!AppInitializationManager.isInitialized() && attempts < 20) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (!AppInitializationManager.isInitialized()) {
      console.warn('⚠️ [AuthGuard] 应用初始化超时，但继续认证检查');
    } else {
      console.log('✅ [AuthGuard] 应用初始化完成');
    }
  }

  // 在应用初始化完成后，检查认证状态
  console.log('🔍 [AuthGuard] 检查认证状态:', {
    isAuthenticated: AuthManager.isAuthenticated(),
    hasAccessToken: !!AuthManager.getAccessToken(),
    isTokenExpired: AuthManager.isTokenExpired(),
    route: to.path,
  });

  // 检查用户是否已认证
  if (!AuthManager.isAuthenticated()) {
    console.log('🔒 [AuthGuard] 路由需要认证，但用户未登录，重定向到登录页');
    next({
      name: 'auth',
      query: {
        redirect: to.fullPath,
        reason: 'login_required',
      },
    });
    return;
  }

  // 检查token是否过期
  if (AuthManager.isTokenExpired()) {
    console.log('⏰ [AuthGuard] Token已过期，重定向到登录页');
    AuthManager.clearTokens();
    next({
      name: 'auth',
      query: {
        redirect: to.fullPath,
        reason: 'token_expired',
      },
    });
    return;
  }

  // ✅ 关键：登录后首次进入需要认证的路由时，初始化用户会话
  try {
    // 动态导入 account store
    const { useAccountStore } = await import('@/modules/account/presentation/stores/accountStore');
    const accountStore = useAccountStore();
    
    // 获取当前用户信息
    const currentAccount = accountStore.currentAccount;
    console.log('[AuthGuard] Current account:', currentAccount);
    
    if (currentAccount && currentAccount.uuid) {
      console.log('🔐 [AuthGuard] 初始化用户会话:', currentAccount.uuid);
      await AppInitializationManager.initializeUserSession(currentAccount.uuid);
      console.log('✅ [AuthGuard] 用户会话已初始化');
    } else {
      console.warn('⚠️ [AuthGuard] 无法获取当前用户信息，尝试从 token 获取');
      
      // 尝试从 token 解析用户信息
      const accessToken = AuthManager.getAccessToken();
      if (accessToken) {
        try {
          // 简单解析 JWT (不验证签名，只获取 payload)
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          const accountUuid = payload.sub || payload.accountUuid;
          
          if (accountUuid) {
            console.log('🔐 [AuthGuard] 从 token 获取到用户ID，初始化用户会话:', accountUuid);
            await AppInitializationManager.initializeUserSession(accountUuid);
            console.log('✅ [AuthGuard] 用户会话已初始化');
          } else {
            console.error('❌ [AuthGuard] Token 中没有用户ID');
          }
        } catch (parseError) {
          console.error('❌ [AuthGuard] 解析 token 失败:', parseError);
        }
      }
    }
  } catch (error) {
    console.error('❌ [AuthGuard] 用户会话初始化失败', error);
    // 可选：重定向到错误页或提示用户
  }

  // 如果认证有效，继续导航
  console.log('✅ [AuthGuard] 认证检查通过，继续导航');
  next();
};

/**
 * 权限守卫 - 检查用户是否有访问特定路由的权限
 */
export const permissionGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  // 获取路由所需的权限
  const requiredPermissions = to.matched
    .flatMap((record) => record.meta.permissions || [])
    .filter((permission, index, array) => array.indexOf(permission) === index); // 去重

  if (requiredPermissions.length > 0) {
    // 检查用户是否有所需权限
    // TODO: 实现权限检查逻辑
    // const userPermissions = authStore.user?.permissions || [];
    // const hasPermission = requiredPermissions.every(permission =>
    //   userPermissions.includes(permission)
    // );

    // 临时跳过权限检查
    const hasPermission = true;

    if (!hasPermission) {
      console.log('User lacks required permissions:', requiredPermissions);
      next({
        name: 'unauthorized',
        query: {
          from: to.fullPath,
          required: requiredPermissions.join(','),
        },
      });
      return;
    }
  }

  next();
};

/**
 * 页面标题守卫 - 设置页面标题
 */
export const titleGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  // 从路由元信息中获取标题
  const title = to.matched
    .slice()
    .reverse()
    .find((record) => record.meta.title)?.meta.title;

  if (title) {
    document.title = `${title} - DailyUse`;
  } else {
    document.title = 'DailyUse';
  }

  next();
};

/**
 * 登录重定向守卫 - 已登录用户访问认证页面时重定向
 */
export const loginRedirectGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  // 等待应用初始化完成
  const { AppInitializationManager } = await import('../initialization/AppInitializationManager');

  // 如果应用还没初始化完成，稍等一下
  if (!AppInitializationManager.isInitialized()) {
    console.log('⏳ [LoginRedirectGuard] 等待应用初始化完成...');
    let attempts = 0;
    while (!AppInitializationManager.isInitialized() && attempts < 20) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (!AppInitializationManager.isInitialized()) {
      console.warn('⚠️ [LoginRedirectGuard] 应用初始化超时，但继续导航检查');
    } else {
      console.log('✅ [LoginRedirectGuard] 应用初始化完成');
    }
  }

  // 如果访问登录页面，检查认证状态
  if (to.name === 'auth') {
    // 检查 token 是否过期
    if (AuthManager.isTokenExpired()) {
      console.log('⏰ [LoginRedirectGuard] Token已过期，清除认证状态');
      AuthManager.clearTokens();
      localStorage.removeItem('authentication');
      localStorage.removeItem('auth');
      // 继续到登录页
      next();
      return;
    }
    
    // 如果已认证且 token 有效，重定向到首页
    if (AuthManager.isAuthenticated()) {
      console.log('🔄 [LoginRedirectGuard] 用户已认证且token有效，重定向到首页');
      const redirect = (to.query.redirect as string) || '/';
      next(redirect);
      return;
    }
  }

  // 如果未认证或访问的不是认证页面，继续导航
  console.log('✅ [LoginRedirectGuard] 继续导航');
  next();
};

/**
 * 应用所有路由守卫
 */
export const applyRouterGuards = (router: any) => {
  // 全局前置守卫
  router.beforeEach(
    async (
      to: RouteLocationNormalized,
      from: RouteLocationNormalized,
      next: NavigationGuardNext,
    ) => {
      try {
        console.log(`🔀 [Router] 导航: ${from.path} → ${to.path}`);

        // 🦴 路由加载状态：立即显示骨架屏（仅在主应用内导航时）
        if (from.path !== to.path && from.matched.some(r => r.name === 'app') && to.matched.some(r => r.name === 'app')) {
          const { useRouteLoadingStore } = await import('../stores/routeLoadingStore');
          const routeLoadingStore = useRouteLoadingStore();
          routeLoadingStore.startLoading(to.path);
        }

        // 0. 预加载优化：用户进入登录页时，开始预加载业务模块（不阻塞导航）
        if (to.name === 'auth' && from.name !== 'auth') {
          const { AppInitializationManager } = await import('../initialization/AppInitializationManager');
          console.log('🔮 [Router] 检测到用户进入登录页，开始后台预加载业务模块...');
          AppInitializationManager.preloadAuthenticatedModules().catch((error) => {
            console.warn('⚠️ [Router] 业务模块预加载失败（不影响功能）:', error);
          });
        }

        // 1. 登录重定向检查
        if (to.name === 'auth') {
          await loginRedirectGuard(to, from, next);
          return;
        }

        // 2. 认证检查
        await authGuard(to, from, next);

        // authGuard 会处理所有情况并调用 next()
      } catch (error) {
        console.error('❌ [Router] 路由守卫错误:', error);
        next({ name: 'error', query: { message: 'Navigation failed' } });
      }
    },
  );

  // 全局后置钩子
  router.afterEach(async (to: RouteLocationNormalized) => {
    // 🦴 结束路由加载状态
    try {
      const { useRouteLoadingStore } = await import('../stores/routeLoadingStore');
      const routeLoadingStore = useRouteLoadingStore();
      // 添加微小延迟确保组件已渲染，避免闪烁
      setTimeout(() => {
        routeLoadingStore.finishLoading();
      }, 50);
    } catch (e) {
      // 忽略 store 未初始化的情况
    }

    // 设置页面标题
    const title = to.matched
      .slice()
      .reverse()
      .find((record) => record.meta.title)?.meta.title;

    if (title) {
      document.title = `${title} - DailyUse`;
    } else {
      document.title = 'DailyUse';
    }

    // 页面加载完成后的处理
    console.log(`Navigated to: ${to.path}`);
  });
};
