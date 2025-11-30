<template>
  <v-card :to="`/repository/${document.uuid}`" hover>
    <v-card-title>{{ document.name }}</v-card-title>
    
    <v-card-subtitle class="text-grey">
      <v-icon size="small" class="mr-1">mdi-folder</v-icon>
      {{ getFolderPath(document.path) }}
      <span class="mx-2">·</span>
      {{ document.formattedUpdatedAt }}
    </v-card-subtitle>

    <v-card-text>
      <p class="text-body-2 text-grey-darken-1">{{ getExcerpt(document.content) }}</p>
      
      <div v-if="document.metadata.tags.length" class="mt-2">
        <v-chip
          v-for="tag in document.metadata.tags"
          :key="tag"
          size="small"
          class="mr-1"
        >
          {{ tag }}
        </v-chip>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-chip size="small" :color="getIndexStatusColor(document.indexStatus)">
        {{ getIndexStatusText(document.indexStatus) }}
      </v-chip>
      <v-spacer />
      <v-btn icon="mdi-pencil" size="small" @click.prevent="$emit('edit', document)" />
      <v-btn icon="mdi-delete" size="small" color="error" @click.prevent="$emit('delete', document)" />
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import type { DocumentClientDTO } from '@dailyuse/contracts/editor';
import { IndexStatus } from '@dailyuse/contracts/editor';


interface Props {
  document: DocumentClientDTO;
}

defineProps<Props>();

defineEmits<{
  edit: [document: DocumentClientDTO];
  delete: [document: DocumentClientDTO];
}>();

const getFolderPath = (path: string): string => {
  const lastSlash = path.lastIndexOf('/');
  return lastSlash > 0 ? path.substring(0, lastSlash) : '/';
};

const getExcerpt = (content: string, maxLength = 100): string => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
};

const getIndexStatusColor = (status: IndexStatus): string => {
  switch (status) {
    case IndexStatus.INDEXED: return 'success';
    case IndexStatus.NOT_INDEXED: return 'grey';
    case IndexStatus.INDEXING: return 'warning';
    case IndexStatus.FAILED: return 'error';
    case IndexStatus.OUTDATED: return 'orange';
    default: return 'grey';
  }
};

const getIndexStatusText = (status: IndexStatus): string => {
  switch (status) {
    case IndexStatus.INDEXED: return '已索引';
    case IndexStatus.NOT_INDEXED: return '未索引';
    case IndexStatus.INDEXING: return '索引中';
    case IndexStatus.FAILED: return '索引失败';
    case IndexStatus.OUTDATED: return '需更新';
    default: return '未知';
  }
};
</script>

