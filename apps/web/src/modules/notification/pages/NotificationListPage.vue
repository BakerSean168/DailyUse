<template>
  <div class="notification-list-page">
    <div class="page-header">
      <h1>通知列表</h1>
      <div class="header-actions">
        <button @click="refreshList" class="btn-refresh">
          <span class="icon">🔄</span>
          刷新
        </button>
        <button @click="markAllAsRead" class="btn-mark-read" :disabled="unreadCount === 0">
          <span class="icon">✅</span>
          全部标记已读
        </button>
      </div>
    </div>

    <div class="stats-bar">
      <div class="stat-item">
        <span class="label">总数:</span>
        <span class="value">{{ notifications.length }}</span>
      </div>
      <div class="stat-item">
        <span class="label">未读:</span>
        <span class="value unread">{{ unreadCount }}</span>
      </div>
      <div class="stat-item">
        <span class="label">已读:</span>
        <span class="value read">{{ readCount }}</span>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>❌ {{ error }}</p>
      <button @click="refreshList">重试</button>
    </div>

    <div v-else-if="notifications.length === 0" class="empty">
      <p>📭 暂无通知</p>
    </div>

    <div v-else class="notification-list">
      <div
        v-for="notification in sortedNotifications"
        :key="notification.uuid"
        class="notification-item"
        :class="{
          unread: !notification.isRead,
          read: notification.isRead,
        }"
        @click="handleNotificationClick(notification)"
      >
        <div class="notification-header">
          <span class="notification-type" :class="`type-${notification.type.toLowerCase()}`">
            {{ getTypeIcon(notification.type) }} {{ notification.typeText }}
          </span>
          <span class="notification-category" :class="`category-${notification.category.toLowerCase()}`">
            {{ notification.categoryText }}
          </span>
          <span class="notification-time">
            {{ formatTime(notification.createdAt) }}
          </span>
        </div>

        <div class="notification-content">
          <h3 class="notification-title">{{ notification.title }}</h3>
          <p class="notification-body">{{ notification.content }}</p>
        </div>

        <div class="notification-meta">
          <div class="meta-left">
            <span v-if="notification.relatedEntityType" class="related-entity">
              🔗 {{ notification.relatedEntityType }}
            </span>
            <span class="status" :class="`status-${notification.status.toLowerCase()}`">
              {{ notification.statusText }}
            </span>
          </div>
          <div class="meta-right">
            <span class="importance" :class="`importance-${notification.importance}`">
              {{ getImportanceText(notification.importance) }}
            </span>
          </div>
        </div>

        <div class="notification-actions">
          <button
            v-if="!notification.isRead"
            @click.stop="markAsRead(notification.uuid)"
            class="btn-action btn-read"
          >
            标记已读
          </button>
          <button
            @click.stop="deleteNotification(notification.uuid)"
            class="btn-action btn-delete"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

interface Notification {
  uuid: string;
  accountUuid: string;
  title: string;
  content: string;
  type: string;
  category: string;
  importance: number;
  urgency: number;
  status: string;
  isRead: boolean;
  readAt: number | null;
  relatedEntityType: string | null;
  relatedEntityUuid: string | null;
  createdAt: number;
  updatedAt: number;
  sentAt: number | null;
  typeText: string;
  categoryText: string;
  statusText: string;
  importanceText: string;
  urgencyText: string;
}

const notifications = ref<Notification[]>([]);
const loading = ref(false);
const error = ref('');

const unreadCount = computed(() => notifications.value.filter((n) => !n.isRead).length);
const readCount = computed(() => notifications.value.filter((n) => n.isRead).length);

const sortedNotifications = computed(() => {
  return [...notifications.value].sort((a, b) => {
    // 未读的排前面
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    // 按时间倒序
    return b.createdAt - a.createdAt;
  });
});

