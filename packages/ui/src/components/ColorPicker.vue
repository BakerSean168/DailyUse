<template>
  <v-menu>
    <template v-slot:activator="{ props: menuProps }">
      <v-btn
        v-bind="menuProps"
        :style="{ backgroundColor: modelValue || defaultColor }"
        class="color-btn"
        :class="buttonClass"
        :icon="icon"
        :size="size"
      >
        <v-icon v-if="icon" :color="iconColor">{{ iconName }}</v-icon>
      </v-btn>
    </template>
    <v-card min-width="200">
      <v-card-text>
        <div class="color-grid">
          <v-btn
            v-for="colorOption in colors"
            :key="colorOption"
            :style="{ backgroundColor: colorOption }"
            class="color-option"
            :class="{ 'selected': modelValue === colorOption }"
            icon
            @click="selectColor(colorOption)"
          >
            <v-icon v-if="modelValue === colorOption" color="white" size="small">
              mdi-check
            </v-icon>
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue';

/**
 * ColorPicker - 共享颜色选择器组件
 * 
 * 用于Goal、Reminder等模块的颜色选择
 * 提供预设颜色方块，点击选择
 */

interface Props {
  /** 当前选中的颜色 */
  modelValue?: string | null;
  /** 预设颜色列表（如果不提供则使用默认色板） */
  colors?: string[];
  /** 按钮类名 */
  buttonClass?: string;
  /** 是否显示图标 */
  icon?: boolean;
  /** 图标名称 */
  iconName?: string;
  /** 图标颜色 */
  iconColor?: string;
  /** 按钮大小 */
  size?: 'small' | 'default' | 'large' | 'x-large';
  /** 默认颜色（当modelValue为空时显示） */
  defaultColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  colors: () => [
    '#FF5733', // 红色
    '#FF8C33', // 橙色
    '#FFAA33', // 金色
    '#F1FF33', // 黄色
    '#AAFF33', // 黄绿
    '#33FF57', // 绿色
    '#33FFF1', // 青色
    '#33AAFF', // 天蓝
    '#3357FF', // 蓝色
    '#3333FF', // 深蓝
    '#AA33FF', // 紫色
    '#FF33F1', // 粉紫
    '#FF33AA', // 粉红
    '#FF3333', // 深红
    '#33FF33', // 浅绿
  ],
  buttonClass: '',
  icon: true,
  iconName: 'mdi-palette',
  iconColor: 'white',
  size: 'default',
  defaultColor: '#2196F3',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const selectColor = (color: string) => {
  emit('update:modelValue', color);
};
</script>

<style scoped>
.color-btn {
  transition: all 0.2s ease;
}

.color-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  padding: 8px;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
  min-width: 32px;
}

.color-option:hover {
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.color-option.selected {
  border-color: white;
  border-width: 3px;
  transform: scale(1.05);
}
</style>
