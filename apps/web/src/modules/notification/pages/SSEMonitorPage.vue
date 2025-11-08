<template>
  <div class="sse-monitor-page">
    <div class="page-header">
      <h1>SSE 事件监控</h1>
      <div class="header-actions">
        <button @click="clearEvents" class="btn-clear">
          <span class="icon">🗑️</span>
          清空记录
        </button>
        <button @click="toggleAutoScroll" class="btn-toggle" :class="{ active: autoScroll }">
          <span class="icon">{{ autoScroll ? '📌' : '📍' }}</span>
          {{ autoScroll ? '自动滚动' : '手动滚动' }}
        </button>
      </div>
    </div>

    <div class="connection-status">
      <div class="status-item" :class="{ connected: isConnected, disconnected: !isConnected }">
        <span class="status-dot"></span>
        <span class="status-text">{{ isConnected ? '已连接' : '未连接' }}</span>
      </div>
      <div class="status-info">
        <span>ReadyState: {{ readyState }}</span>
        <span>重连次数: {{ reconnectAttempts }}</span>
        <span>接收事件: {{ events.length }}</span>
      </div>
    </div>

    <div class="filter-bar">
      <label>
        <input type="checkbox" v-model="filters.heartbeat" />
        显示心跳
      </label>
      <label>
        <input type="checkbox" v-model="filters.connected" />
        显示连接事件
      </label>
      <label>
        <input type="checkbox" v-model="filters.notification" />
        显示通知事件
      </label>
      <label>
        <input type="checkbox" v-model="filters.reminder" />
        显示提醒事件
      </label>
    </div>

    <div v-if="filteredEvents.length === 0" class="empty">
      <p>📭 暂无事件记录</p>
      <p class="hint">SSE 连接建立后，所有接收到的事件将显示在这里</p>
    </div>

    <div v-else class="event-list" ref="eventListRef">
      <div
        v-for="(event, index) in filteredEvents"
        :key="event.id"
        class="event-item"
        :class="getEventClass(event.type)"
      >
        <div class="event-header">
          <span class="event-index">#{{ events.length - index }}</span>
          <span class="event-type" :class="`type-${event.category}`">
            {{ getEventIcon(event.type) }} {{ event.type }}
          </span>
          <span class="event-time">{{ formatTime(event.timestamp) }}</span>
        </div>

        <div class="event-data">
          <pre>{{ formatEventData(event.data) }}</pre>
        </div>
      </div>
    </div>

    <div class="stats-footer">
      <div class="stat">总事件: {{ events.length }}</div>
      <div class="stat">心跳: {{ heartbeatCount }}</div>
      <div class="stat">通知: {{ notificationCount }}</div>
      <div class="stat">提醒: {{ reminderCount }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { eventBus } from '@dailyuse/utils';
import { sseClient } from '../../infrastructure/sse/SSEClient';

interface SSEEvent {
  id: string;
  type: string;
  category: 'heartbeat' | 'connection' | 'notification' | 'reminder' | 'other';
  data: any;
  timestamp: number;
}

const events = ref<SSEEvent[]>([]);
const isConnected = ref(false);
const readyState = ref<number | null>(null);
const reconnectAttempts = ref(0);
const autoScroll = ref(true);
const eventListRef = ref<HTMLElement | null>(null);

const filters = ref({
  heartbeat: true,
  connected: true,
  notification: true,
  reminder: true,
});

const filteredEvents = computed(() => {
  return events.value.filter((event) => {
    if (event.category === 'heartbeat' && !filters.value.heartbeat) return false;
    if (event.category === 'connection' && !filters.value.connected) return false;
    if (event.category === 'notification' && !filters.value.notification) return false;
    if (event.category === 'reminder' && !filters.value.reminder) return false;
    return true;
  });
});

const heartbeatCount = computed(() => events.value.filter((e) => e.category === 'heartbeat').length);
const notificationCount = computed(() => events.value.filter((e) => e.category === 'notification').length);
const reminderCount = computed(() => events.value.filter((e) => e.category === 'reminder').length);

function addEvent(type: string, data: any) {
  const category = categorizeEvent(type);
  
  events.value.unshift({
    id: `${Date.now()}-${Math.random()}`,
    type,
    category,
    data,
    timestamp: Date.now(),
  });

  // 限制最多保存 1000 条记录
  if (events.value.length > 1000) {
    events.value.pop();
  }

  // 自动滚动到顶部
  if (autoScroll.value) {
    nextTick(() => {
      if (eventListRef.value) {
        eventListRef.value.scrollTop = 0;
      }
    });
  }

  console.log(`[SSE Monitor] 记录事件: ${type}`, data);
}

function categorizeEvent(type: string): SSEEvent['category'] {
  if (type.includes('heartbeat')) return 'heartbeat';
  if (type.includes('connected')) return 'connection';
  if (type.includes('notification')) return 'notification';
  if (type.includes('reminder') || type.includes('task-executed')) return 'reminder';
  return 'other';
}

function getEventClass(type: string): string {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('error') || lowerType.includes('failed')) return 'event-error';
  if (lowerType.includes('success') || lowerType.includes('created')) return 'event-success';
  if (lowerType.includes('heartbeat')) return 'event-heartbeat';
  return '';
}

