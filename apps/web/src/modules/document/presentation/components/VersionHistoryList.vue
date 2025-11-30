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
            版本 {{ version.versionNumber }}
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
            {{ version.formattedCreatedAt }}
            <span v-if="version.createdBy" class="ml-2">· {{ version.createdBy }}</span>
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
import type { DocumentVersionClientDTO } from '@dailyuse/contracts/editor';
import { VersionChangeType } from '@dailyuse/contracts/editor';


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
function getChangeTypeColor(changeType: VersionChangeType): string {
  const colors: Record<VersionChangeType, string> = {
    [VersionChangeType.CREATE]: 'primary',
    [VersionChangeType.EDIT]: 'info',
    [VersionChangeType.DELETE]: 'error',
    [VersionChangeType.RENAME]: 'warning',
    [VersionChangeType.MOVE]: 'purple',
    [VersionChangeType.MERGE]: 'teal',
    [VersionChangeType.RESTORE]: 'success',
  };
  return colors[changeType] || 'grey';
}

function getChangeTypeLabel(changeType: VersionChangeType): string {
  const labels: Record<VersionChangeType, string> = {
    [VersionChangeType.CREATE]: '创建',
    [VersionChangeType.EDIT]: '编辑',
    [VersionChangeType.DELETE]: '删除',
    [VersionChangeType.RENAME]: '重命名',
    [VersionChangeType.MOVE]: '移动',
    [VersionChangeType.MERGE]: '合并',
    [VersionChangeType.RESTORE]: '恢复',
  };
  return labels[changeType] || String(changeType);
}
</script>

