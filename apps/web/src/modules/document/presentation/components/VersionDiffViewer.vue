<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      <span>版本比较</span>
      <v-btn
        icon="mdi-close"
        size="small"
        variant="text"
        @click="$emit('close')"
      />
    </v-card-title>

    <v-divider />

    <v-card-text>
      <!-- Comparison Header -->
      <div class="d-flex justify-space-between mb-4">
        <div class="text-center flex-grow-1">
          <v-chip color="error" variant="outlined">
            v{{ comparison.fromVersion.versionNumber }}
          </v-chip>
          <div class="text-caption mt-1 text-medium-emphasis">
            {{ comparison.fromVersion.title }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ formatDate(comparison.fromVersion.createdAt) }}
          </div>
        </div>

        <v-icon icon="mdi-arrow-right" class="mx-4 align-self-center" />

        <div class="text-center flex-grow-1">
          <v-chip color="success" variant="outlined">
            v{{ comparison.toVersion.versionNumber }}
          </v-chip>
          <div class="text-caption mt-1 text-medium-emphasis">
            {{ comparison.toVersion.title }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ formatDate(comparison.toVersion.createdAt) }}
          </div>
        </div>
      </div>

      <!-- Summary Statistics -->
      <v-alert
        type="info"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        <div class="d-flex justify-space-around text-center">
          <div>
            <div class="text-h6 text-success">+{{ comparison.summary.added }}</div>
            <div class="text-caption">添加</div>
          </div>
          <v-divider vertical />
          <div>
            <div class="text-h6 text-error">-{{ comparison.summary.removed }}</div>
            <div class="text-caption">删除</div>
          </div>
          <v-divider vertical />
          <div>
            <div class="text-h6">{{ comparison.summary.unchanged }}</div>
            <div class="text-caption">未变更</div>
          </div>
        </div>
      </v-alert>

      <!-- Diff Display -->
      <v-card variant="outlined" class="diff-container">
        <v-card-text class="pa-0">
          <pre class="diff-content"><code v-for="(line, index) in diffLines" :key="index" :class="getDiffLineClass(line)">{{ line }}</code></pre>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DocumentContracts } from '@dailyuse/contracts';

type VersionComparisonDTO = DocumentContracts.VersionComparisonDTO;

// ==================== Props ====================
const props = defineProps<{
  comparison: VersionComparisonDTO;
}>();

// ==================== Emits ====================
defineEmits<{
  close: [];
}>();

// ==================== Computed ====================
const diffLines = computed(() => {
  return props.comparison.diff.split('\n');
});

// ==================== Helpers ====================
function getDiffLineClass(line: string): string {
  if (line.startsWith('+')) return 'diff-line-added';
  if (line.startsWith('-')) return 'diff-line-removed';
  if (line.startsWith('@@')) return 'diff-line-header';
  return 'diff-line-unchanged';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<style scoped>
.diff-container {
  max-height: 500px;
  overflow-y: auto;
}

.diff-content {
  margin: 0;
  padding: 16px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.diff-content code {
  display: block;
  padding: 2px 8px;
}

.diff-line-added {
  background-color: rgba(76, 175, 80, 0.1);
  color: #2e7d32;
  border-left: 3px solid #4caf50;
}

.diff-line-removed {
  background-color: rgba(244, 67, 54, 0.1);
  color: #c62828;
  border-left: 3px solid #f44336;
}

.diff-line-header {
  background-color: rgba(33, 150, 243, 0.1);
  color: #1976d2;
  font-weight: bold;
}

.diff-line-unchanged {
  color: inherit;
}
</style>
