<template>
  <div class="document-list">
    <div v-if="loading" class="pa-4 text-center">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <v-empty-state
      v-else-if="!documents.length"
      icon="mdi-file-document-outline"
      title="暂无文档"
      text="创建您的第一个文档"
    />

    <v-row v-else>
      <v-col v-for="document in documents" :key="document.uuid" cols="12" md="6" lg="4">
        <DocumentCard
          :document="document"
          @edit="$emit('edit', $event)"
          @delete="$emit('delete', $event)"
        />
      </v-col>
    </v-row>

    <div v-if="pagination.totalPages > 1" class="mt-4 d-flex justify-center">
      <v-pagination
        :model-value="pagination.page"
        :length="pagination.totalPages"
        @update:model-value="$emit('page-change', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import DocumentCard from './DocumentCard.vue';
import type { DocumentClientDTO } from '@dailyuse/contracts/editor';

type DocumentClientDTO = DocumentClientDTO;

interface Props {
  documents: DocumentClientDTO[];
  loading?: boolean;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

withDefaults(defineProps<Props>(), {
  loading: false,
});

defineEmits<{
  edit: [document: DocumentClientDTO];
  delete: [document: DocumentClientDTO];
  'page-change': [page: number];
}>();
</script>

