<template>
  <v-card class="knowledge-document-card" elevation="2" rounded="lg">
    <!-- Status Badge -->
    <v-chip
      :color="statusColor"
      variant="flat"
      size="small"
      class="status-chip"
    >
      <v-icon start :icon="statusIcon" size="x-small" />
      {{ statusText }}
    </v-chip>

    <!-- Document Content -->
    <v-card-title class="text-h6 text-wrap">
      {{ document.title }}
    </v-card-title>

    <v-card-text>
      <!-- Excerpt -->
      <p class="text-body-2 excerpt">
        {{ document.excerpt }}
      </p>

      <!-- Word Count -->
      <div class="mt-2">
        <v-chip size="x-small" variant="tonal" color="grey-darken-1">
          <v-icon start icon="mdi-text" size="x-small" />
          {{ document.wordCount }} 字
        </v-chip>
      </div>

      <!-- Error Message (if failed) -->
      <v-alert
        v-if="document.status === 'FAILED' && document.errorMessage"
        type="error"
        variant="tonal"
        density="compact"
        class="mt-3"
        closable
      >
        {{ document.errorMessage }}
      </v-alert>
    </v-card-text>

    <!-- Actions -->
    <v-card-actions v-if="document.status === 'COMPLETED'">
      <v-spacer />
      <v-btn
        color="error"
        variant="text"
        size="small"
        @click="$emit('discard')"
        :aria-label="`丢弃文档 ${document.title}`"
        data-test="btn-discard-doc"
      >
        <v-icon start icon="mdi-delete" />
        丢弃
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { GeneratedDocumentPreview } from '../types/knowledgeGeneration';

// ============================================================
// Props & Emits
// ============================================================

interface Props {
  document: GeneratedDocumentPreview;
}

const props = defineProps<Props>();

defineEmits<{
  discard: [];
}>();

// ============================================================
// Computed Properties
// ============================================================

const statusColor = computed(() => {
  switch (props.document.status) {
    case 'GENERATING':
      return 'blue';
    case 'COMPLETED':
      return 'success';
    case 'FAILED':
      return 'error';
    default:
      return 'grey';
  }
});

const statusIcon = computed(() => {
  switch (props.document.status) {
    case 'GENERATING':
      return 'mdi-sync';
    case 'COMPLETED':
      return 'mdi-check-circle';
    case 'FAILED':
      return 'mdi-alert-circle';
    default:
      return 'mdi-file-document';
  }
});

const statusText = computed(() => {
  switch (props.document.status) {
    case 'GENERATING':
      return '生成中';
    case 'COMPLETED':
      return '已完成';
    case 'FAILED':
      return '失败';
    default:
      return '未知';
  }
});
</script>

<style scoped>
.knowledge-document-card {
  position: relative;
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.knowledge-document-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15) !important;
}

.status-chip {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
}

.excerpt {
  color: rgba(0, 0, 0, 0.6);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
  min-height: 4.5em; /* 3 lines */
}
</style>
