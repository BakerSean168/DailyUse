<template>
  <div class="settings-view">
    <!-- Header -->
    <div class="settings-header">
      <h1 class="text-h4 font-weight-bold">设置</h1>
      <div class="settings-actions">
        <v-btn
          variant="outlined"
          color="primary"
          prepend-icon="mdi-restore"
          @click="handleReset"
          :loading="settingStore.loading"
        >
          恢复默认
        </v-btn>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="settingStore.loading && !settingStore.isLoaded" class="text-center pa-8">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="text-body-1 mt-4">加载设置中...</p>
    </div>

    <!-- Content -->
    <div v-else-if="settingStore.isLoaded" class="settings-content">
      <v-tabs v-model="activeTab" class="mb-4">
        <v-tab value="appearance">
          <v-icon start>mdi-palette</v-icon>
          外观
        </v-tab>
        <v-tab value="locale">
          <v-icon start>mdi-earth</v-icon>
          区域
        </v-tab>
        <v-tab value="notifications">
          <v-icon start>mdi-bell</v-icon>
          通知
        </v-tab>
        <v-tab value="editor">
          <v-icon start>mdi-code-braces</v-icon>
          编辑器
        </v-tab>
        <v-tab value="shortcuts">
          <v-icon start>mdi-keyboard</v-icon>
          快捷键
        </v-tab>
        <v-tab value="workflow">
          <v-icon start>mdi-cog</v-icon>
          工作流
        </v-tab>
        <v-tab value="privacy">
          <v-icon start>mdi-shield-lock</v-icon>
          隐私
        </v-tab>
      </v-tabs>

      <v-window v-model="activeTab">
        <!-- 外观设置 -->
        <v-window-item value="appearance">
          <AppearanceSettings />
        </v-window-item>

        <!-- 区域设置 -->
        <v-window-item value="locale">
          <LocaleSettings />
        </v-window-item>

        <!-- 通知设置 -->
        <v-window-item value="notifications">
          <NotificationSettings />
        </v-window-item>

        <!-- 编辑器设置 -->
        <v-window-item value="editor">
          <EditorSettings />
        </v-window-item>

        <!-- 快捷键设置 -->
        <v-window-item value="shortcuts">
          <ShortcutSettings />
        </v-window-item>

        <!-- 工作流设置 -->
        <v-window-item value="workflow">
          <WorkflowSettings />
        </v-window-item>

        <!-- 隐私设置 -->
        <v-window-item value="privacy">
          <PrivacySettings />
        </v-window-item>
      </v-window>
    </div>

    <!-- Error State -->
    <div v-else-if="settingStore.error" class="text-center pa-8">
      <v-icon color="error" size="48">mdi-alert-circle</v-icon>
      <p class="text-body-1 mt-4 text-error">{{ settingStore.error }}</p>
      <v-btn color="primary" class="mt-4" @click="settingStore.loadSettings()">
        重新加载
      </v-btn>
    </div>

    <!-- Reset Confirmation Dialog -->
    <v-dialog v-model="showResetDialog" max-width="400">
      <v-card>
        <v-card-title>恢复默认设置</v-card-title>
        <v-card-text>
          确定要恢复所有设置为默认值吗？此操作不可撤销。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showResetDialog = false">取消</v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="confirmReset"
            :loading="settingStore.loading"
          >
            确定恢复
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserSettingStore } from '../stores/userSettingStore';
import AppearanceSettings from '../components/AppearanceSettings.vue';
import LocaleSettings from '../components/LocaleSettings.vue';
import NotificationSettings from '../components/NotificationSettings.vue';
import EditorSettings from '../components/EditorSettings.vue';
import ShortcutSettings from '../components/ShortcutSettings.vue';
import WorkflowSettings from '../components/WorkflowSettings.vue';
import PrivacySettings from '../components/PrivacySettings.vue';

const settingStore = useUserSettingStore();
const activeTab = ref('appearance');
const showResetDialog = ref(false);

onMounted(async () => {
  if (!settingStore.isLoaded) {
    await settingStore.loadSettings();
  }
  await settingStore.loadDefaults();
});

function handleReset() {
  showResetDialog.value = true;
}

async function confirmReset() {
  await settingStore.resetToDefaults();
  showResetDialog.value = false;
}
</script>

<style scoped>
.settings-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.settings-actions {
  display: flex;
  gap: 12px;
}

.settings-content {
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  padding: 24px;
}
</style>
