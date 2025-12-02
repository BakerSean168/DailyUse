<template>
  <v-container fluid class="settings-view pa-0 fill-height">
    <!-- 加载状态 -->
    <div v-if="loading" class="d-flex align-center justify-center fill-height">
      <div class="text-center">
        <v-progress-circular indeterminate color="primary" size="64" class="mb-4" />
        <p class="text-body-1">{{ t('settings.messages.loading', '加载设置中...') }}</p>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="d-flex align-center justify-center fill-height">
      <div class="text-center pa-8">
        <v-icon size="64" color="error" class="mb-4">mdi-alert-circle</v-icon>
        <p class="text-h6 text-error mb-4">{{ error }}</p>
        <v-btn color="primary" @click="handleRetry">{{ t('settings.actions.retry', '重试') }}</v-btn>
      </div>
    </div>

    <!-- 设置内容 - 左右布局 -->
    <div v-else class="settings-layout fill-height">
      <!-- 左侧导航栏 - 使用普通 div 而不是 v-navigation-drawer -->
      <aside class="settings-nav">
        <div class="pa-4">
          <h2 class="text-h5 font-weight-bold mb-2">
            <v-icon size="28" class="mr-2">mdi-cog</v-icon>
            {{ t('settings.title', '设置') }}
          </h2>
          <p class="text-caption text-medium-emphasis">
            {{ t('settings.description', '管理您的个人偏好') }}
          </p>
        </div>

        <v-divider class="my-2" />

        <!-- 导航列表 -->
        <v-list nav density="comfortable">
          <template v-for="item in navItems" :key="item.key">
            <!-- 有子项的导航 -->
            <v-list-group v-if="item.children && item.children.length > 0" :value="item.key">
              <template #activator="{ props }">
                <v-list-item v-bind="props" :prepend-icon="item.icon" :title="item.label"
                  :active="isParentActive(item)" />
              </template>

              <v-list-item v-for="child in item.children" :key="child.key" :value="child.key" :prepend-icon="child.icon"
                :title="child.label" :active="activeSection === child.key" @click="scrollToSection(child.key)" />
            </v-list-group>

            <!-- 无子项的导航 -->
            <v-list-item v-else :value="item.key" :prepend-icon="item.icon" :title="item.label"
              :active="activeSection === item.key" @click="scrollToSection(item.key)" />
          </template>
        </v-list>
      </aside>

      <!-- 右侧内容区域 -->
      <main class="settings-content flex-grow-1">
        <v-container fluid class="py-6 px-8">
          <!-- 外观设置 -->
          <section id="section-appearance" class="settings-section mb-8">
            <h3 class="text-h5 font-weight-bold mb-2">
              {{ t('settings.nav.appearance', '外观') }}
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ t('settings.appearance.description', '自定义应用的视觉效果') }}
            </p>
            <AppearanceSettings :auto-save="true" />
          </section>

          <v-divider class="my-8" />

          <!-- 语言与区域设置 -->
          <section id="section-locale" class="settings-section mb-8">
            <h3 class="text-h5 font-weight-bold mb-2">
              {{ t('settings.nav.locale', '语言与区域') }}
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ t('settings.locale.description', '设置语言、时区和格式偏好') }}
            </p>
            <LocaleSettings :auto-save="true" />
          </section>

          <v-divider class="my-8" />

          <!-- 工作流设置 -->
          <section id="section-workflow" class="settings-section mb-8">
            <h3 class="text-h5 font-weight-bold mb-2">
              {{ t('settings.nav.workflow', '工作流') }}
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ t('settings.workflow.description', '自定义工作方式和默认行为') }}
            </p>
            <WorkflowSettings :auto-save="true" />
          </section>

          <v-divider class="my-8" />

          <!-- 仓储设置 -->
          <section id="section-repository" class="settings-section mb-8">
            <h3 class="text-h5 font-weight-bold mb-2">
              {{ t('settings.nav.repository', '仓储') }}
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ t('settings.repository.description', '配置仓储的资源管理和图片处理') }}
            </p>
            <RepositorySettings :auto-save="true" />
          </section>

          <v-divider class="my-8" />

          <!-- 编辑器设置 -->
          <section id="section-editor" class="settings-section mb-8">
            <h3 class="text-h5 font-weight-bold mb-2">
              {{ t('settings.nav.editor', '编辑器') }}
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ t('settings.editor.description', '配置笔记编辑器的行为和显示') }}
            </p>
            <EditorSettings :auto-save="true" />
          </section>

          <v-divider class="my-8" />

          <!-- 快捷键设置 -->
          <section id="section-shortcuts" class="settings-section mb-8">
            <h3 class="text-h5 font-weight-bold mb-2">
              {{ t('settings.nav.shortcuts', '快捷键') }}
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ t('settings.shortcuts.description', '自定义键盘快捷键') }}
            </p>
            <ShortcutSettings :auto-save="true" />
          </section>

          <v-divider class="my-8" />

          <!-- 隐私设置 -->
          <section id="section-privacy" class="settings-section mb-8">
            <h3 class="text-h5 font-weight-bold mb-2">
              {{ t('settings.nav.privacy', '隐私') }}
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ t('settings.privacy.description', '控制您的隐私和数据共享') }}
            </p>
            <PrivacySettings :auto-save="true" />
          </section>

          <v-divider class="my-8" />

          <!-- 实验性功能设置 -->
          <section id="section-experimental" class="settings-section mb-8">
            <h3 class="text-h5 font-weight-bold mb-2">
              {{ t('settings.nav.experimental', '实验性功能') }}
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ t('settings.experimental.description', '体验尚在开发中的新功能') }}
            </p>
            <v-alert type="warning" variant="tonal" class="mb-4">
              {{ t('settings.experimental.warning', '⚠️ 实验性功能可能不稳定，使用时请注意保存数据') }}
            </v-alert>
            <ExperimentalSettings :auto-save="true" />
          </section>

          <v-divider class="my-8" />

          <!-- AI 服务设置 -->
          <section id="section-ai" class="settings-section mb-8">
            <h3 class="text-h5 font-weight-bold mb-2">
              {{ t('settings.nav.ai', 'AI 服务') }}
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ t('settings.ai.description', '配置 AI 服务提供商以使用智能功能') }}
            </p>
            <AIProviderSettings />
          </section>

          <v-divider class="my-8" />

          <!-- 高级操作 -->
          <section id="section-advanced" class="settings-section mb-8">
            <h3 class="text-h5 font-weight-bold mb-2">
              {{ t('settings.nav.advanced', '高级') }}
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ t('settings.advanced.description', '高级设置和数据管理') }}
            </p>
            <SettingAdvancedActions v-if="userSetting" :settings="userSetting" @update="handleSettingsUpdate" />
          </section>
        </v-container>
      </main>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthenticationStore } from '@/modules/authentication/presentation/stores/authenticationStore';
