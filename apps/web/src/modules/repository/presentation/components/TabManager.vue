<template>
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
    >
      <!-- Tab 图标 -->
      <v-icon :icon="tab.icon" size="small" class="mr-2" />

      <!-- Tab 名称 -->
      <span>{{ tab.name }}</span>

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

      <!-- 右键菜单 -->
      <v-menu activator="parent" open-on-click :close-on-content-click="false">
        <v-list density="compact">
          <v-list-item @click="togglePin(tab.uuid)">
            <template #prepend>
              <v-icon :icon="tab.isPinned ? 'mdi-pin-off' : 'mdi-pin'" />
            </template>
            <v-list-item-title>
              {{ tab.isPinned ? '取消固定' : '固定' }}
            </v-list-item-title>
          </v-list-item>

          <v-list-item @click="closeOthers(tab.uuid)">
            <template #prepend>
              <v-icon icon="mdi-close-box-multiple" />
            </template>
            <v-list-item-title>关闭其他</v-list-item-title>
          </v-list-item>

          <v-list-item @click="closeAll">
            <template #prepend>
              <v-icon icon="mdi-close-box-outline" />
            </template>
            <v-list-item-title>关闭所有</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-tab>
  </v-tabs>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useResourceStore } from '../stores/resourceStore';

const resourceStore = useResourceStore();

const openTabs = computed(() => resourceStore.openTabs);
const activeTabUuid = computed(() => resourceStore.activeTabUuid);

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
    // 确认关闭
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
.tab-manager {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.close-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.v-tab:hover .close-btn {
  opacity: 1;
}
</style>
