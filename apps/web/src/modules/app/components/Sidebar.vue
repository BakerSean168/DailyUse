<!-- 侧边栏组件 -->
<template>
  <div class="sidebar">
    <button class="sidebar-btn" @click="toggleRail" title="Logo">
      <img src="../../../assets/DailyUse-24.png" alt="logo" width="36" />
    </button>
    <button class="sidebar-avatar" title="Profile">
      <profile-avatar size="36" />
    </button>

    <!-- 主导航项 -->
    <button
      class="sidebar-btn"
      v-for="item in navigationItems"
      :key="item.name"
      :title="item.title"
      :class="{ active: isActiveRoute(item.path) }"
      @click="navigateTo(item.path)"
      @mouseenter="handleMouseEnter(item.path)"
      @mouseleave="handleMouseLeave"
    >
      <v-icon :icon="item.icon" size="24" />
    </button>

    <div class="sidebar-divider"></div>

    <div class="sidebar-bottom">
      <button
        class="sidebar-btn bottom-button"
        v-for="item in bottomItems"
        :key="item.name"
        :title="item.title"
        :class="{ active: isActiveRoute(item.path) }"
        @click="navigateTo(item.path)"
        @mouseenter="handleMouseEnter(item.path)"
        @mouseleave="handleMouseLeave"
      >
        <v-icon :icon="item.icon" size="24" />
      </button>
      <SidebarMoreMenu />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import ProfileAvatar from '@/modules/account/presentation/components/ProfileAvatar.vue';
import SidebarMoreMenu from './SidebarMoreMenu.vue';
import { getNavigationRoutes } from '@/shared/router/routes';
import { handleNavMouseEnter, handleNavMouseLeave } from '@/shared/services/RoutePrefetchService';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

// 获取导航路由
const navigationItems = computed(() => {
  const navRoutes = getNavigationRoutes();
  return navRoutes.map((navRoute) => ({
    name: navRoute.name,
    path: navRoute.path === '' ? '/' : navRoute.path,
    title: navRoute.title || '',
    icon: navRoute.icon || 'mdi-circle',
  }));
});

// 底部导航项（移除账户设置，统一在头像菜单中访问）
const bottomItems: any[] = [];

// 切换收缩/展开
const toggleRail = () => {
  // TODO: 实现收缩/展开逻辑
  console.log('Toggle sidebar rail');
};

// 导航到指定路径
const navigateTo = (path: string) => {
  if (route.path !== path) {
    router.push(path);
  }
};

// 检查路由是否激活
const isActiveRoute = (path: string) => {
  if (path === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(path);
};

// 预加载处理
const handleMouseEnter = (path: string) => {
  // 不预加载当前页面
  if (!isActiveRoute(path)) {
    handleNavMouseEnter(path);
  }
};

const handleMouseLeave = () => {
  handleNavMouseLeave();
};
</script>

<style scoped>
.sidebar {
  width: 60px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: rgba(var(--v-theme-surface), 0.55);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.sidebar-btn {
  width: 44px;
  height: 44px;
  margin: 8px 0;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  position: relative;
  border-radius: 8px;
}

.sidebar-btn:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.1);
}

.sidebar-btn.active {
  background-color: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

.sidebar-avatar {
  width: 44px;
  height: 44px;
  margin: 8px 0;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
}

.sidebar-divider {
  width: 80%;
  height: 1px;
  background: rgba(var(--v-theme-on-surface), 0.12);
  margin: 12px 0;
}

.sidebar-bottom {
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: flex-end;
}

.bottom-button {
  margin-bottom: 8px;
}
</style>
