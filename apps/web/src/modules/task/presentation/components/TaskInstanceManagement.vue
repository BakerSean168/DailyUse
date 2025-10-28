<template>
  <div id="task-instance-management">
    <!-- 头部信息 -->
    <div class="task-header">
      <div class="header-info">
        <div class="title-section">
          <h2 class="header-title">{{ getHeaderTitle }}</h2>
          <p class="header-subtitle">{{ getHeaderSubtitle }}</p>
        </div>
        <div class="header-actions">
          <!-- 刷新按钮 -->
          <v-btn
            icon
            variant="text"
            size="small"
            @click="refreshData"
            :loading="loading"
            class="refresh-btn"
          >
            <v-icon>mdi-refresh</v-icon>
            <v-tooltip activator="parent" location="bottom"> 刷新数据 </v-tooltip>
          </v-btn>

          <!-- 进度芯片 -->
          <v-chip
            :color="completedCount === totalCount && totalCount > 0 ? 'success' : 'primary'"
            variant="elevated"
            size="large"
            class="progress-chip"
          >
            <v-icon start>mdi-check-circle</v-icon>
            {{ completedCount }}/{{ totalCount }}
          </v-chip>
        </div>
      </div>

      <!-- 进度条 -->
      <div v-if="totalCount > 0" class="progress-section">
        <v-progress-linear
          :model-value="(completedCount / totalCount) * 100"
          :color="completedCount === totalCount ? 'success' : 'primary'"
          height="10"
          rounded
          class="progress-bar"
        />
        <span class="progress-text">
          {{ Math.round((completedCount / totalCount) * 100) }}% 完成
        </span>
      </div>
    </div>

    <!-- 日期选择器 -->
    <v-card class="week-selector-card" elevation="3">
      <v-card-text class="pa-4">
        <div class="week-selector-header">
          <v-btn icon variant="text" @click="previousWeek" class="week-nav-btn">
            <v-icon>mdi-chevron-left</v-icon>
          </v-btn>
          <span class="week-title">{{ getWeekTitle }}</span>
          <v-btn icon variant="text" @click="nextWeek" class="week-nav-btn">
            <v-icon>mdi-chevron-right</v-icon>
          </v-btn>
        </div>

        <div class="week-selector">
          <v-btn
            v-for="day in weekDays"
            :key="day.date"
            :variant="isSelectedDay(day.date) ? 'flat' : 'text'"
            :color="isSelectedDay(day.date) ? 'primary' : 'default'"
            class="day-button"
            :class="{
              today: isToday(day.date),
              'has-tasks': getTaskCountForDate(day.date) > 0,
            }"
            size="large"
            @click="selectDay(day.date)"
          >
            <div class="day-content">
              <span class="weekday">{{ day.weekday }}</span>
              <span class="date">{{ formatDate(day.date) }}</span>
              <div v-if="getTaskCountForDate(day.date) > 0" class="task-indicator">
                <v-icon size="small">mdi-circle</v-icon>
              </div>
            </div>
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- 任务列表 - 占据剩余空间 -->
    <div class="task-sections">
      <!-- 覆盖层：无任务 -->
      <div v-if="totalCount === 0" class="overlay-card">
        <div class="overlay-content">
          <v-icon color="success" size="80" class="mb-4 empty-icon">mdi-beach</v-icon>
          <h3 class="text-h5 mb-3">休息日</h3>
          <p class="text-body-1 text-medium-emphasis mb-4">今天没有安排任务，好好休息吧！</p>
        </div>
      </div>

      <!-- 覆盖层：全部完成 -->
      <div
        v-else-if="totalCount > 0 && incompleteTasks.length === 0 && showCelebration"
        class="overlay-card"
        @click="showCelebration = false"
        style="cursor: pointer"
      >
        <div class="overlay-content">
          <v-icon color="warning" size="80" class="mb-4 celebration-icon">mdi-party-popper</v-icon>
          <h3 class="text-h4 mb-3">🎉 恭喜完成所有任务！</h3>
          <p class="text-body-1 text-medium-emphasis mb-4">今天的目标全部达成，表现很棒！</p>
          <div class="celebration-stats">
            <v-chip color="success" variant="elevated" class="mr-2">
              <v-icon start>mdi-check-all</v-icon>
              完成 {{ completedCount }} 个任务
            </v-chip>
            <v-chip color="primary" variant="elevated">
              <v-icon start>mdi-clock</v-icon>
              用时 {{ getCompletionTime }}
            </v-chip>
          </div>
          <div class="mt-4 text-caption" style="color: rgba(var(--v-theme-on-surface), 0.5)">
            点击关闭，查看任务列表
          </div>
        </div>
      </div>

      <!-- 水平排列的任务列表 -->
      <div class="task-lists-row">
        <!-- 未完成任务 -->
        <v-card class="task-section-card incomplete-tasks" elevation="3">
          <v-card-title class="section-header">
            <div class="header-left">
              <v-icon color="warning" class="mr-2">mdi-clock-outline</v-icon>
              <span>待完成任务</span>
            </div>
            <div class="header-right">
              <v-chip color="warning" variant="tonal" size="small" class="mr-2">
                {{ incompleteTasks.length }}
              </v-chip>
            </div>
          </v-card-title>

          <v-card-text class="pa-0 task-content">
            <div class="scrollable-list">
              <v-list class="task-list">
                <TaskInstanceCard
                  v-for="(task, index) in incompleteTasks"
                  :key="task.uuid"
                  :task="task"
                  :show-border="index < incompleteTasks.length - 1"
                  :goal-store="goalStore"
                  @complete="completeTaskInstance"
                />
              </v-list>
            </div>
          </v-card-text>
        </v-card>

        <!-- 已完成任务 -->
        <v-card class="task-section-card completed-tasks" elevation="2">
          <v-card-title class="section-header">
            <div class="header-left">
              <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
              <span>已完成任务</span>
            </div>
            <div class="header-right">
              <v-chip color="success" variant="tonal" size="small">
                {{ completedTasks.length }}
              </v-chip>
            </div>
          </v-card-title>

          <v-card-text class="pa-0 task-content">
            <div class="scrollable-list">
              <v-list class="task-list">
                <TaskInstanceCard
                  v-for="(task, index) in completedTasks"
                  :key="task.uuid"
                  :task="task"
                  :show-border="index < completedTasks.length - 1"
                  :goal-store="goalStore"
                  @undo="undoCompleteTaskInstance"
                />
              </v-list>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect, onMounted } from 'vue';
