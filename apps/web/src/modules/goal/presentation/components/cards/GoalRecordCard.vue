<template>
  <v-card class="record-card" variant="outlined" elevation="0">
    <v-card-text class="pa-4">
      <v-row align="center" no-gutters>
        <!-- 记录值 -->
        <v-col cols="4">
          <div class="d-flex align-center">
            <v-avatar color="primary" variant="tonal" size="32" class="mr-3">
              <v-icon size="16">mdi-plus</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">+{{ record.value }}</div>
              <div class="text-caption text-medium-emphasis">增量</div>
            </div>
          </div>
        </v-col>

        <!-- 记录时间 -->
        <v-col cols="5">
          <div class="d-flex align-center">
            <v-icon color="medium-emphasis" size="16" class="mr-2"> mdi-clock-outline </v-icon>
            <div>
              {{ format(record.createdAt, 'yyyy/MM/dd HH:mm') }}
            </div>
          </div>
        </v-col>
      </v-row>

      <!-- 备注信息 -->
      <div v-if="record.note" class="mt-3 pt-3 border-t">
        <div class="d-flex align-start">
          <v-icon color="medium-emphasis" size="16" class="mr-2 mt-1">
            mdi-note-text-outline
          </v-icon>
          <div class="text-body-2 text-medium-emphasis">
            {{ record.note }}
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { GoalRecord } from '@dailyuse/domain-client';
import { format } from 'date-fns';

defineProps<{
  record: GoalRecord;
}>();
</script>

<style scoped>
.record-card {
  border-radius: 12px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
  background: rgb(var(--v-theme-surface));
}

.record-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.border-t {
  border-top: 1px solid rgba(var(--v-theme-outline), 0.12);
}

/* 响应式设计 */
@media (max-width: 600px) {
  .record-card .v-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .record-card .v-col {
    width: 100%;
  }
}
</style>