import { useUserSetting } from '../composables/useUserSetting';

// 组件导入
import AppearanceSettings from '../components/AppearanceSettings.vue';
import LocaleSettings from '../components/LocaleSettings.vue';
import WorkflowSettings from '../components/WorkflowSettings.vue';
import ShortcutSettings from '../components/ShortcutSettings.vue';
import PrivacySettings from '../components/PrivacySettings.vue';
import ExperimentalSettings from '../components/ExperimentalSettings.vue';
import SettingAdvancedActions from '../components/SettingAdvancedActions.vue';
import AIProviderSettings from '@/modules/ai/presentation/components/AIProviderSettings.vue';
import RepositorySettings from '../components/RepositorySettings.vue';
import EditorSettings from '../components/EditorSettings.vue';

const router = useRouter();
const { t } = useI18n();
const authStore = useAuthenticationStore();
const {
  userSetting,
  loading,
  error,
  initialize,
  updateAppearance,
  updateLocale,
  updateWorkflow,
  updatePrivacy
} = useUserSetting();

// 当前激活的section
const activeSection = ref('appearance');

// 导航项类型定义
interface NavItem {
  key: string;
  label: string;
  icon: string;
  children?: NavItem[];
}

// 导航项配置
const navItems = computed<NavItem[]>(() => [
  {
    key: 'appearance',
    label: t('settings.nav.appearance', '外观'),
    icon: 'mdi-palette',
  },
  {
    key: 'locale',
    label: t('settings.nav.locale', '语言与区域'),
    icon: 'mdi-translate',
  },
  {
    key: 'workflow',
    label: t('settings.nav.workflow', '工作流'),
    icon: 'mdi-arrow-decision',
  },
  {
    key: 'repository',
    label: t('settings.nav.repository', '仓储'),
    icon: 'mdi-database-outline',
  },
  {
    key: 'editor',
    label: t('settings.nav.editor', '编辑器'),
    icon: 'mdi-file-document-edit-outline',
  },
  {
    key: 'shortcuts',
    label: t('settings.nav.shortcuts', '快捷键'),
    icon: 'mdi-keyboard',
  },
  {
    key: 'privacy',
    label: t('settings.nav.privacy', '隐私'),
    icon: 'mdi-shield-account',
  },
  {
    key: 'experimental',
    label: t('settings.nav.experimental', '实验性功能'),
    icon: 'mdi-flask',
  },
  {
    key: 'ai',
    label: t('settings.nav.ai', 'AI 服务'),
    icon: 'mdi-robot',
  },
  {
    key: 'advanced',
    label: t('settings.nav.advanced', '高级'),
    icon: 'mdi-cog-outline',
  },
]);

