import { createApp, nextTick } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import router from './shared/router';
import vuetify from './shared/vuetify';
import { i18n } from './shared/i18n';
import { AppInitializationManager } from './shared/initialization/AppInitializationManager';
import { eventBus } from '@dailyuse/utils';
import { initializeLogger, getStartupInfo } from './config/logger.config';
import { createLogger } from '@dailyuse/utils';

// 初始化日志系统
initializeLogger();
const logger = createLogger('WebApp');

// 将 eventBus 挂载到全局 window 对象，供调试脚本使用
if (typeof window !== 'undefined') {
  (window as any).eventBus = eventBus;
  logger.debug('EventBus mounted to window object for debugging');
}

// 导入事件系统示例（开发环境）
if (import.meta.env.DEV) {
  import('./shared/examples/eventSystemExample');
  import('./shared/debug/eventDebug');
  import('./modules/theme/debug/themeDebug');
}

async function startApp() {
  logger.info('Starting Vue application...', getStartupInfo());

  const app = createApp(App);
  const pinia = createPinia();
  pinia.use(piniaPluginPersistedstate);

  app.use(pinia).use(router).use(vuetify).use(i18n);

  let vueAppInstance: any = null;
  let isAppMounted = false;

  try {
    // 先完成应用模块初始化（包括认证状态恢复）
    logger.info('Initializing application modules...');
    await AppInitializationManager.initializeApp();
    logger.info('Application modules initialized successfully');

    // 然后挂载应用
    logger.debug('Mounting application to DOM...');
    vueAppInstance = app.mount('#app');
    isAppMounted = true;
    logger.info('Application mounted to DOM successfully');

    // 等待下一个 tick 并确认挂载成功
    await nextTick(() => {
      logger.info('Vue application started successfully', {
        route: window.location.pathname,
        hasInstance: !!vueAppInstance,
        hasDOMRoot: !!document.getElementById('app'),
      });
    });
  } catch (error) {
    logger.error('Application startup failed', error);

    // 如果应用还没挂载，尝试降级启动
    if (!isAppMounted) {
      logger.warn('Attempting fallback startup (app not mounted)...');
      try {
        vueAppInstance = app.mount('#app');
        isAppMounted = true;
        logger.warn('Application started in fallback mode', {
          route: window.location.pathname,
        });
      } catch (mountError) {
        logger.error('Application mount completely failed', mountError);
      }
    } else {
      logger.warn('Application mounted but post-initialization failed', {
        route: window.location.pathname,
      });
    }
  }
}

// 启动应用
startApp();
