/**
 * Repository View Store
 * 管理仓储视图模式和资源过滤
 */

import { defineStore } from 'pinia';
import { ResourceType } from '@dailyuse/contracts/repository';
import type { ImageEmbedMode } from '@dailyuse/contracts/repository';

// Re-export for convenience
export type { ImageEmbedMode };

/**
 * 视图模式
 */
export type ViewMode = 'notes' | 'resources';

/**
 * Repository 设置
 */
export interface RepositorySettings {
  // 图片嵌入方式
  imageEmbedMode: ImageEmbedMode;
  // 是否压缩图片
  imageCompression: boolean;
  // 压缩质量 (0-100)
  compressionQuality: number;
  // 是否自动转换为 WebP
  autoConvertToWebP: boolean;
  // 最大图片宽度 (自动调整尺寸)
  maxImageWidth: number;
  // 自动嵌入阈值 (KB) - auto 模式下，小于此值自动嵌入
  autoEmbedThreshold: number;
}

/**
 * Editor 设置
 */
export interface EditorSettings {
  // 默认编辑模式
  defaultMode: 'reading' | 'editing';
  // 自动保存延迟 (ms)
  autoSaveDelay: number;
  // 启用链接预览
  enableLinkPreview: boolean;
  // 启用媒体嵌入
  enableMediaEmbed: boolean;
  // 支持的视频网站
  supportedVideoSites: string[];
  // 显示行号
  showLineNumbers: boolean;
  // 字体大小
  fontSize: number;
  // 显示字数统计
  showWordCount: boolean;
}

/**
 * 资源过滤器
 */
export interface ResourceFilter {
  types: ResourceType[];
  showHidden: boolean;
}

export const useRepositoryViewStore = defineStore('repositoryView', {
  state: () => ({
    // 视图模式
    viewMode: 'notes' as ViewMode,
    
    // 资源过滤器
    resourceFilter: {
      types: [] as ResourceType[],
      showHidden: false,
    } as ResourceFilter,

    // 仓储设置
    repositorySettings: {
      imageEmbedMode: 'link' as ImageEmbedMode,
      imageCompression: false,
      compressionQuality: 80,
      autoConvertToWebP: false,
      maxImageWidth: 1920,
      autoEmbedThreshold: 100, // 100KB
    } as RepositorySettings,

    // 编辑器设置
    editorSettings: {
      defaultMode: 'reading' as 'reading' | 'editing',
      autoSaveDelay: 500,
      enableLinkPreview: true,
      enableMediaEmbed: true,
      supportedVideoSites: ['youtube.com', 'bilibili.com', 'youku.com', 'vimeo.com'],
      showLineNumbers: false,
      fontSize: 16,
      showWordCount: true,
    } as EditorSettings,
  }),

  getters: {
    /**
     * 是否为笔记模式
     */
    isNotesMode: (state) => state.viewMode === 'notes',

    /**
     * 是否为资源模式
     */
    isResourcesMode: (state) => state.viewMode === 'resources',

    /**
     * 获取需要在文件树中显示的资源类型
     * 笔记模式下只显示 MARKDOWN
     * 资源模式下显示所有类型（或按过滤器）
     */
    visibleResourceTypes: (state): ResourceType[] => {
      if (state.viewMode === 'notes') {
        return [ResourceType.MARKDOWN];
      }
      
      // 资源模式下，如果有过滤器则使用过滤器，否则显示所有非笔记资源
      if (state.resourceFilter.types.length > 0) {
        return state.resourceFilter.types;
      }
      
      return [
        ResourceType.IMAGE,
        ResourceType.VIDEO,
        ResourceType.AUDIO,
        ResourceType.PDF,
        ResourceType.LINK,
        ResourceType.CODE,
        ResourceType.OTHER,
      ];
    },

    /**
     * 获取图片嵌入模式
     */
    imageEmbedMode: (state) => state.repositorySettings.imageEmbedMode,

    /**
     * 是否自动嵌入小图片
     */
    shouldAutoEmbed: (state) => state.repositorySettings.imageEmbedMode === 'auto',
  },

  actions: {
    /**
     * 切换视图模式
     */
    setViewMode(mode: ViewMode) {
      this.viewMode = mode;
    },

    /**
     * 切换到笔记模式
     */
    switchToNotesMode() {
      this.viewMode = 'notes';
    },

    /**
     * 切换到资源模式
     */
    switchToResourcesMode() {
      this.viewMode = 'resources';
    },

    /**
     * 设置资源类型过滤器
     */
    setResourceTypeFilter(types: ResourceType[]) {
      this.resourceFilter.types = types;
    },

    /**
     * 添加资源类型到过滤器
     */
    addResourceTypeFilter(type: ResourceType) {
      if (!this.resourceFilter.types.includes(type)) {
        this.resourceFilter.types.push(type);
      }
    },

    /**
     * 从过滤器移除资源类型
     */
    removeResourceTypeFilter(type: ResourceType) {
      const index = this.resourceFilter.types.indexOf(type);
      if (index > -1) {
        this.resourceFilter.types.splice(index, 1);
      }
    },

    /**
     * 清除资源类型过滤器
     */
    clearResourceTypeFilter() {
      this.resourceFilter.types = [];
    },

    /**
     * 切换显示隐藏文件
     */
    toggleShowHidden() {
      this.resourceFilter.showHidden = !this.resourceFilter.showHidden;
    },

    /**
     * 更新仓储设置
     */
    updateRepositorySettings(settings: Partial<RepositorySettings>) {
      this.repositorySettings = { ...this.repositorySettings, ...settings };
    },

    /**
     * 更新编辑器设置
     */
    updateEditorSettings(settings: Partial<EditorSettings>) {
      this.editorSettings = { ...this.editorSettings, ...settings };
    },

    /**
     * 设置图片嵌入模式
     */
    setImageEmbedMode(mode: ImageEmbedMode) {
      this.repositorySettings.imageEmbedMode = mode;
    },

    /**
     * 设置图片压缩
     */
    setImageCompression(enabled: boolean, quality?: number) {
      this.repositorySettings.imageCompression = enabled;
      if (quality !== undefined) {
        this.repositorySettings.compressionQuality = quality;
      }
    },

    /**
     * 重置为默认设置
     */
    resetToDefaults() {
      this.viewMode = 'notes';
      this.resourceFilter = {
        types: [],
        showHidden: false,
      };
      this.repositorySettings = {
        imageEmbedMode: 'link',
        imageCompression: false,
        compressionQuality: 80,
        autoConvertToWebP: false,
        maxImageWidth: 1920,
        autoEmbedThreshold: 100,
      };
      this.editorSettings = {
        defaultMode: 'reading',
        autoSaveDelay: 500,
        enableLinkPreview: true,
        enableMediaEmbed: true,
        supportedVideoSites: ['youtube.com', 'bilibili.com', 'youku.com', 'vimeo.com'],
        showLineNumbers: false,
        fontSize: 16,
        showWordCount: true,
      };
    },
  },

  persist: {
    key: 'repository-view-store',
    storage: localStorage,
    pick: ['viewMode', 'resourceFilter', 'repositorySettings', 'editorSettings'],
  },
});

export type RepositoryViewStore = ReturnType<typeof useRepositoryViewStore>;