async function fetchNotifications() {
  loading.value = true;
  error.value = '';

  try {
    const token = localStorage.getItem('access_token');
    const accountUuid = localStorage.getItem('account_uuid');

    if (!token || !accountUuid) {
      throw new Error('请先登录');
    }

    const response = await axios.get(`http://localhost:3888/api/v1/notifications`, {
      params: { accountUuid },
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data.success) {
      notifications.value = response.data.data;
    } else {
      throw new Error(response.data.message || '获取通知列表失败');
    }
  } catch (err: any) {
    error.value = err.message || '加载失败';
    console.error('获取通知列表失败:', err);
  } finally {
    loading.value = false;
  }
}

async function markAsRead(uuid: string) {
  try {
    const token = localStorage.getItem('access_token');
    await axios.patch(
      `http://localhost:3888/api/v1/notifications/${uuid}/read`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // 更新本地状态
    const notification = notifications.value.find((n) => n.uuid === uuid);
    if (notification) {
      notification.isRead = true;
      notification.readAt = Date.now();
    }
  } catch (err) {
    console.error('标记已读失败:', err);
    alert('标记已读失败');
  }
}

async function markAllAsRead() {
  try {
    const token = localStorage.getItem('access_token');
    const accountUuid = localStorage.getItem('account_uuid');

    await axios.post(
      `http://localhost:3888/api/v1/notifications/mark-all-read`,
      { accountUuid },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // 更新本地状态
    notifications.value.forEach((n) => {
      n.isRead = true;
      n.readAt = Date.now();
    });
  } catch (err) {
    console.error('标记全部已读失败:', err);
    alert('标记全部已读失败');
  }
}

async function deleteNotification(uuid: string) {
  if (!confirm('确定要删除这条通知吗？')) {
    return;
  }

  try {
    const token = localStorage.getItem('access_token');
    await axios.delete(`http://localhost:3888/api/v1/notifications/${uuid}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 从列表中移除
    notifications.value = notifications.value.filter((n) => n.uuid !== uuid);
  } catch (err) {
    console.error('删除通知失败:', err);
    alert('删除通知失败');
  }
}

function handleNotificationClick(notification: Notification) {
  console.log('点击通知:', notification);
  // 如果未读，标记为已读
  if (!notification.isRead) {
    markAsRead(notification.uuid);
  }
}

function refreshList() {
  fetchNotifications();
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    REMINDER: '🔔',
    TASK: '📋',
    GOAL: '🎯',
    SCHEDULE: '📅',
    ACCOUNT: '👤',
    SYSTEM: '⚙️',
  };
  return icons[type] || '📬';
}

function getImportanceText(importance: number): string {
  const texts: Record<number, string> = {
    0: '🔵 低',
    1: '🟢 普通',
    2: '🟡 中等',
    3: '🟠 高',
    4: '🔴 紧急',
  };
  return texts[importance] || '❓';
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
}

onMounted(() => {
  fetchNotifications();
});
</script>

<style scoped>
.notification-list-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-refresh,
.btn-mark-read {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-refresh:hover,
.btn-mark-read:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #999;
}

.btn-mark-read:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stats-bar {
  display: flex;
  gap: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-item .label {
  color: #666;
  font-size: 14px;
}

.stat-item .value {
  font-weight: 600;
  font-size: 18px;
  color: #1a1a1a;
}

.stat-item .value.unread {
  color: #ff6b6b;
}

.stat-item .value.read {
  color: #51cf66;
}

.loading,
.error,
.empty {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 20px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.notification-item.unread {
  border-left: 4px solid #3b82f6;
  background: #f0f9ff;
}

.notification-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.notification-header {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 13px;
}

.notification-type,
.notification-category {
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: 500;
}

.notification-type {
  background: #e3f2fd;
  color: #1976d2;
}

.notification-category {
  background: #f3e5f5;
  color: #7b1fa2;
}

.notification-time {
  margin-left: auto;
  color: #999;
  font-size: 12px;
}

.notification-content {
  margin-bottom: 12px;
}

.notification-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 6px;
}

.notification-body {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.notification-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 13px;
}

.meta-left,
.meta-right {
  display: flex;
  gap: 10px;
}

.related-entity,
.status,
.importance {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.related-entity {
  background: #fff3cd;
  color: #856404;
}

.status {
  background: #d1ecf1;
  color: #0c5460;
}

.importance {
  font-weight: 500;
}

.notification-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.btn-action {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-read {
  background: #4caf50;
  color: white;
}

.btn-read:hover {
  background: #45a049;
}

.btn-delete {
  background: #f44336;
  color: white;
}

.btn-delete:hover {
  background: #da190b;
}
</style>
