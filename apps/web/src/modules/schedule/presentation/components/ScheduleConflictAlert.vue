<template>
  <div class="schedule-conflict-alert">
    <!-- Loading State -->
    <v-progress-linear
      v-if="isLoading"
      indeterminate
      color="primary"
      class="mb-4"
    />

    <!-- Error State -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      <template #prepend>
        <v-icon>mdi-alert-circle</v-icon>
      </template>
      {{ error }}
    </v-alert>

    <!-- No Conflicts -->
    <v-alert
      v-if="!isLoading && conflicts && !conflicts.hasConflict"
      type="success"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      <template #prepend>
        <v-icon>mdi-check-circle</v-icon>
      </template>
      无时间冲突
    </v-alert>

    <!-- Conflicts Detected -->
    <v-alert
      v-if="conflicts?.hasConflict"
      type="error"
      variant="tonal"
      prominent
      border="start"
      class="mb-4"
    >
      <template #title>
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-alert-circle</v-icon>
          检测到 {{ conflicts.conflicts.length }} 个时间冲突
        </div>
      </template>

      <v-divider class="my-3" />

      <!-- Conflict List -->
      <div class="conflict-list">
        <div
          v-for="(conflict, index) in conflicts.conflicts"
          :key="index"
          class="conflict-item"
        >
          <v-chip
            :color="getSeverityColor(conflict.severity)"
            size="small"
            class="mr-2"
          >
            {{ getSeverityLabel(conflict.severity) }}
          </v-chip>
          <span class="conflict-title">
            与"{{ conflict.scheduleTitle }}"冲突
          </span>
          <span class="overlap-time ml-2">
            重叠 {{ formatDuration(conflict.overlapDuration) }}
          </span>
        </div>
      </div>

      <v-divider class="my-3" />

      <!-- Suggestions -->
      <div v-if="conflicts.suggestions.length > 0" class="suggestions">
        <div class="suggestions-header">
          <v-icon size="small" class="mr-1">mdi-lightbulb-outline</v-icon>
          建议调整：
        </div>
        <div class="suggestions-actions">
          <v-btn
            v-for="(suggestion, index) in conflicts.suggestions"
            :key="index"
            size="small"
            variant="outlined"
            color="primary"
            @click="handleApplySuggestion(suggestion)"
          >
            {{ getSuggestionLabel(suggestion) }}
          </v-btn>
          <v-btn
            size="small"
            variant="text"
            @click="handleIgnore"
          >
            忽略冲突
          </v-btn>
        </div>
      </div>
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { SourceModule } from '@dailyuse/contracts/schedule';
import type { ScheduleClientDTO, ScheduleTaskClientDTO, ConflictDetectionResult, ScheduleStatisticsClientDTO } from '@dailyuse/contracts/schedule';

type ConflictDetectionResult = ConflictDetectionResult;
type ConflictSuggestion = ConflictSuggestion;

/**
 * Props for ScheduleConflictAlert component
 */
interface Props {
  /**
   * Conflict detection result from useSchedule composable
   */
  conflicts: ConflictDetectionResult | null;
  
  /**
   * Loading state for conflict detection
   */
  isLoading: boolean;
  
  /**
   * Error message if conflict detection failed
   */
  error?: string | null;
}

/**
 * Events emitted by ScheduleConflictAlert component
 */
interface Emits {
  /**
   * Emitted when user clicks a suggestion button
   */
  (e: 'apply-suggestion', suggestion: ConflictSuggestion): void;
  
  /**
   * Emitted when user clicks "忽略冲突" button
   */
  (e: 'ignore-conflict'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Get color for severity chip
 */
const getSeverityColor = (severity?: 'minor' | 'moderate' | 'severe'): string => {
  const colors: Record<string, string> = {
    severe: 'error',
    moderate: 'warning',
    minor: 'info',
  };
  return severity ? colors[severity] || 'grey' : 'grey';
};

/**
 * Get label for severity chip
 */
const getSeverityLabel = (severity?: 'minor' | 'moderate' | 'severe'): string => {
  const labels: Record<string, string> = {
    severe: '严重',
    moderate: '中',
    minor: '轻微',
  };
  return severity ? labels[severity] || '未知' : '未知';
};

/**
 * Format duration in minutes to human-readable string
 */
const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} 分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} 小时 ${mins} 分钟` : `${hours} 小时`;
};

/**
 * Format suggestion label for button text
 */
const getSuggestionLabel = (suggestion: ConflictSuggestion): string => {
  if (suggestion.type === 'move_earlier') {
    const startTime = new Date(suggestion.newStartTime);
    const timeStr = startTime.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `移至 ${timeStr} (提前)`;
  }
  
  if (suggestion.type === 'move_later') {
    const startTime = new Date(suggestion.newStartTime);
    const timeStr = startTime.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `移至 ${timeStr} (推后)`;
  }
  
  if (suggestion.type === 'shorten') {
    return '缩短时长';
  }
  
  return '调整时间';
};

/**
 * Handle apply suggestion button click
 */
const handleApplySuggestion = (suggestion: ConflictSuggestion): void => {
  emit('apply-suggestion', suggestion);
};

/**
 * Handle ignore conflict button click
 */
const handleIgnore = (): void => {
  emit('ignore-conflict');
};
</script>

<style scoped>
.schedule-conflict-alert {
  margin: 1rem 0;
}

.conflict-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.conflict-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.conflict-title {
  font-weight: 500;
}

.overlap-time {
  color: rgb(var(--v-theme-error));
  font-size: 0.875rem;
  font-weight: 500;
}

.suggestions {
  margin-top: 0.5rem;
}

.suggestions-header {
  display: flex;
  align-items: center;
  font-weight: 500;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.suggestions-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
</style>

