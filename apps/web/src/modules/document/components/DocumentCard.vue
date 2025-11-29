<template>
  <v-card :to="`/repository/${document.uuid}`" hover>
    <v-card-title>{{ document.title }}</v-card-title>
    
    <v-card-subtitle class="text-grey">
      <v-icon size="small" class="mr-1">mdi-folder</v-icon>
      {{ document.folderPath }}
      <span class="mx-2">·</span>
      {{ formatDate(document.updatedAt) }}
    </v-card-subtitle>

    <v-card-text>
      <p class="text-body-2 text-grey-darken-1">{{ document.excerpt }}</p>
      
      <div v-if="document.tags.length" class="mt-2">
        <v-chip
          v-for="tag in document.tags"
          :key="tag"
          size="small"
          class="mr-1"
        >
          {{ tag }}
        </v-chip>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-chip size="small" :color="getStatusColor(document.status)">
        {{ getStatusText(document.status) }}
      </v-chip>
      <v-spacer />
      <v-btn icon="mdi-pencil" size="small" @click.prevent="$emit('edit', document)" />
      <v-btn icon="mdi-delete" size="small" color="error" @click.prevent="$emit('delete', document)" />
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import type { DocumentClientDTO } from '@dailyuse/contracts/editor';


interface Props {
  document: DocumentClientDTO;
}

defineProps<Props>();

defineEmits<{
  edit: [document: DocumentClientDTO];
  delete: [document: DocumentClientDTO];
}>();

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString('zh-CN');
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DRAFT': return 'grey';
    case 'PUBLISHED': return 'success';
    case 'ARCHIVED': return 'warning';
    default: return 'default';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'DRAFT': return '草稿';
    case 'PUBLISHED': return '已发布';
    case 'ARCHIVED': return '已归档';
    default: return status;
  }
};
</script>

