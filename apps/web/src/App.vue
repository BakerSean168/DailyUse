<template>
  <v-app>
    <div v-if="isLoading" class="loading-container">
      <!-- 使用 @dailyuse/assets 中的 logo -->
      <img :src="logo" alt="DailyUse Logo" class="loading-logo mb-4" />
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">正在初始化应用...</p>
    </div>
    <router-view v-else></router-view>

    <!-- 全局 Snackbar 组件 -->
    <GlobalSnackbar />

    <!-- 应用内通知组件 -->
    <InAppNotification />

    <!-- 命令面板 (Cmd/Ctrl + K) - 按需加载 -->
    <component
      v-if="showCommandPalette"
      :is="CommandPalette"
      v-model="showCommandPalette"
      :goals="goals"
      :tasks="tasks"
      :reminders="reminders"
    />
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, defineAsyncComponent, shallowRef } from 'vue';
import { useSettingStore } from '@/modules/setting/presentation/stores/settingStore';
import GlobalSnackbar from '@/shared/components/GlobalSnackbar.vue';
import InAppNotification from '@/modules/notification/presentation/components/InAppNotification.vue';
import { logo128 as logo } from '@dailyuse/assets';
import { getThemeService } from '@/modules/setting/application/services/ThemeService';

const isLoading = ref(true);
const showCommandPalette = ref(false);
const settingStore = useSettingStore();

// 懒加载命令面板组件和搜索数据
const CommandPalette = shallowRef<any>(null);
const goals = ref<any[]>([]);
const tasks = ref<any[]>([]);
const reminders = ref<any[]>([]);

// 监听快捷键，按需加载命令面板
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', async (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      
      // 首次打开时才加载组件和数据
      if (!CommandPalette.value) {
        console.log('⏳ 正在加载命令面板...');
        const [paletteModule, providerModule] = await Promise.all([
          import('@/shared/components/command-palette/CommandPalette.vue'),
          import('@/shared/services/SearchDataProvider'),
        ]);
        
        CommandPalette.value = paletteModule.default;
        const { searchDataProvider } = providerModule;
        
        // 加载搜索数据
        goals.value = searchDataProvider.getGoals();
        tasks.value = searchDataProvider.getTasks();
        reminders.value = searchDataProvider.getReminders();
        
        console.log('✅ 命令面板加载完成');
      }
      
      showCommandPalette.value = !showCommandPalette.value;
    }
  });
}

// ⚠️ 重要：在 Vue 组件的 setup 中初始化 ThemeService
const themeService = getThemeService();
themeService.initialize();

onMounted(async () => {
  try {
    // 只初始化不依赖用户登录态的设置
    await settingStore.initializeSettings();

    // 初始化完成（用户数据会在登录后由 USER_LOGIN 阶段自动加载）
    isLoading.value = false;

    console.log('应用基础初始化完成');
  } catch (error) {
    console.error('应用基础初始化失败:', error);
    isLoading.value = false;
  }
});
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  text-align: center;
  background-color: rgb(var(--v-theme-background));
}

.loading-logo {
  width: 128px;
  height: 128px;
  object-fit: contain;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}
</style>

<style>
:root {
  color-scheme: light dark;
}

html,
body,
#app {
  height: 100%;
  margin: 0;
}

/* Theme transition styles */
body.theme-transition,
body.theme-transition *,
body.theme-transition *::before,
body.theme-transition *::after {
  transition:
    background-color 0.3s ease-in-out,
    color 0.3s ease-in-out,
    border-color 0.3s ease-in-out !important;
  transition-delay: 0s !important;
}
</style>
