<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      <span>版本历史 ({{ totalVersions }})</span>
      <v-btn
        icon="mdi-refresh"
        size="small"
        variant="text"
        :loading="loading"
        @click="$emit('refresh')"
      />
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-0">
      <!-- Empty State -->
      <div v-if="!hasVersions && !loading" class="text-center pa-8 text-medium-emphasis">
        <v-icon icon="mdi-history" size="48" class="mb-2" />
        <p>暂无版本历史</p>
      </div>

      <!-- Version List -->
      <v-list v-else lines="three">
        <v-list-item
          v-for="version in versions"
          :key="version.uuid"
          :value="version.uuid"
          @click="$emit('select-version', version)"
        >
          <template #prepend>
            <v-avatar :color="getChangeTypeColor(version.changeType)" size="40">
              <span class="text-white font-weight-bold">v{{ version.versionNumber }}</span>
            </v-avatar>
          </template>

          <v-list-item-title>
            {{ version.title }}
            <v-chip
              :color="getChangeTypeColor(version.changeType)"
              size="x-small"
              class="ml-2"
            >
              {{ getChangeTypeLabel(version.changeType) }}
            </v-chip>
          </v-list-item-title>

          <v-list-item-subtitle>
            {{ version.changeDescription || '无变更描述' }}
          </v-list-item-subtitle>

          <v-list-item-subtitle class="text-caption">
            {{ formatDate(version.createdAt) }}
            <span v-if="version.changedBy" class="ml-2">· {{ version.changedBy }}</span>
          </v-list-item-subtitle>

          <template #append>
            <v-menu>
              <template #activator="{ props }">
                <v-btn
                  icon="mdi-dots-vertical"
                  size="small"
                  variant="text"
                  v-bind="props"
                />
              </template>
              <v-list density="compact">
                <v-list-item @click="$emit('compare', version)">
                  <template #prepend>
                    <v-icon icon="mdi-compare" />
                  </template>
                  <v-list-item-title>比较版本</v-list-item-title>
                </v-list-item>
                <v-list-item @click="$emit('restore', version)">
                  <template #prepend>
                    <v-icon icon="mdi-restore" />
                  </template>
                  <v-list-item-title>恢复此版本</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
        </v-list-item>
      </v-list>

      <!-- Load More Button -->
      <div v-if="hasMorePages" class="text-center pa-4">
        <v-btn
          variant="outlined"
          :loading="loading"
          @click="$emit('load-more')"
        >
          加载更多
        </v-btn>
      </div>

      <!-- Loading State -->
      <v-progress-linear v-if="loading" indeterminate />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { DocumentClientDTO } from '@dailyuse/contracts/editor';

type DocumentVersionClientDTO = DocumentVersionClientDTO;

// ==================== Props ====================
defineProps<{
  versions: DocumentVersionClientDTO[];
  totalVersions: number;
  loading: boolean;
  hasVersions: boolean;
  hasMorePages: boolean;
}>();

// ==================== Emits ====================
defineEmits<{
  'select-version': [version: DocumentVersionClientDTO];
  compare: [version: DocumentVersionClientDTO];
  restore: [version: DocumentVersionClientDTO];
  'load-more': [];
  refresh: [];
}>();

// ==================== Helpers ====================
function getChangeTypeColor(changeType: string): string {
  const colors: Record<string, string> = {
    INITIAL: 'primary',
    MAJOR: 'error',
    MINOR: 'warning',
    PATCH: 'info',
    RESTORE: 'success',
  };
  return colors[changeType] || 'grey';
}

function getChangeTypeLabel(changeType: string): string {
  const labels: Record<string, string> = {
    INITIAL: '初始版本',
    MAJOR: '重大更新',
    MINOR: '次要更新',
    PATCH: '补丁更新',
    RESTORE: '版本恢复',
  };
  return labels[changeType] || changeType;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

