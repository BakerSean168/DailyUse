<template>
  <Teleport to="body">
    <TransitionGroup name="notification-slide" tag="div" class="in-app-notification-container">
      <div
        v-for="notification in visibleNotifications"
        :key="notification.id"
        :class="['in-app-notification', `priority-${notification.priority}`]"
        @click="handleNotificationClick(notification)"
      >
        <div class="notification-icon">
          {{ getIconComponent(notification.type) }}
        </div>
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-message">{{ notification.message }}</div>
        </div>
        <button class="notification-close" @click.stop="closeNotification(notification.id)">
          <span>×</span>
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { eventBus } from '@dailyuse/utils';

interface InAppNotificationData {
  notification: {
    uuid: string;
    title: string;
    content?: string;
    type?: string;
    importance?: string;
  };
  timestamp: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  duration?: number;
  onClick?: () => void;
}

const visibleNotifications = ref<NotificationItem[]>([]);
const maxNotifications = 5; // 最多同时显示的通知数量

/**
 * 显示应用内通知
 */
function showNotification(data: InAppNotificationData) {
  console.log('[InAppNotification] 显示应用内通知:', data);

  // 转换数据格式
  const notificationItem: NotificationItem = {
    id: data.notification.uuid,
    title: data.notification.title,
    message: data.notification.content || data.notification.title,
    type: data.notification.type || 'REMINDER',
    priority: data.notification.importance?.toUpperCase() || 'NORMAL',
    duration: 5000, // 5秒后自动关闭
  };

  // 限制同时显示的通知数量
  if (visibleNotifications.value.length >= maxNotifications) {
    visibleNotifications.value.shift(); // 移除最旧的通知
  }

  visibleNotifications.value.push(notificationItem);

  // 自动关闭
  const duration = notificationItem.duration ?? 5000;
  if (duration > 0) {
    setTimeout(() => {
      closeNotification(notificationItem.id);
    }, duration);
  }
}

/**
 * 关闭通知
 */
function closeNotification(id: string) {
  const index = visibleNotifications.value.findIndex((n) => n.id === id);
  if (index !== -1) {
    visibleNotifications.value.splice(index, 1);
  }
}

/**
 * 处理通知点击
 */
function handleNotificationClick(notification: NotificationItem) {
  if (notification.onClick) {
    notification.onClick();
  }
  closeNotification(notification.id);
}

/**
 * 获取图标组件
 */
function getIconComponent(type: string) {
  // 简单的图标显示
  const icons: Record<string, string> = {
    REMINDER: '🔔',
    TASK: '✅',
    GOAL: '🎯',
    SYSTEM: '⚙️',
  };
  return icons[type] || '🔔';
}

// 监听事件
onMounted(() => {
  console.log('[InAppNotification] 组件已挂载，开始监听应用内通知事件');
  eventBus.on('notification:in-app', showNotification);
});

onUnmounted(() => {
  eventBus.off('notification:in-app', showNotification);
});
</script>

<style scoped>
.in-app-notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  pointer-events: none;
}

.in-app-notification {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 320px;
  max-width: 400px;
  padding: 16px;
  margin-bottom: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.in-app-notification:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.in-app-notification.priority-LOW {
  border-left: 4px solid #909399;
}

.in-app-notification.priority-NORMAL {
  border-left: 4px solid #409eff;
}

.in-app-notification.priority-HIGH {
  border-left: 4px solid #e6a23c;
}

.in-app-notification.priority-URGENT {
  border-left: 4px solid #f56c6c;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  50% {
    box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4);
  }
}

.notification-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  font-size: 24px;
  line-height: 1;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-message {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  word-wrap: break-word;
}

.notification-close {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #909399;
  font-size: 20px;
  line-height: 1;
  transition: color 0.2s;
}

.notification-close:hover {
  color: #303133;
}

/* 动画 */
.notification-slide-enter-active,
.notification-slide-leave-active {
  transition: all 0.3s ease;
}

.notification-slide-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-slide-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-slide-move {
  transition: transform 0.3s ease;
}
</style>
