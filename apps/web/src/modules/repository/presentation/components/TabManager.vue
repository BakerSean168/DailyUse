<template>
  <div class="tab-manager-container">
    <v-tabs
      v-model="activeTabIndex"
      density="compact"
      bg-color="surface"
      class="tab-manager"
      show-arrows
    >
      <v-tab
        v-for="(tab, index) in openTabs"
        :key="tab.uuid"
        :value="index"
        @click="switchToTab(tab.uuid)"
        @contextmenu.prevent="handleTabContextMenu($event, tab)"
      >
        <!-- Tab 图标 -->
        <v-icon :icon="tab.icon" size="small" class="mr-2" />

        <!-- Tab 名称 -->
        <span>{{ displayName(tab.name) }}</span>

        <!-- Dirty 指示器 -->
        <v-icon
          v-if="tab.isDirty"
          icon="mdi-circle"
          size="x-small"
          class="ml-2"
          color="warning"
        />

        <!-- Pin 指示器 -->
        <v-icon
          v-if="tab.isPinned"
          icon="mdi-pin"
          size="x-small"
          class="ml-1"
          color="primary"
        />

        <!-- 关闭按钮 -->
        <v-btn
          icon="mdi-close"
          size="x-small"
          variant="text"
          class="ml-2 close-btn"
          @click.stop="closeTab(tab.uuid)"
        />
      </v-tab>
    </v-tabs>

    <!-- 右键菜单 -->
    <DuContextMenu
      v-model:show="contextMenu.show"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="contextMenu.items"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useResourceStore, type ResourceTab } from '../stores/resourceStore';
import { DuContextMenu, type ContextMenuItem } from '@/shared/components/context-menu';

const resourceStore = useResourceStore();

const openTabs = computed(() => resourceStore.openTabs);
const activeTabUuid = computed(() => resourceStore.activeTabUuid);

// 右键菜单状态
const contextMenu = reactive({
  show: false,
  x: 0,
  y: 0,
  items: [] as ContextMenuItem[],
  currentTab: null as ResourceTab | null,
});

// 计算当前激活的 tab 索引
const activeTabIndex = computed({
  get() {
    return openTabs.value.findIndex((tab) => tab.uuid === activeTabUuid.value);
  },
  set(index: number) {
    if (index >= 0 && index < openTabs.value.length) {
      const tab = openTabs.value[index];
      resourceStore.switchTab(tab.uuid);
    }
  },
});

/**
 * 显示 Tab 名称（隐藏 .md 扩展名）
 */
function displayName(name: string): string {
  return name.endsWith('.md') ? name.slice(0, -3) : name;
}

/**
 * Tab 右键菜单
 */
function handleTabContextMenu(event: MouseEvent, tab: ResourceTab) {
  event.preventDefault();
  event.stopPropagation();

  contextMenu.currentTab = tab;
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;

  contextMenu.items = [
    {
      title: tab.isPinned ? '取消固定' : '固定',
      icon: tab.isPinned ? 'mdi-pin-off' : 'mdi-pin',
      action: () => togglePin(tab.uuid),
    },
    { divider: true },
    {
      title: '关闭',
      icon: 'mdi-close',
      action: () => closeTab(tab.uuid),
    },
    {
      title: '关闭其他',
      icon: 'mdi-close-box-multiple',
      action: () => closeOthers(tab.uuid),
    },
    {
      title: '关闭右侧',
      icon: 'mdi-arrow-collapse-right',
      action: () => closeToRight(tab.uuid),
    },
    {
      title: '关闭所有',
      icon: 'mdi-close-box-outline',
      danger: true,
      action: () => closeAll(),
    },
  ];

  contextMenu.show = true;
}

/**
 * 切换到指定 tab
 */
async function switchToTab(uuid: string) {
  await resourceStore.switchTab(uuid);
}

/**
 * 关闭 tab
 */
function closeTab(uuid: string) {
  const tab = openTabs.value.find((t) => t.uuid === uuid);
  if (tab?.isDirty) {
    const confirmed = confirm('该文件有未保存的更改，确定要关闭吗？');
    if (!confirmed) return;
  }

  resourceStore.closeTab(uuid);
}

/**
 * 固定/取消固定
 */
function togglePin(uuid: string) {
  resourceStore.togglePinTab(uuid);
}

/**
 * 关闭其他 tabs
 */
function closeOthers(keepUuid: string) {
  resourceStore.closeOtherTabs(keepUuid);
}

/**
 * 关闭右侧 tabs
 */
function closeToRight(uuid: string) {
  const index = openTabs.value.findIndex((t) => t.uuid === uuid);
  if (index >= 0) {
    const tabsToClose = openTabs.value.slice(index + 1);
    tabsToClose.forEach((tab) => {
      if (!tab.isPinned) {
        resourceStore.closeTab(tab.uuid);
      }
    });
  }
}

/**
 * 关闭所有 tabs
 */
function closeAll() {
  const hasUnsaved = openTabs.value.some((tab) => tab.isDirty);
  if (hasUnsaved) {
    const confirmed = confirm('有未保存的更改，确定要关闭所有标签吗？');
    if (!confirmed) return;
  }

  resourceStore.closeAllTabs(false);
}
</script>

<style scoped>
/* Obsidian 风格 Tab 管理器 */
.tab-manager-container {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
  background: rgb(var(--v-theme-surface));
}

.tab-manager {
  min-height: 36px;
}

.tab-manager :deep(.v-tab) {
  min-width: auto;
  padding: 0 12px;
  height: 36px;
  font-size: 13px;
  font-weight: 400;
  text-transform: none;
  letter-spacing: normal;
  border-radius: 0;
  transition: background-color 0.15s ease;
}

.tab-manager :deep(.v-tab:hover) {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.tab-manager :deep(.v-tab--selected) {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.close-btn {
  opacity: 0;
  transition: opacity 0.15s ease;
  margin-left: 4px !important;
  width: 18px !important;
  height: 18px !important;
}

.close-btn:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.08) !important;
}

.v-tab:hover .close-btn {
  opacity: 0.6;
}

.v-tab:hover .close-btn:hover {
  opacity: 1;
}
</style>
