<template>
  <v-menu :close-on-content-click="false" max-width="500">
    <template v-slot:activator="{ props: menuProps }">
      <v-btn
        v-bind="menuProps"
        :icon="iconButton"
        :variant="variant"
        :color="buttonColor"
        :size="size"
      >
        <v-icon :color="iconColor" :size="iconSize">
          {{ modelValue || defaultIcon }}
        </v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-toy-brick-search</v-icon>
        选择图标
      </v-card-title>
      
      <!-- 搜索框 -->
      <v-card-text class="pb-0">
        <v-text-field
          v-model="searchQuery"
          label="搜索图标"
          placeholder="输入图标名称..."
          prepend-inner-icon="mdi-magnify"
          clearable
          dense
          variant="outlined"
          hide-details
        />
      </v-card-text>

      <!-- 图标分类 -->
      <v-card-text>
        <v-tabs v-model="activeTab" density="compact">
          <v-tab value="all">全部</v-tab>
          <v-tab value="health">健康</v-tab>
          <v-tab value="work">工作</v-tab>
          <v-tab value="life">生活</v-tab>
          <v-tab value="time">时间</v-tab>
          <v-tab value="other">其他</v-tab>
        </v-tabs>

        <!-- 图标网格 -->
        <v-window v-model="activeTab" class="mt-4" style="max-height: 300px; overflow-y: auto;">
          <v-window-item v-for="category in categories" :key="category" :value="category">
            <div class="icon-grid">
              <v-btn
                v-for="icon in getFilteredIcons(category)"
                :key="icon"
                :class="{ 'selected': modelValue === icon }"
                class="icon-option"
                icon
                variant="outlined"
                @click="selectIcon(icon)"
              >
                <v-icon>{{ icon }}</v-icon>
              </v-btn>
            </div>
            <div v-if="getFilteredIcons(category).length === 0" class="text-center text-grey py-4">
              没有找到匹配的图标
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <div class="text-caption text-grey">
          当前选择: <v-icon size="small">{{ modelValue || defaultIcon }}</v-icon>
          {{ modelValue || defaultIcon }}
        </div>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

/**
 * IconPicker - 共享图标选择器组件
 * 
 * 用于Goal、Reminder等模块的图标选择
 * 提供预设分类图标，支持搜索
 */

interface Props {
  /** 当前选中的图标 */
  modelValue?: string | null;
  /** 按钮颜色 */
  buttonColor?: string;
  /** 图标颜色 */
  iconColor?: string;
  /** 图标大小 */
  iconSize?: string | number;
  /** 按钮大小 */
  size?: 'small' | 'default' | 'large' | 'x-large';
  /** 按钮变体 */
  variant?: 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain';
  /** 是否为图标按钮 */
  iconButton?: boolean;
  /** 默认图标 */
  defaultIcon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  buttonColor: 'primary',
  iconColor: undefined,
  iconSize: 'default',
  size: 'default',
  variant: 'outlined',
  iconButton: true,
  defaultIcon: 'mdi-bell',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const searchQuery = ref('');
const activeTab = ref('all');

const categories = ['all', 'health', 'work', 'life', 'time', 'other'] as const;

// 预设图标库
const iconsByCategory = {
  health: [
    'mdi-heart-pulse',
    'mdi-pill',
    'mdi-water',
    'mdi-run',
    'mdi-yoga',
    'mdi-meditation',
    'mdi-sleep',
    'mdi-food-apple',
    'mdi-weight-lifter',
    'mdi-hospital-box',
    'mdi-medical-bag',
    'mdi-eye',
  ],
  work: [
    'mdi-briefcase',
    'mdi-laptop',
    'mdi-coffee',
    'mdi-calendar-check',
    'mdi-email',
    'mdi-phone',
    'mdi-file-document',
    'mdi-chart-line',
    'mdi-presentation',
    'mdi-account-group',
    'mdi-lightbulb',
    'mdi-target',
  ],
  life: [
    'mdi-home',
    'mdi-shopping',
    'mdi-cart',
    'mdi-car',
    'mdi-bus',
    'mdi-train',
    'mdi-airplane',
    'mdi-weather-sunny',
    'mdi-umbrella',
    'mdi-gift',
    'mdi-party-popper',
    'mdi-cake',
  ],
  time: [
    'mdi-bell',
    'mdi-bell-ring',
    'mdi-alarm',
    'mdi-clock',
    'mdi-clock-outline',
    'mdi-timer',
    'mdi-calendar',
    'mdi-calendar-today',
    'mdi-calendar-clock',
    'mdi-history',
    'mdi-update',
    'mdi-progress-clock',
  ],
  other: [
    'mdi-star',
    'mdi-flag',
    'mdi-bookmark',
    'mdi-tag',
    'mdi-fire',
    'mdi-lightning-bolt',
    'mdi-trophy',
    'mdi-medal',
    'mdi-shield-check',
    'mdi-check-circle',
    'mdi-alert-circle',
    'mdi-information',
  ],
};

const allIcons = computed(() => {
  return Object.values(iconsByCategory).flat();
});

const getFilteredIcons = (category: typeof categories[number]) => {
  const icons = category === 'all' ? allIcons.value : iconsByCategory[category] || [];
  
  if (!searchQuery.value) {
    return icons;
  }
  
  const query = searchQuery.value.toLowerCase();
  return icons.filter(icon => icon.toLowerCase().includes(query));
};

const selectIcon = (icon: string) => {
  emit('update:modelValue', icon);
};
</script>

<style scoped>
.icon-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.icon-option {
  aspect-ratio: 1;
  transition: all 0.2s ease;
}

.icon-option:hover {
  transform: scale(1.1);
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.icon-option.selected {
  background-color: rgba(var(--v-theme-primary), 0.2);
  border-color: rgb(var(--v-theme-primary));
  border-width: 2px;
  transform: scale(1.05);
}
</style>
