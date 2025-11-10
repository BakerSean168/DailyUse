<template>
  <div class="files-panel">
    <FileExplorer
      ref="fileExplorerRef"
      :selected-repository="selectedRepository"
      @create-folder="$emit('create-folder', $event)"
      @create-resource="$emit('create-resource')"
      @rename-folder="$emit('rename-folder', $event)"
      @delete-folder="$emit('delete-folder', $event)"
      @select-folder="$emit('select-folder', $event)"
    />
    
    <ResourceList
      v-if="selectedRepository"
      :repository-uuid="selectedRepository"
      class="resource-list-section"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FileExplorer from './FileExplorer.vue';
import ResourceList from './ResourceList.vue';
import type { Folder } from '@dailyuse/domain-client';

// Props
interface Props {
  selectedRepository: string | null;
}

defineProps<Props>();

// Emits
defineEmits<{
  (e: 'create-folder', parentUuid?: string): void;
  (e: 'create-resource'): void;
  (e: 'rename-folder', folder: Folder): void;
  (e: 'delete-folder', folder: Folder): void;
  (e: 'select-folder', folder: Folder | null): void;
}>();

// Refs
const fileExplorerRef = ref<InstanceType<typeof FileExplorer> | null>(null);

// Expose refresh method
defineExpose({
  refresh: () => fileExplorerRef.value?.refresh(),
});
</script>

<style scoped>
.files-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.resource-list-section {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
