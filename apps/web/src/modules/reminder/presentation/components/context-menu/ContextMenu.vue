<template>
  <teleport to="body">
    <div v-if="props.show" class="context-menu-overlay" @click="handleClose" @contextmenu.prevent="handleClose">
      <div 
        class="context-menu" 
        :style="menuStyle" 
        @click.stop
        ref="menuRef"
      >
        <div
          v-for="(item, index) in items"
          :key="index"
          class="context-menu-item"
          :class="{
            'context-menu-item-danger': item.danger,
            'context-menu-item-disabled': item.disabled,
            'context-menu-divider': item.divider,
          }"
          @click="handleItemClick(item)"
        >
          <template v-if="!item.divider">
            <v-icon :size="item.iconSize || 18" class="mr-2" :color="item.iconColor">
              {{ item.icon }}
            </v-icon>
            <span class="context-menu-item-label">{{ item.label }}</span>
            <v-icon v-if="item.shortcut" size="14" class="ml-auto text-grey">
              {{ item.shortcut }}
            </v-icon>
          </template>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

interface MenuItem {
  label?: string;
  icon?: string;
  iconSize?: number;
  iconColor?: string;
  action?: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
  shortcut?: string;
}

interface Props {
  show?: boolean;
  x: number;
  y: number;
  items: MenuItem[];
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
});

const emit = defineEmits<{
  select: [action: () => void];
  close: [];
}>();

const menuRef = ref<HTMLElement>();

// 计算菜单位置，防止超出视口
const menuStyle = computed(() => {
  const style: Record<string, string> = {
    left: `${props.x}px`,
    top: `${props.y}px`,
  };

  return style;
});

// 调整菜单位置，防止超出视口
const adjustMenuPosition = async () => {
  await nextTick();
  if (!menuRef.value) return;

  const menu = menuRef.value;
  const rect = menu.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let { x, y } = props;

  // 检查右边界
  if (rect.right > viewportWidth) {
    x = viewportWidth - rect.width - 10;
  }

  // 检查底部边界
  if (rect.bottom > viewportHeight) {
    y = viewportHeight - rect.height - 10;
  }

  // 检查左边界
  if (x < 0) {
    x = 10;
  }

  // 检查顶部边界
  if (y < 0) {
    y = 10;
  }

  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
};

// 处理菜单项点击
const handleItemClick = (item: MenuItem) => {
  if (item.divider || item.disabled) return;
  
  if (item.action) {
    item.action();
    emit('select', item.action);
  }
  
  handleClose();
};

// 关闭菜单
const handleClose = () => {
  emit('close');
};

// 监听键盘事件
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.show) {
    handleClose();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  if (props.show) {
    adjustMenuPosition();
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});

// 监听 show 变化
import { watch } from 'vue';
watch(() => props.show, (newValue) => {
  if (newValue) {
    adjustMenuPosition();
  }
});
</script>

<style scoped>
.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: transparent;
}

.context-menu {
  position: fixed;
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
  min-width: 200px;
  max-width: 300px;
  overflow: hidden;
  animation: menuFadeIn 0.15s ease-out;
  backdrop-filter: blur(10px);
}

@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.context-menu-item {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface));
  user-select: none;
}

.context-menu-item:not(.context-menu-divider):hover:not(.context-menu-item-disabled) {
  background: rgba(var(--v-theme-primary), 0.08);
}

.context-menu-item:not(.context-menu-divider):active:not(.context-menu-item-disabled) {
  background: rgba(var(--v-theme-primary), 0.12);
}

.context-menu-item-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.context-menu-item-danger {
  color: rgb(var(--v-theme-error));
}

.context-menu-item-danger:hover:not(.context-menu-item-disabled) {
  background: rgba(var(--v-theme-error), 0.08);
}

.context-menu-item-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.context-menu-divider {
  height: 1px;
  padding: 0;
  margin: 4px 0;
  background: rgba(var(--v-theme-on-surface), 0.12);
  cursor: default;
}

.context-menu-divider:hover {
  background: rgba(var(--v-theme-on-surface), 0.12);
}

/* 深色模式优化 */
@media (prefers-color-scheme: dark) {
  .context-menu {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
  }
}
</style>
