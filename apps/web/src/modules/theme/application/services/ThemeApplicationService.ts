/**
 * Theme Application Service
 * 主题应用服务
 * 
 * 负责协调主题的加载、保存、应用逻辑
 * 实现混合策略：未登录用户使用 LocalStorage，已登录用户使用服务器设置
 */

import { ref, watch } from 'vue';
import type { ThemeConfig } from '../../domain/ThemeConfig';
import { DEFAULT_THEME_CONFIG } from '../../domain/ThemeConfig';
import { LocalThemeStorage } from '../../infrastructure/LocalThemeStorage';
import { VuetifyThemeService } from './VuetifyThemeService';
import { ThemeEventListener } from '../listeners/ThemeEventListener';
import { useAuthenticationStore } from '../../../authentication/presentation/stores/authenticationStore';
import { useUserSettingStore } from '../../../setting/presentation/stores/userSettingStore';

export class ThemeApplicationService {
  private static instance: ThemeApplicationService | null = null;
  
  private vuetifyService: VuetifyThemeService;
  private eventListener: ThemeEventListener;
  private currentTheme = ref<ThemeConfig>(DEFAULT_THEME_CONFIG);
  private isInitialized = false;

  private constructor() {
    this.vuetifyService = new VuetifyThemeService();
    this.eventListener = new ThemeEventListener(this.vuetifyService);
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ThemeApplicationService {
    if (!ThemeApplicationService.instance) {
      ThemeApplicationService.instance = new ThemeApplicationService();
    }
    return ThemeApplicationService.instance;
  }

  /**
   * 初始化主题服务
   * 
   * 策略：
   * 1. 检查用户是否登录
   * 2. 已登录：从用户设置加载主题
   * 3. 未登录：从 LocalStorage 加载主题
   * 4. 应用主题到 Vuetify
   * 5. 监听主题变化
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ [ThemeApplicationService] 已初始化，跳过');
      return;
    }

    console.log('🚀 [ThemeApplicationService] 初始化主题服务...');

    const authStore = useAuthenticationStore();
    const settingStore = useUserSettingStore();

    // 1. 加载主题配置
    let themeConfig: ThemeConfig;

    if (authStore.isAuthenticated && settingStore.isLoaded) {
      // 已登录且设置已加载 -> 使用用户设置
      themeConfig = this.mapFromUserSettings(settingStore.appearance);
      console.log('✅ [ThemeApplicationService] 使用用户设置的主题');
    } else {
      // 未登录或设置未加载 -> 使用 LocalStorage
      const localTheme = LocalThemeStorage.load();
      themeConfig = localTheme || DEFAULT_THEME_CONFIG;
      console.log(
        localTheme
          ? '✅ [ThemeApplicationService] 使用 LocalStorage 的主题'
          : '✅ [ThemeApplicationService] 使用默认主题'
      );
    }

    // 2. 应用主题
    this.currentTheme.value = themeConfig;
    this.vuetifyService.applyTheme(themeConfig);

    // 3. 启动事件监听器（监听来自 Setting 模块的事件）
    this.eventListener.startListening();

    // 4. 监听用户设置变化（已登录用户）
    if (authStore.isAuthenticated) {
      this.watchUserSettings();
    }

    // 5. 监听认证状态变化
    this.watchAuthenticationState();

    this.isInitialized = true;
    console.log('✅ [ThemeApplicationService] 主题服务初始化完成');
  }

  /**
   * 更新主题配置
   * 
   * @param config 新的主题配置
   * @param saveToServer 是否保存到服务器（已登录用户）
   */
  async updateTheme(config: Partial<ThemeConfig>, saveToServer = true): Promise<void> {
    const authStore = useAuthenticationStore();
    const settingStore = useUserSettingStore();

    const newConfig: ThemeConfig = {
      ...this.currentTheme.value,
      ...config,
    };

    console.log('🎨 [ThemeApplicationService] 更新主题:', config);

    // 1. 立即应用到 UI
    this.currentTheme.value = newConfig;
    this.vuetifyService.applyTheme(newConfig);

    // 2. 持久化
    if (authStore.isAuthenticated && saveToServer) {
      // 已登录 -> 保存到服务器
      try {
        await settingStore.updateAppearance(this.mapToUserSettings(newConfig));
        console.log('✅ [ThemeApplicationService] 主题已保存到服务器');
      } catch (error) {
        console.error('❌ [ThemeApplicationService] 保存主题到服务器失败:', error);
      }
    } else {
      // 未登录 -> 保存到 LocalStorage
      LocalThemeStorage.save(newConfig);
    }
  }

  /**
   * 获取当前主题配置
   */
  getCurrentTheme(): ThemeConfig {
    return { ...this.currentTheme.value };
  }

  /**
   * 监听用户设置变化
   */
  private watchUserSettings(): void {
    const settingStore = useUserSettingStore();

    watch(
      () => settingStore.appearance,
      (appearance) => {
        if (!appearance) return;

        const newTheme = this.mapFromUserSettings(appearance);
        console.log('🔄 [ThemeApplicationService] 用户设置变化，应用新主题');

        this.currentTheme.value = newTheme;
        this.vuetifyService.applyTheme(newTheme);
      },
      { deep: true }
    );

    console.log('👂 [ThemeApplicationService] 开始监听用户设置变化');
  }

  /**
   * 监听认证状态变化
   */
  private watchAuthenticationState(): void {
    const authStore = useAuthenticationStore();

    watch(
      () => authStore.isAuthenticated,
      async (isAuthenticated) => {
        if (isAuthenticated) {
          // 用户登录 -> 切换到用户设置
          console.log('🔐 [ThemeApplicationService] 用户登录，加载用户设置的主题');
          const settingStore = useUserSettingStore();
          
          // 等待设置加载
          if (!settingStore.isLoaded) {
            await settingStore.loadSettings();
          }

          const userTheme = this.mapFromUserSettings(settingStore.appearance);
          this.currentTheme.value = userTheme;
          this.vuetifyService.applyTheme(userTheme);

          // 开始监听用户设置
          this.watchUserSettings();
        } else {
          // 用户登出 -> 切换到 LocalStorage
          console.log('🔓 [ThemeApplicationService] 用户登出，加载本地主题');
          const localTheme = LocalThemeStorage.load() || DEFAULT_THEME_CONFIG;
          this.currentTheme.value = localTheme;
          this.vuetifyService.applyTheme(localTheme);
        }
      }
    );

    console.log('👂 [ThemeApplicationService] 开始监听认证状态变化');
  }

  /**
   * 从用户设置映射到主题配置
   */
  private mapFromUserSettings(appearance: any): ThemeConfig {
    return {
      mode: appearance.theme || 'AUTO',
      accentColor: appearance.accentColor || '#1976D2',
      fontSize: appearance.fontSize || 'MEDIUM',
      fontFamily: appearance.fontFamily || null,
      compactMode: appearance.compactMode || false,
    };
  }

  /**
   * 从主题配置映射到用户设置
   */
  private mapToUserSettings(config: ThemeConfig): any {
    return {
      theme: config.mode,
      accentColor: config.accentColor,
      fontSize: config.fontSize,
      fontFamily: config.fontFamily,
      compactMode: config.compactMode,
    };
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.eventListener.stopListening();
    this.vuetifyService.dispose();
    this.isInitialized = false;
    console.log('🧹 [ThemeApplicationService] 主题服务已清理');
  }
}
