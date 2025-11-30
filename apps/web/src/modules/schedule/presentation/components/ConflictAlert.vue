<template>
  <v-alert
    v-if="conflictResult && conflictResult.hasConflict"
    type="warning"
    variant="tonal"
    closable
    class="mb-4"
  >
    <div class="text-subtitle-2 mb-2">
      <v-icon icon="mdi-alert" class="mr-2" />
      检测到 {{ conflictResult.conflicts.length }} 个时间冲突
    </div>
    
    <div class="text-body-2 mb-2">
      <div v-for="conflict in conflictResult.conflicts" :key="conflict.scheduleUuid" class="mb-1">
        • 与"{{ conflict.scheduleTitle }}"重叠 {{ formatDuration(conflict.overlapDuration) }}
      </div>
    </div>

    <div v-if="conflictResult.suggestions.length > 0" class="text-caption">
      <strong>建议：</strong>
      <span v-for="(suggestion, index) in conflictResult.suggestions" :key="index">
        {{ formatSuggestion(suggestion) }}
        <span v-if="index < conflictResult.suggestions.length - 1"> · </span>
      </span>
    </div>
  </v-alert>
</template>

<script setup lang="ts">
import type { ScheduleClientDTO, ScheduleTaskClientDTO, ConflictDetectionResult, ConflictSuggestion } from '@dailyuse/contracts/schedule';

defineProps<{
  conflictResult: ConflictDetectionResult | null;
}>();

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  }
  return `${minutes}分钟`;
}

function formatSuggestion(suggestion: ConflictSuggestion): string {
  const startTime = new Date(suggestion.newStartTime).toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  const endTime = new Date(suggestion.newEndTime).toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  switch (suggestion.type) {
    case 'move_earlier':
      return `提前到 ${startTime}-${endTime}`;
    case 'move_later':
      return `延后到 ${startTime}-${endTime}`;
    case 'shorten':
      return `缩短到 ${startTime}-${endTime}`;
    default:
      return '';
  }
}
</script>

