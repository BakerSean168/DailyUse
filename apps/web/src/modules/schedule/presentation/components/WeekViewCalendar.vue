<template>
  <v-card class="week-calendar">
    <v-card-title class="d-flex justify-space-between align-center">
      <div class="d-flex align-center gap-2">
        <v-btn icon="mdi-chevron-left" variant="text" @click="previousWeek" />
        <span class="text-h6">{{ weekRange }}</span>
        <v-btn icon="mdi-chevron-right" variant="text" @click="nextWeek" />
        <v-btn size="small" variant="outlined" @click="goToToday">今天</v-btn>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="$emit('create')">
        新建日程
      </v-btn>
    </v-card-title>

    <v-card-text class="pa-0">
      <!-- 加载状态 -->
      <v-progress-linear v-if="isLoading" indeterminate color="primary" />

      <!-- 日历主体 -->
      <div class="calendar-container">
        <!-- 表头：星期 -->
        <div class="calendar-header">
          <div class="time-column-header"></div>
          <div
            v-for="day in weekDays"
            :key="day.date"
            class="day-header"
            :class="{ today: day.isToday }"
          >
            <div class="day-name">{{ day.dayName }}</div>
            <div class="day-date">{{ day.dateNumber }}</div>
          </div>
        </div>

        <!-- 日历主体：时间槽 + 事件 -->
        <div class="calendar-body">
          <!-- 时间列 -->
          <div class="time-column">
            <div
              v-for="hour in hours"
              :key="hour"
              class="time-slot"
            >
              {{ formatHour(hour) }}
            </div>
          </div>

          <!-- 每天的事件列 -->
          <div
            v-for="day in weekDays"
            :key="day.date"
            class="day-column"
            :class="{ today: day.isToday }"
          >
            <!-- 时间槽网格背景 -->
            <div
              v-for="hour in hours"
              :key="hour"
              class="time-slot-bg"
            ></div>

            <!-- 当天的事件 -->
            <div
              v-for="event in getEventsForDay(day.date)"
              :key="event.uuid"
              class="event-card"
              :style="getEventStyle(event)"
              :class="{ conflict: event.hasConflict }"
              @click="$emit('event-click', event)"
            >
              <div class="event-time">{{ formatEventTime(event) }}</div>
              <div class="event-title">{{ event.title }}</div>
              <v-icon v-if="event.hasConflict" size="small" class="conflict-icon">
                mdi-alert
              </v-icon>
            </div>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { ScheduleContracts } from '@dailyuse/contracts';

// Props
const props = defineProps<{
  schedules: ScheduleContracts.ScheduleClientDTO[];
  isLoading?: boolean;
}>();

// Emits
const emit = defineEmits<{
  'week-change': [startDate: Date, endDate: Date];
  'create': [];
  'event-click': [event: ScheduleContracts.ScheduleClientDTO];
}>();

// State
const currentWeekStart = ref<Date>(getWeekStart(new Date()));

// Computed
const weekDays = computed(() => {
  const days = [];
  const start = new Date(currentWeekStart.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    days.push({
      date: dateStr,
      dayName: getDayName(date.getDay()),
      dateNumber: date.getDate(),
      isToday: date.getTime() === today.getTime(),
    });
  }

  return days;
});

const weekRange = computed(() => {
  const start = currentWeekStart.value;
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const format = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  };

  return `${format(start)} - ${format(end)}`;
});

const hours = computed(() => {
  return Array.from({ length: 24 }, (_, i) => i);
});

// Methods
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // 周一为一周开始
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDayName(day: number): string {
  const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return names[day];
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

function formatEventTime(event: ScheduleContracts.ScheduleClientDTO): string {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };
  return `${formatTime(start)} - ${formatTime(end)}`;
}

function getEventsForDay(dateStr: string): ScheduleContracts.ScheduleClientDTO[] {
  return props.schedules.filter((event) => {
    const eventDate = new Date(event.startTime).toISOString().split('T')[0];
    return eventDate === dateStr;
  });
}

function getEventStyle(event: ScheduleContracts.ScheduleClientDTO) {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);

  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;
  const duration = endHour - startHour;

  const top = (startHour / 24) * 100;
  const height = (duration / 24) * 100;

  return {
    top: `${top}%`,
    height: `${Math.max(height, 2)}%`,
  };
}

function previousWeek() {
  const newStart = new Date(currentWeekStart.value);
  newStart.setDate(newStart.getDate() - 7);
  currentWeekStart.value = newStart;
}

function nextWeek() {
  const newStart = new Date(currentWeekStart.value);
  newStart.setDate(newStart.getDate() + 7);
  currentWeekStart.value = newStart;
}

function goToToday() {
  currentWeekStart.value = getWeekStart(new Date());
}

// Watchers
watch(currentWeekStart, (newStart) => {
  const endDate = new Date(newStart);
  endDate.setDate(newStart.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  emit('week-change', newStart, endDate);
});

// Lifecycle
onMounted(() => {
  const endDate = new Date(currentWeekStart.value);
  endDate.setDate(currentWeekStart.value.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  emit('week-change', currentWeekStart.value, endDate);
});
</script>

<style scoped>
.week-calendar {
  width: 100%;
  height: 100%;
}

.calendar-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
  overflow: auto;
}

.calendar-header {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
  border-bottom: 2px solid #e0e0e0;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.time-column-header {
  border-right: 1px solid #e0e0e0;
}

.day-header {
  padding: 12px;
  text-align: center;
  border-right: 1px solid #e0e0e0;
}

.day-header.today {
  background-color: #e3f2fd;
}

.day-name {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.day-date {
  font-size: 20px;
  font-weight: bold;
  margin-top: 4px;
}

.calendar-body {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
  flex: 1;
  position: relative;
}

.time-column {
  border-right: 1px solid #e0e0e0;
}

.time-slot {
  height: 60px;
  padding: 4px 8px;
  font-size: 12px;
  color: #666;
  border-bottom: 1px solid #f0f0f0;
  text-align: right;
}

.day-column {
  position: relative;
  border-right: 1px solid #e0e0e0;
}

.day-column.today {
  background-color: #fafafa;
}

.time-slot-bg {
  height: 60px;
  border-bottom: 1px solid #f0f0f0;
}

.event-card {
  position: absolute;
  left: 2px;
  right: 2px;
  background: #1976d2;
  color: white;
  border-radius: 4px;
  padding: 4px 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  z-index: 5;
}

.event-card:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 6;
}

.event-card.conflict {
  background: #f57c00;
}

.event-time {
  font-size: 10px;
  opacity: 0.9;
  margin-bottom: 2px;
}

.event-title {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conflict-icon {
  position: absolute;
  top: 2px;
  right: 2px;
  color: white;
}
</style>
