<template>
  <div class="schedule-week-view">
    <WeekViewCalendar
      :schedules="weekSchedules"
      :is-loading="isLoading"
      @week-change="handleWeekChange"
      @create="scheduleDialogRef?.openForCreate()"
      @event-click="handleEventClick"
    />

    <!-- 创建/编辑日程对话框 -->
    <CreateScheduleDialog ref="scheduleDialogRef" />

    <!-- 事件详情对话框 （简化版）-->
    <v-dialog v-model="showEventDetails" max-width="500">
      <v-card v-if="selectedEvent">
        <v-card-title>
          {{ selectedEvent.title }}
          <v-chip
            v-if="selectedEvent.hasConflict"
            size="small"
            color="warning"
            prepend-icon="mdi-alert"
            class="ml-2"
          >
            冲突
          </v-chip>
        </v-card-title>

        <v-card-text>
          <div class="mb-2">
            <v-icon size="small">mdi-clock-outline</v-icon>
            {{ formatEventTime(selectedEvent) }}
          </div>

          <div v-if="selectedEvent.location" class="mb-2">
            <v-icon size="small">mdi-map-marker</v-icon>
            {{ selectedEvent.location }}
          </div>

          <div v-if="selectedEvent.description" class="mb-2">
            <v-icon size="small">mdi-text</v-icon>
            {{ selectedEvent.description }}
          </div>

          <div v-if="selectedEvent.priority" class="mb-2">
            <v-icon size="small">mdi-flag</v-icon>
            优先级: {{ selectedEvent.priority }}
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" @click="handleEdit">
            <v-icon left>mdi-pencil</v-icon>
            编辑
          </v-btn>
          <v-btn color="error" variant="text" @click="handleDelete">
            <v-icon left>mdi-delete</v-icon>
            删除
          </v-btn>
          <v-btn variant="text" @click="showEventDetails = false">
            关闭
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { SourceModule } from '@dailyuse/contracts/schedule';
import type { ScheduleClientDTO, ScheduleTaskClientDTO, ConflictDetectionResult, ScheduleStatisticsClientDTO } from '@dailyuse/contracts/schedule';
import WeekViewCalendar from '../components/WeekViewCalendar.vue';
import CreateScheduleDialog from '../components/CreateScheduleDialog.vue';
import { useScheduleEvent } from '../composables/useScheduleEvent';

const {
  schedules,
  isLoading,
  error,
  loadSchedulesByTimeRange,
  deleteSchedule,
} = useScheduleEvent();

const scheduleDialogRef = ref<InstanceType<typeof CreateScheduleDialog> | null>(null);
const showEventDetails = ref(false);
const selectedEvent = ref<ScheduleClientDTO | null>(null);
const currentWeekStart = ref<Date>(new Date());
const currentWeekEnd = ref<Date>(new Date());

// Computed
const weekSchedules = computed(() => {
  return schedules.value;
});

// Methods
async function handleWeekChange(startDate: Date, endDate: Date) {
  currentWeekStart.value = startDate;
  currentWeekEnd.value = endDate;
  
  await loadSchedulesByTimeRange(
    startDate.getTime(),
    endDate.getTime()
  );
}

function handleEventClick(event: ScheduleClientDTO) {
  selectedEvent.value = event;
  showEventDetails.value = true;
}

/**
 * 处理编辑日程
 */
function handleEdit() {
  if (!selectedEvent.value) return;
  
  showEventDetails.value = false;
  scheduleDialogRef.value?.openForEdit(selectedEvent.value);
}

async function handleDelete() {
  if (!selectedEvent.value) return;

  const confirmed = confirm(`确定要删除日程"${selectedEvent.value.title}"吗？`);
  if (!confirmed) return;

  await deleteSchedule(selectedEvent.value.uuid);
  showEventDetails.value = false;
  selectedEvent.value = null;

  // 重新加载
  await loadSchedulesByTimeRange(
    currentWeekStart.value.getTime(),
    currentWeekEnd.value.getTime()
  );
}

function formatEventTime(event: ScheduleClientDTO): string {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const formatDateTime = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  return `${formatDateTime(start)} - ${formatDateTime(end)}`;
}
</script>

<style scoped>
.schedule-week-view {
  height: 100%;
  width: 100%;
}
</style>

