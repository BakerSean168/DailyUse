/**
 * Service Worker Registration
 * Service Worker 注册和管理
 */

// Service Worker 注册状态
let registration: ServiceWorkerRegistration | null = null;

/**
 * 检查是否支持 Service Worker
 */
export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};

/**
 * 注册 Service Worker
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isServiceWorkerSupported()) {
    console.log('⚠️ [SW] Service Worker not supported');
    return null;
  }

  // 开发环境下不注册 SW（避免缓存导致的开发问题）
  if (import.meta.env.DEV) {
    console.log('🔧 [SW] Skipping registration in development mode');
    return null;
  }

  try {
    console.log('🔧 [SW] Registering Service Worker...');
    
    registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      // 每次访问都检查更新
      updateViaCache: 'none',
    });

    console.log('✅ [SW] Service Worker registered:', registration.scope);

    // 监听更新
    registration.addEventListener('updatefound', () => {
      const newWorker = registration?.installing;
      
      if (newWorker) {
        console.log('🔄 [SW] New Service Worker installing...');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 新 SW 已安装，提示用户刷新
            console.log('🆕 [SW] New version available! Refresh to update.');
            
            // 触发自定义事件，让 UI 可以显示更新提示
            window.dispatchEvent(new CustomEvent('sw:update-available', {
              detail: { registration }
            }));
          }
        });
      }
    });

    // 定期检查更新（每小时）
    setInterval(() => {
      registration?.update();
    }, 60 * 60 * 1000);

    return registration;
  } catch (error) {
    console.error('❌ [SW] Registration failed:', error);
    return null;
  }
};

/**
 * 卸载 Service Worker
 */
export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (!registration) {
    return false;
  }

  try {
    const success = await registration.unregister();
    console.log('🗑️ [SW] Service Worker unregistered:', success);
    registration = null;
    return success;
  } catch (error) {
    console.error('❌ [SW] Unregistration failed:', error);
    return false;
  }
};

/**
 * 跳过等待，立即激活新 SW
 */
export const skipWaiting = (): void => {
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
};

/**
 * 清除所有缓存
 */
export const clearAllCaches = async (): Promise<void> => {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
  }
  
  // 也清除主线程可以访问的缓存
  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
    console.log('🗑️ [SW] All caches cleared');
  }
};

/**
 * 获取缓存信息
 */
export const getCacheInfo = (): Promise<Array<{ name: string; count: number }>> => {
  return new Promise((resolve) => {
    if (!navigator.serviceWorker.controller) {
      resolve([]);
      return;
    }

    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      if (event.data?.type === 'CACHE_INFO') {
        resolve(event.data.data);
      }
    };

    navigator.serviceWorker.controller.postMessage(
      { type: 'GET_CACHE_INFO' },
      [messageChannel.port2]
    );

    // 超时处理
    setTimeout(() => resolve([]), 3000);
  });
};

/**
 * 监听 SW 控制器变化（用于刷新页面）
 */
export const onControllerChange = (callback: () => void): void => {
  navigator.serviceWorker.addEventListener('controllerchange', callback);
};
