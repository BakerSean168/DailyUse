<!--
  DuContextMenu - 通用右键菜单组件
  
  设计目标：
  1. 高度复用 - 支持文件树、目标分类等场景
  2. 功能完整 - 支持 divider、图标、颜色、快捷键、禁用等特性
  3. 交互友好 - 自动定位、键盘导航、点击外部关闭
  4. 类型安全 - TypeScript 支持
  
  使用示例：
  ```vue
  <DuContextMenu
    v-model:show="menu.show"
    :x="menu.x"
    :y="menu.y"
    :items="menu.items"
    @item-click="handleMenuItemClick"
  />
  ```
-->

<template>
  <teleport to="body">
    <transition name="context-menu-fade">
      <div
        v-if="show"
        class="context-menu-overlay"
        @click="handleClose"
        @contextmenu.prevent="handleClose"
      >
        <div
          ref="menuRef"
          class="context-menu"
          :style="menuStyle"
          @click.stop
          tabindex="-1"
          @keydown.esc="handleClose"
          @keydown.up.prevent="navigateItems(-1)"
          @keydown.down.prevent="navigateItems(1)"
          @keydown.enter.prevent="selectCurrentItem"
        >
          <template v-for="(item, index) in items" :key="index">
            <!-- 分隔线 -->
            <div v-if="item.divider" class="context-menu-divider"></div>

            <!-- 菜单项 -->
            <div
              v-else
              class="context-menu-item"
              :class="{
                'context-menu-item--disabled': item.disabled,
                'context-menu-item--danger': item.danger,
                'context-menu-item--active': currentIndex === index && !item.disabled,
              }"
              @click="handleItemClick(item, index)"
              @mouseenter="currentIndex = index"
            >
              <!-- 前置图标 -->
              <div v-if="item.icon" class="context-menu-item__icon">
                <v-icon
                  :icon="item.icon"
                  :size="item.iconSize || 18"
                  :color="item.disabled ? 'grey-darken-1' : item.iconColor"
                />
              </div>

              <!-- 标题 -->
              <span class="context-menu-item__title">
                {{ item.title }}
              </span>

              <!-- 快捷键提示 -->
              <span v-if="item.shortcut" class="context-menu-item__shortcut">
                {{ item.shortcut }}
              </span>

              <!-- 后置图标（如子菜单箭头） -->
              <div v-if="item.suffix" class="context-menu-item__suffix">
                <v-icon :icon="item.suffix" size="16" />
              </div>
            </div>
          </template>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import type { ContextMenuItem } from '@dailyuse/contracts/shared';

interface Props {
  /** 是否显示 */
  show: boolean;
  
  /** X 坐标 */
  x: number;
  
  /** Y 坐标 */
  y: number;
  
  /** 菜单项列表 */
  items: ContextMenuItem[];
  
  /** 菜单最小宽度 */
  minWidth?: number;
}

interface Emits {
  /** 显示状态变化 */
  (e: 'update:show', value: boolean): void;
  
  /** 菜单项点击 */
  (e: 'item-click', item: ContextMenuItem, index: number): void;
  
  /** 菜单关闭 */
  (e: 'close'): void;
}

const props = withDefaults(defineProps<Props>(), {
  minWidth: 180,
});

const emit = defineEmits<Emits>();

// ===== 响应式数据 =====

const menuRef = ref<HTMLElement>();
const currentIndex = ref(-1);

// ===== 计算属性 =====

/**
 * 菜单样式（自动定位，防止超出视口）
 */
const menuStyle = computed(() => {
  if (!props.show) return {};

  const style: Record<string, string> = {
    minWidth: `${props.minWidth}px`,
  };

  // 默认位置
  let x = props.x;
  let y = props.y;

  // 预估菜单尺寸（实际渲染后会调整）
  const menuWidth = props.minWidth;
  const menuHeight = props.items.length * 36; // 估计每项 36px

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // 防止超出右边界
  if (x + menuWidth > viewportWidth) {
    x = viewportWidth - menuWidth - 10;
  }

  // 防止超出下边界
  if (y + menuHeight > viewportHeight) {
    y = viewportHeight - menuHeight - 10;
  }

  // 防止超出左边界
  if (x < 10) {
    x = 10;
  }

  // 防止超出上边界
  if (y < 10) {
    y = 10;
  }

  style.left = `${x}px`;
  style.top = `${y}px`;

  return style;
});