import { useTaskStore } from '../stores/taskStore';
import { useGoalStore } from '@/modules/goal/presentation/stores/goalStore';
import { format, startOfDay, isToday, isSameDay } from 'date-fns';
// types
import { TaskTemplate, TaskInstance } from '@dailyuse/domain-client';
import type { TaskContracts } from '@dailyuse/contracts';
import { GoalClient, KeyResultClient } from '@dailyuse/domain-client';

type KeyResultLink = TaskContracts.KeyResultLink;

// composables
import { useTaskInstance } from '../composables/useTaskInstance';
// 导入 task web service
import { getTaskWebService } from '../../index';
// 导入 TaskInstanceCard 组件
import TaskInstanceCard from './cards/TaskInstanceCard.vue';

const { completeTaskInstance, undoCompleteTaskInstance } = useTaskInstance();

const taskStore = useTaskStore();
const goalStore = useGoalStore();

const selectedDate = ref(new Date().toISOString().split('T')[0]);
const currentWeekStart = ref(new Date());
const loading = ref(false);
const taskInstances = computed(() => taskStore.getAllTaskInstances);

// 计算属性
const dayTasks = computed(() => {
  const selected = new Date(selectedDate.value);
  return taskInstances.value.filter((task) => {
    return isSameDay(task.timeConfig.scheduledDate, selected);
  });
});

const completedTasks = computed(() =>
  dayTasks.value.filter(
    (task) => task.execution.status === 'completed' && task instanceof TaskInstance,
  ),
);

const incompleteTasks = computed(() =>
  dayTasks.value.filter(
    (task) =>
      (task.execution.status === 'pending' || task.execution.status === 'inProgress') &&
      task instanceof TaskInstance,
  ),
);

// Week days calculation
const weekDays = computed(() => {
  const days = [];
  const monday = new Date(currentWeekStart.value);
  monday.setDate(currentWeekStart.value.getDate() - (currentWeekStart.value.getDay() || 7) + 1);

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    days.push({
      date: date.toISOString().split('T')[0],
      weekday: '日一二三四五六'[date.getDay()],
    });
  }
  return days;
});

const completedCount = computed(() => completedTasks.value.length);
const totalCount = computed(() => dayTasks.value.length);

// Header title and subtitle
const getHeaderTitle = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  if (selectedDate.value === today) {
    return '今日任务';
  }
  const date = new Date(selectedDate.value);
  return `${date.getMonth() + 1}月${date.getDate()}日任务`;
});

const getHeaderSubtitle = computed(() => {
  const date = new Date(selectedDate.value);
  const dayName = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
  return `${dayName} · ${date.toLocaleDateString('zh-CN')}`;
});

