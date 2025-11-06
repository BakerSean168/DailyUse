<template>
  <v-container fluid>
    <!-- 页面头部已在设置内容中 -->

    <!-- 加载状态 -->
    <v-row v-if="initializing" justify="center">
      <v-col cols="12" class="text-center py-16">
        <v-progress-circular indeterminate color="primary" size="64" class="mb-4" />
        <p class="text-body-1">加载设置中...</p>
      </v-col>
    </v-row>

    <!-- 错误状态 -->
    <v-row v-else-if="error" justify="center">
      <v-col cols="12" md="6" class="text-center py-16">
        <v-icon size="64" color="error" class="mb-4">mdi-alert-circle</v-icon>
        <p class="text-h6 text-error mb-4">{{ error }}</p>
        <v-btn color="primary" @click="handleRetry">重试</v-btn>
      </v-col>
    </v-row>

    <!-- 设置内容 -->
    <v-row v-else>
      <v-col cols="12">
        <!-- 页面头部 -->
        <div class="settings-header mb-6">
          <h1 class="text-h4 font-weight-bold text-primary mb-2">
            <v-icon size="32" class="mr-2">mdi-cog</v-icon>
            {{ t('settings.title') || '设置' }}
          </h1>
          <p class="text-subtitle-1 text-medium-emphasis">
            {{ t('settings.description') || '管理您的个人偏好和应用配置' }}
          </p>
        </div>

        <v-card class="settings-card">
          <!-- 标签页导航 -->
          <v-tabs v-model="activeTab" bg-color="surface" color="primary">
            <v-tab v-for="tab in tabs" :key="tab.key" :value="tab.key">
              <v-icon start>{{ tab.icon }}</v-icon>
              {{ tab.label }}
            </v-tab>
          </v-tabs>

          <v-divider />

          <!-- 标签页内容 -->
          <v-window v-model="activeTab">
            <!-- 外观设置 -->
            <v-window-item value="appearance">
              <AppearanceSettings :auto-save="true" />
            </v-window-item>

            <!-- 语言和地区 -->
            <v-window-item value="locale">
              <LocaleSettings :auto-save="true" />
            </v-window-item>

            <!-- 工作流 -->
            <v-window-item value="workflow">
              <WorkflowSettings :auto-save="true" />
            </v-window-item>

            <!-- 通知 - 暂时注释，等后端实现 -->
            <!--
            <v-window-item value="notifications">
              <NotificationSettings :auto-save="true" />
            </v-window-item>
            -->

            <!-- 快捷键 -->
            <v-window-item value="shortcuts">
              <ShortcutSettings :auto-save="true" />
            </v-window-item>

            <!-- 隐私 -->
            <v-window-item value="privacy">
              <PrivacySettings :auto-save="true" />
            </v-window-item>

            <!-- 实验性功能 -->
            <v-window-item value="experimental">
              <ExperimentalSettings :auto-save="true" />
            </v-window-item>

            <!-- 高级操作 -->
            <v-window-item value="advanced">
              <v-container fluid>
                <SettingAdvancedActions
                  v-if="settings"
                  :settings="settings"
                  @update="handleSettingsUpdate"
                />
              </v-container>
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useUserSetting } from '../composables/useUserSetting';
import { useUserSettingStore } from '../stores/userSettingStore';
import { useAuthenticationStore } from '@/modules/authentication/presentation/stores/authenticationStore';
import AppearanceSettings from '../components/AppearanceSettings.vue';
import LocaleSettings from '../components/LocaleSettings.vue';
import WorkflowSettings from '../components/WorkflowSettings.vue';
// import NotificationSettings from '../components/NotificationSettings.vue'; // 暂时注释
import ShortcutSettings from '../components/ShortcutSettings.vue';
import PrivacySettings from '../components/PrivacySettings.vue';
import ExperimentalSettings from '../components/ExperimentalSettings.vue';
import SettingAdvancedActions from '../components/SettingAdvancedActions.vue';

// ===== I18n =====
const { t } = useI18n();

// ===== Router =====
const router = useRouter();

// ===== Stores =====
const settingStore = useUserSettingStore();
const authStore = useAuthenticationStore();

// ===== Composables =====
const { initialize } = useUserSetting();

// ===== Computed =====
const settings = computed(() => settingStore.settings);

// ===== 标签页配置 =====
const tabs = [
  { key: 'appearance', label: t('settings.appearance.title') || '外观', icon: 'mdi-palette' },
  { key: 'locale', label: t('settings.locale.title') || '语言和地区', icon: 'mdi-earth' },
  { key: 'workflow', label: t('settings.workflow.title') || '工作流', icon: 'mdi-cog-outline' },
  // Note: 通知设置尚未在后端实现，暂时注释
  // { key: 'notifications', label: t('settings.notifications.title') || '通知', icon: 'mdi-bell' },
  { key: 'shortcuts', label: t('settings.shortcuts.title') || '快捷键', icon: 'mdi-keyboard' },
  { key: 'privacy', label: t('settings.privacy.title') || '隐私', icon: 'mdi-shield-account' },
  { key: 'experimental', label: t('settings.experimental.title') || '实验性功能', icon: 'mdi-flask' },
  { key: 'advanced', label: t('settings.advanced.title') || '高级操作', icon: 'mdi-cog-sync' },
];

// ===== 状态 =====
const activeTab = ref('appearance');
const initializing = ref(true);
const error = ref('');

// ===== 生命周期 =====
onMounted(async () => {
  try {
    // 检查用户是否已认证
    if (!authStore.isAuthenticated) {
      error.value = t('settings.error.notAuthenticated') || '用户未登录';
      // 重定向到登录页面
      await router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
      return;
    }

    // 获取当前认证用户的 accountUuid
    const accountUuid = authStore.account?.uuid;
    if (!accountUuid) {
      error.value = t('settings.error.noAccountInfo') || '无法获取用户账户信息';
      console.error('User is authenticated but account UUID is missing');
      return;
    }

    // 初始化用户设置
    await initialize(accountUuid);
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('settings.error.initFailed') || '初始化设置失败';
    console.error('Failed to initialize user settings:', e);
  } finally {
    initializing.value = false;
  }
});

// ===== 事件处理 =====

/**
 * 重试加载
 */
const handleRetry = async () => {
  initializing.value = true;
  error.value = '';

  try {
    const mockAccountUuid = 'mock-account-uuid';
    await initialize(mockAccountUuid);
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('settings.error.initFailed') || '初始化设置失败';
    console.error('Failed to retry initialization:', e);
  } finally {
    initializing.value = false;
  }
};

/**
 * 处理设置更新
 */
const handleSettingsUpdate = async (updatedSettings: any) => {
  try {
    await settingStore.updateSettings(updatedSettings);
  } catch (e) {
    console.error('Failed to update settings:', e);
  }
};
</script>

<style scoped>
.settings-header {
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.05) 0%,
    rgba(var(--v-theme-secondary), 0.05) 100%
  );
  padding: 2rem;
  margin-bottom: 2rem;
}

.settings-card {
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.settings-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
}

/* 深色主题适配 */
.v-theme--dark .settings-header {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.1) 0%,
    rgba(var(--v-theme-secondary), 0.1) 100%
  );
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-header {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
}
</style>