/**
 * 可选择的菜单项索引列表（排除分隔线和禁用项）
 */
const selectableIndices = computed(() => {
  return props.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !item.divider && !item.disabled)
    .map(({ index }) => index);
});

// ===== 方法 =====

/**
 * 处理菜单项点击
 */
const handleItemClick = async (item: ContextMenuItem, index: number) => {
  if (item.divider || item.disabled) return;

  // 执行回调
  if (item.action) {
    await item.action();
  }

  // 触发事件
  emit('item-click', item, index);

  // 关闭菜单
  handleClose();
};

/**
 * 关闭菜单
 */
const handleClose = () => {
  emit('update:show', false);
  emit('close');
  currentIndex.value = -1;
};

/**
 * 键盘导航
 */
const navigateItems = (direction: number) => {
  const indices = selectableIndices.value;
  if (indices.length === 0) return;

  const currentPos = indices.indexOf(currentIndex.value);

  if (currentPos === -1) {
    // 未选中任何项，选中第一项或最后一项
    currentIndex.value = direction > 0 ? indices[0] : indices[indices.length - 1];
  } else {
    // 移动到下一项或上一项
    const nextPos = (currentPos + direction + indices.length) % indices.length;
    currentIndex.value = indices[nextPos];
  }
};

/**
 * 选中当前项
 */
const selectCurrentItem = () => {
  if (currentIndex.value >= 0 && currentIndex.value < props.items.length) {
    const item = props.items[currentIndex.value];
    handleItemClick(item, currentIndex.value);
  }
};

/**
 * 精确调整菜单位置（在实际渲染后）
 */
const adjustMenuPosition = () => {
  nextTick(() => {
    if (!menuRef.value) return;

    const rect = menuRef.value.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = props.x;
    let y = props.y;

    // 防止超出边界
    if (rect.right > viewportWidth) {
      x = viewportWidth - rect.width - 10;
    }
    if (rect.bottom > viewportHeight) {
      y = viewportHeight - rect.height - 10;
    }
    if (x < 10) x = 10;
    if (y < 10) y = 10;

    // 应用精确位置
    if (menuRef.value) {
      menuRef.value.style.left = `${x}px`;
      menuRef.value.style.top = `${y}px`;
    }
  });
};

// ===== 生命周期 =====

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      adjustMenuPosition();
      // 聚焦菜单以支持键盘导航
      nextTick(() => {
        menuRef.value?.focus();
      });
    }
  }
);
</script>

<style scoped>
/* 遮罩层 */
.context-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: transparent;
}

/* 菜单容器 */
.context-menu {
  position: fixed;
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15),
              0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 4px 0;
  outline: none;
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
}

/* 菜单项 */
.context-menu-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  user-select: none;
  gap: 8px;
  min-height: 36px;
}

.context-menu-item:hover:not(.context-menu-item--disabled) {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.context-menu-item--active:not(.context-menu-item--disabled) {
  background-color: rgba(var(--v-theme-primary), 0.12);
}

.context-menu-item--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.context-menu-item--danger {
  color: rgb(var(--v-theme-error));
}

.context-menu-item--danger:hover:not(.context-menu-item--disabled) {
  background-color: rgba(var(--v-theme-error), 0.08);
}

/* 图标区域 */
.context-menu-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 标题 */
.context-menu-item__title {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
  white-space: nowrap;
}

/* 快捷键 */
.context-menu-item__shortcut {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-left: auto;
}

/* 后置图标 */
.context-menu-item__suffix {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.6;
}

/* 分隔线 */
.context-menu-divider {
  height: 1px;
  background-color: rgba(var(--v-theme-outline), 0.12);
  margin: 4px 0;
}

/* 过渡动画 */
.context-menu-fade-enter-active,
.context-menu-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.context-menu-fade-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
}

.context-menu-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