// 判断父级导航是否激活
const isParentActive = (item: NavItem) => {
  if (!item.children) return false;
  return item.children.some((child: NavItem) => child.key === activeSection.value);
};

// 滚动到指定section
const scrollToSection = (sectionKey: string) => {
  activeSection.value = sectionKey;
  const element = document.getElementById(`section-${sectionKey}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// 监听滚动，更新激活的section
const handleScroll = () => {
  const sections = navItems.value.map(item => {
    const el = document.getElementById(`section-${item.key}`);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      key: item.key,
      top: rect.top,
      bottom: rect.bottom,
    };
  }).filter(Boolean);

  // 找到视口中最靠近顶部的section
  const activeItem = sections.find(section =>
    section && section.top >= 0 && section.top <= 200
  ) || sections.find(section =>
    section && section.top <= 0 && section.bottom > 200
  );

  if (activeItem) {
    activeSection.value = activeItem.key;
  }
};

// 处理设置更新（从高级操作组件触发）
const handleSettingsUpdate = async (updates: any) => {
  try {
    // 根据更新内容调用相应的方法
    if (updates.appearance) {
      await updateAppearance(updates.appearance);
    }
    if (updates.locale) {
      await updateLocale(updates.locale);
    }
    if (updates.workflow) {
      await updateWorkflow(updates.workflow);
    }
    if (updates.privacy) {
      await updatePrivacy(updates.privacy);
    }
  } catch (err) {
    console.error('Failed to update settings:', err);
  }
};

// 重试加载
const handleRetry = async () => {
  const accountUuid = authStore.account?.uuid;
  if (accountUuid) {
    await initialize(accountUuid);
  }
};

// 初始化
onMounted(async () => {
  // 检查认证状态
  if (!authStore.isAuthenticated) {
    const currentPath = router.currentRoute.value.fullPath;
    await router.push({ name: 'login', query: { redirect: currentPath } });
    return;
  }

  const accountUuid = authStore.account?.uuid;
  if (!accountUuid) {
    error.value = t('settings.messages.noAccountInfo', '无法获取账户信息');
    return;
  }

  // 初始化设置
  await initialize(accountUuid);

  // 添加滚动监听
  const contentEl = document.querySelector('.settings-content');
  if (contentEl) {
    contentEl.addEventListener('scroll', handleScroll);
  }
});

// 清理
onUnmounted(() => {
  const contentEl = document.querySelector('.settings-content');
  if (contentEl) {
    contentEl.removeEventListener('scroll', handleScroll);
  }
});
</script>

<style scoped lang="scss">
.settings-view {
  background-color: rgb(var(--v-theme-background));
  height: 100%;
}

.settings-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.settings-nav {
  width: 260px;
  flex-shrink: 0;
  overflow-y: auto;
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background-color: rgb(var(--v-theme-surface));

  :deep(.v-list-item) {
    border-radius: 8px;
    margin: 2px 8px;

    &.v-list-item--active {
      background-color: rgba(var(--v-theme-primary), 0.12);
      color: rgb(var(--v-theme-primary));

      .v-icon {
        color: rgb(var(--v-theme-primary));
      }
    }

    &:hover:not(.v-list-item--active) {
      background-color: rgba(var(--v-theme-on-surface), 0.04);
    }
  }

  :deep(.v-list-group) {
    .v-list-item {
      padding-left: 16px !important;
    }

    .v-list-group__items {
      .v-list-item {
        padding-left: 48px !important;
      }
    }
  }
}

.settings-content {
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
}

.settings-section {
  scroll-margin-top: 20px;

  &:target {
    animation: highlight 1s ease-in-out;
  }
}

@keyframes highlight {

  0%,
  100% {
    background-color: transparent;
  }

  50% {
    background-color: rgba(var(--v-theme-primary), 0.05);
  }
}
</style>
