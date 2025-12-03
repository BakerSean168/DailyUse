<template>
  <v-avatar
    :size="size"
    :color="avatarColor"
    :class="avatarClass"
    @click="handleClick"
    :style="{ cursor: clickable ? 'pointer' : 'default' }"
  >
    <template v-if="src">
      <img :src="src" :alt="alt" @error="handleImageError" />
    </template>
    <template v-else>
      <v-icon v-if="icon" :icon="icon" :size="iconSize" />
      <span v-else-if="initials" class="text-h6">{{ initials }}</span>
      <v-icon v-else icon="mdi-account" :size="iconSize" />
    </template>

    <!-- 状态指示器 -->
    <v-badge
      v-if="showStatus"
      :color="statusColor"
      :content="statusContent"
      :dot="statusDot"
      :offset-x="statusOffsetX"
      :offset-y="statusOffsetY"
      location="bottom end"
    />

    <!-- 编辑按钮覆盖层 -->
    <div v-if="editable" class="avatar-overlay" @click.stop="$emit('edit')">
      <v-icon icon="mdi-camera" color="white" />
    </div>
  </v-avatar>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

interface Props {
  src?: string;
  alt?: string;
  size?: string | number;
  color?: string;
  icon?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  clickable?: boolean;
  editable?: boolean;
  avatarClass?: string;

  // 状态相关
  showStatus?: boolean;
  status?: 'online' | 'offline' | 'busy' | 'away';
  statusColor?: string;
  statusContent?: string;
  statusDot?: boolean;
  statusOffsetX?: number;
  statusOffsetY?: number;
}

interface Emits {
  (e: 'click'): void;
  (e: 'edit'): void;
  (e: 'image-error'): void;
}

const props = withDefaults(defineProps<Props>(), {
  size: 48,
  alt: '用户头像',
  clickable: false,
  editable: false,
  showStatus: false,
  statusDot: true,
  statusOffsetX: 2,
  statusOffsetY: 2,
});

const emit = defineEmits<Emits>();

const imageError = ref(false);

// 头像颜色
const avatarColor = computed(() => {
  if (props.color) return props.color;
  if (props.src && !imageError.value) return undefined;
  return 'primary';
});

// 图标大小
const iconSize = computed(() => {
  const size = typeof props.size === 'number' ? props.size : parseInt(props.size);
  return Math.max(16, size * 0.5);
});

// 生成首字母缩写
const initials = computed(() => {
  if (props.displayName) {
    const words = props.displayName.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return words[0][0]?.toUpperCase() || '';
  }

  if (props.firstName && props.lastName) {
    return (props.firstName[0] + props.lastName[0]).toUpperCase();
  }

  if (props.firstName) {
    return props.firstName[0].toUpperCase();
  }

  return '';
});

// 状态颜色映射
const statusColor = computed(() => {
  if (props.statusColor) return props.statusColor;

  switch (props.status) {
    case 'online':
      return 'success';
    case 'busy':
      return 'error';
    case 'away':
      return 'warning';
    case 'offline':
    default:
      return 'grey';
  }
});

// 处理点击事件
const handleClick = () => {
  if (props.clickable) {
    emit('click');
  }
};

// 处理图片加载错误
const handleImageError = () => {
  imageError.value = true;
  emit('image-error');
};
</script>

<style scoped>
.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.v-avatar:hover .avatar-overlay {
  opacity: 1;
}
</style>