function getEventIcon(type: string): string {
  const icons: Record<string, string> = {
    connected: '🔗',
    heartbeat: '💓',
    'notification:created': '✅',
    'notification:sent': '📤',
    'notification:popup-reminder': '🔔',
    'notification:sound-reminder': '🔊',
    'notification:system-notification': '📢',
    'notification:reminder-triggered': '📨',
    'notification:task-executed': '⚡',
  };
  return icons[type] || '📡';
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
}

function formatEventData(data: any): string {
  if (typeof data === 'string') {
    try {
      return JSON.stringify(JSON.parse(data), null, 2);
    } catch {
      return data;
    }
  }
  return JSON.stringify(data, null, 2);
}

function clearEvents() {
  if (confirm('确定要清空所有事件记录吗？')) {
    events.value = [];
  }
}

function toggleAutoScroll() {
  autoScroll.value = !autoScroll.value;
}

function updateConnectionStatus() {
  const status = sseClient.getStatus();
  isConnected.value = status.connected;
  readyState.value = status.readyState;
  reconnectAttempts.value = status.reconnectAttempts;
}

// 设置事件监听
let unsubscribers: (() => void)[] = [];

onMounted(() => {
  console.log('[SSE Monitor] 页面挂载，开始监听 SSE 事件');

  // 监听所有 SSE 相关事件
  const eventTypes = [
    'sse:connected',
    'sse:heartbeat',
    'sse:message',
    'sse:notification:created',
    'sse:notification:sent',
    'sse:notification:popup-reminder',
    'sse:notification:sound-reminder',
    'sse:notification:system-notification',
    'sse:notification:reminder-triggered',
    'sse:notification:task-executed',
    'notification:created',
    'notification:sent',
    'reminder-triggered',
    'schedule:task-executed',
  ];

  eventTypes.forEach((eventType) => {
    const unsubscribe = eventBus.on(eventType, (data) => {
      addEvent(eventType, data);
    });
    unsubscribers.push(unsubscribe);
  });

  // 定期更新连接状态
  const statusInterval = setInterval(updateConnectionStatus, 1000);
  updateConnectionStatus();

  // 清理函数
  onUnmounted(() => {
    console.log('[SSE Monitor] 页面卸载，清理事件监听');
    unsubscribers.forEach((unsub) => unsub());
    clearInterval(statusInterval);
  });
});
</script>

<style scoped>
.sse-monitor-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
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

.btn-clear,
.btn-toggle {
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

.btn-clear:hover,
.btn-toggle:hover {
  background: #f5f5f5;
  border-color: #999;
}

.btn-toggle.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 15px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #dc2626;
  animation: pulse 2s infinite;
}

.status-item.connected .status-dot {
  background: #16a34a;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-info {
  display: flex;
  gap: 20px;
  color: #666;
  font-size: 14px;
}

.filter-bar {
  display: flex;
  gap: 20px;
  padding: 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 15px;
}

.filter-bar label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
}

.filter-bar input[type='checkbox'] {
  cursor: pointer;
}

.empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #999;
  font-size: 16px;
}

.empty .hint {
  margin-top: 10px;
  font-size: 14px;
  color: #bbb;
}

.event-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.event-item {
  padding: 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-left: 4px solid #3b82f6;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
}

.event-item.event-heartbeat {
  border-left-color: #94a3b8;
  opacity: 0.7;
}

.event-item.event-success {
  border-left-color: #22c55e;
}

.event-item.event-error {
  border-left-color: #ef4444;
}

.event-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.event-index {
  color: #999;
  font-size: 12px;
  min-width: 40px;
}

.event-type {
  padding: 3px 8px;
  border-radius: 4px;
  background: #e0e7ff;
  color: #3730a3;
  font-weight: 500;
  font-size: 12px;
}

.event-type.type-heartbeat {
  background: #f1f5f9;
  color: #64748b;
}

.event-type.type-notification {
  background: #dbeafe;
  color: #1e40af;
}

.event-type.type-reminder {
  background: #fef3c7;
  color: #92400e;
}

.event-time {
  margin-left: auto;
  color: #999;
  font-size: 11px;
}

.event-data {
  background: #f8fafc;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}

.event-data pre {
  margin: 0;
  color: #1e293b;
  font-size: 12px;
  line-height: 1.6;
}

.stats-footer {
  display: flex;
  gap: 20px;
  padding: 15px;
  background: #1e293b;
  color: white;
  border-radius: 8px;
  margin-top: 15px;
  font-size: 14px;
  font-weight: 500;
}

.stat {
  padding: 5px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
</style>