const getWeekTitle = computed(() => {
  const monday = new Date(currentWeekStart.value);
  monday.setDate(currentWeekStart.value.getDate() - (currentWeekStart.value.getDay() || 7) + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return `${monday.getMonth() + 1}月${monday.getDate()}日 - ${sunday.getMonth() + 1}月${sunday.getDate()}日`;
});

const getCompletionTime = computed(() => {
  // 这里可以计算实际完成时间，暂时返回示例
  return '3小时20分钟';
});

// ✅ 修改工具函数使用新的时间数据结构
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getDate()}`;
};

// ✅ 修改任务计数逻辑
const getTaskCountForDate = (date: string) => {
  const selectedDate = new Date(date);

  return taskStore.getAllTaskInstances.filter((task) => {
    isSameDay(task.timeConfig.scheduledDate, selectedDate);
  }).length;
};

const isSelectedDay = (date: string) => date === selectedDate.value;

const showCelebration = ref(false);

// 日期导航方法
const selectDay = async (date: string) => {
  selectedDate.value = date;
};

const previousWeek = () => {
  const newDate = new Date(currentWeekStart.value);
  newDate.setDate(newDate.getDate() - 7);
  currentWeekStart.value = newDate;
};

const nextWeek = () => {
  const newDate = new Date(currentWeekStart.value);
  newDate.setDate(newDate.getDate() + 7);
  currentWeekStart.value = newDate;
};

// 手动刷新数据
const refreshData = async () => {
  console.log('🔄 [TaskInstanceManagement] 手动刷新数据...');

  try {
    loading.value = true;

    const taskService = getTaskWebService;
    await taskService.forceSync(); // 强制同步

    // 显示更新后的数据统计
    const templates = taskStore.getAllTaskTemplates.length;
    const instances = taskStore.getAllTaskInstances.length;
    console.log(`✅ [TaskInstanceManagement] 刷新完成: ${templates} 个模板，${instances} 个实例`);
  } catch (error) {
    console.error('❌ [TaskInstanceManagement] 刷新失败:', error);
  } finally {
    loading.value = false;
  }
};

watchEffect(() => {
  if (totalCount.value > 0 && incompleteTasks.value.length === 0) {
    showCelebration.value = true;
  }
  if (totalCount.value === 0) {
    showCelebration.value = false;
  }
});

// 组件挂载时检查并加载数据
onMounted(async () => {
  console.log('📋 [TaskInstanceManagement] 组件已挂载，开始检查数据...');

  try {
    loading.value = true;

    // 使用智能同步，只在需要时才从服务器获取数据
    const taskService = getTaskWebService;
    const syncResult = await taskService.smartSync();

    if (syncResult.synced) {
      console.log('✅ [TaskInstanceManagement] 数据已从服务器更新');
    } else {
      console.log('✅ [TaskInstanceManagement] 使用本地缓存数据');
    }

    // 显示当前数据统计
    const templates = taskStore.getAllTaskTemplates.length;
    const instances = taskStore.getAllTaskInstances.length;
    console.log(`📊 [TaskInstanceManagement] 当前数据: ${templates} 个模板，${instances} 个实例`);
  } catch (error) {
    console.error('❌ [TaskInstanceManagement] 数据加载失败:', error);
    // 不影响组件正常显示，只记录错误
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
#task-instance-management {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 头部样式 */
.task-header {
  flex-shrink: 0;
}

.header-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.title-section {
  flex: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.refresh-btn {
  margin-right: 0.5rem;
}

.header-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  margin: 0 0 0.25rem 0;
  background: linear-gradient(45deg, rgb(var(--v-theme-primary)), rgb(var(--v-theme-secondary)));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-subtitle {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 0;
}

.progress-chip {
  font-weight: 600;
  font-size: 1rem;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-bar {
  flex: 1;
}

.progress-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.7);
  min-width: 80px;
  text-align: right;
}

/* 日期选择器样式 */
.week-selector-card {
  border-radius: 20px;
  flex-shrink: 0;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-surface), 0.8),
    rgba(var(--v-theme-background), 0.95)
  );
}

.week-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.week-title {
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.week-nav-btn {
  transition: all 0.2s ease;
}

.week-nav-btn:hover {
  transform: scale(1.1);
}

.week-selector {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.75rem;
}

.day-button {
  height: auto !important;
  min-height: 70px;
  flex-direction: column;
  border-radius: 16px;
  transition: all 0.3s ease;
  position: relative;
}

.day-button.today {
  background: rgba(var(--v-theme-primary), 0.1);
  border: 2px solid rgba(var(--v-theme-primary), 0.3);
}

.day-button.has-tasks .task-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  color: rgba(var(--v-theme-primary), 0.7);
}

.day-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  position: relative;
  width: 100%;
}

.weekday {
  font-size: 0.875rem;
  font-weight: 700;
}

.date {
  font-size: 1rem;
  font-weight: 600;
}

/* 任务区域样式 */
.task-sections {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.task-lists-row {
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
  height: 100%;
  min-height: 0;
}

.incomplete-tasks,
.completed-tasks {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

@media (max-width: 900px) {
  .task-lists-row {
    flex-direction: column;
    gap: 1rem;
  }

  .incomplete-tasks,
  .completed-tasks {
    min-height: 200px;
  }
}

/* 覆盖层样式 */
.overlay-card {
  position: absolute;
  z-index: 10;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(var(--v-theme-background), 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  flex-direction: column;
  animation: fadeInOverlay 0.4s;
}

.overlay-content {
  text-align: center;
  max-width: 350px;
  margin: 0 auto;
}

@keyframes fadeInOverlay {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.task-section-card {
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.incomplete-tasks {
  flex: 2;
  min-height: 300px;
}

.completed-tasks {
  flex: 1;
  min-height: 200px;
}

.section-header {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.08),
    rgba(var(--v-theme-secondary), 0.08)
  );
  font-weight: 600;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
}

.task-content {
  flex: 1;
  min-height: 0;
}

.scrollable-list {
  height: 100%;
  overflow-y: auto;
}

.task-list {
  background: transparent;
}

/* 空状态样式 */
.empty-state-card {
  border-radius: 20px;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-success), 0.05),
    rgba(var(--v-theme-primary), 0.05)
  );
}

.empty-state-content {
  max-width: 300px;
  margin: 0 auto;
}

.empty-icon {
  animation: gentle-bounce 2s ease-in-out infinite;
}

@keyframes gentle-bounce {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

/* 庆祝样式 */
.celebration-card {
  border-radius: 20px;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-warning), 0.1),
    rgba(var(--v-theme-success), 0.1)
  );
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s ease;
  position: relative;
  overflow: hidden;
}

.celebration-card.show {
  opacity: 1;
  transform: translateY(0);
}

.celebration-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    circle at center,
    rgba(var(--v-theme-warning), 0.1) 0%,
    transparent 70%
  );
  animation: pulse-celebration 2s ease-in-out infinite;
}

.celebration-content {
  position: relative;
  z-index: 1;
  animation: celebrate 0.8s ease;
}

.celebration-icon {
  animation: float 2s ease-in-out infinite;
}

.celebration-stats {
  margin-top: 1rem;
}

@keyframes celebrate {
  0% {
    transform: scale(0.8) rotate(-5deg);
    opacity: 0;
  }

  50% {
    transform: scale(1.1) rotate(2deg);
  }

  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  25% {
    transform: translateY(-8px) rotate(2deg);
  }

  75% {
    transform: translateY(-4px) rotate(-1deg);
  }
}

@keyframes pulse-celebration {
  0%,
  100% {
    opacity: 0.1;
    transform: scale(1);
  }

  50% {
    opacity: 0.2;
    transform: scale(1.05);
  }
}

/* 滚动条样式 */
.scrollable-list::-webkit-scrollbar {
  width: 6px;
}

.scrollable-list::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-outline), 0.05);
  border-radius: 3px;
}

.scrollable-list::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.3);
  border-radius: 3px;
  transition: background 0.2s ease;
}

.scrollable-list::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-primary), 0.5);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .incomplete-tasks {
    flex: 1.5;
  }
}

@media (max-width: 900px) {
  .task-lists-row {
    flex-direction: column;
    gap: 1rem;
  }

  .incomplete-tasks,
  .completed-tasks {
    min-height: 200px;
  }
}

@media (max-width: 768px) {
  #task-instance-management {
    padding: 1rem;
    gap: 1rem;
  }

  .header-info {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .progress-section {
    flex-direction: column;
    gap: 0.5rem;
  }

  .progress-text {
    text-align: center;
  }

  .week-selector {
    gap: 0.5rem;
  }

  .day-button {
    min-height: 60px;
  }

  .weekday {
    font-size: 0.75rem;
  }

  .date {
    font-size: 0.875rem;
  }

  .task-lists-container {
    gap: 0.75rem;
  }

  .task-item {
    padding: 1rem;
    min-height: 70px;
  }
}

@media (max-width: 480px) {
  .header-title {
    font-size: 1.5rem;
  }

  .week-selector {
    gap: 0.25rem;
  }

  .day-button {
    min-height: 50px;
  }

  .weekday {
    font-size: 0.625rem;
  }

  .date {
    font-size: 0.75rem;
  }
}
</style>
