<template>
  <v-card class="summary-display" elevation="2" role="article" aria-labelledby="summary-title">
    <!-- Header -->
    <v-card-title id="summary-title" class="summary-header">
      <v-icon icon="mdi-file-document-outline" class="mr-2" />
      摘要结果
      <v-spacer />
      <v-btn
        icon="mdi-content-copy"
        variant="text"
        size="small"
        @click="$emit('copy')"
        @keydown.enter="$emit('copy')"
        title="复制到剪贴板"
        aria-label="复制摘要到剪贴板"
      />
    </v-card-title>

    <v-divider />

    <!-- Core Summary -->
    <v-card-text class="summary-section">
      <div class="section-title" role="heading" aria-level="3">
        <v-icon icon="mdi-text-box-outline" size="small" class="mr-2" />
        核心摘要
      </div>
      <p class="core-text">{{ summary.summary.core }}</p>
    </v-card-text>

    <v-divider />

    <!-- Key Points -->
    <v-card-text class="summary-section">
      <div class="section-title" role="heading" aria-level="3">
        <v-icon icon="mdi-format-list-bulleted" size="small" class="mr-2" />
        关键要点
      </div>
      <v-list density="compact" class="key-points-list" role="list">
        <v-list-item
          v-for="(point, index) in summary.summary.keyPoints"
          :key="index"
          class="key-point-item"
          role="listitem"
        >
          <template #prepend>
            <span class="point-number">{{ index + 1 }}</span>
          </template>
          <v-list-item-title>{{ point }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card-text>

    <!-- Action Items (if present) -->
    <template v-if="summary.summary.actionItems && summary.summary.actionItems.length > 0">
      <v-divider />
      <v-card-text class="summary-section">
        <div class="section-title" role="heading" aria-level="3">
          <v-icon icon="mdi-checkbox-marked-outline" size="small" class="mr-2" />
          行动建议
        </div>
        <v-list density="compact" class="action-items-list" role="list">
          <v-list-item
            v-for="(item, index) in summary.summary.actionItems"
            :key="index"
            class="action-item"
            role="listitem"
          >
            <template #prepend>
              <v-icon icon="mdi-arrow-right" size="small" />
            </template>
            <v-list-item-title>{{ item }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
    </template>

    <v-divider />

    <!-- Metadata -->
    <v-card-text class="metadata-section">
      <div class="metadata-chips" role="complementary" aria-label="摘要统计信息">
        <v-chip size="small" variant="outlined" color="primary" class="mr-2" aria-label="AI令牌消耗">
          <v-icon icon="mdi-chip" size="x-small" class="mr-1" />
          Token: {{ summary.metadata.tokensUsed }}
        </v-chip>
        <v-chip size="small" variant="outlined" color="success" class="mr-2" aria-label="文本压缩率">
          <v-icon icon="mdi-compress" size="x-small" class="mr-1" />
          压缩率: {{ compressionRatioPercent }}%
        </v-chip>
        <v-chip size="small" variant="outlined" color="info" aria-label="原始文本长度">
          <v-icon icon="mdi-text" size="x-small" class="mr-1" />
          原文: {{ summary.metadata.inputLength }} 字符
        </v-chip>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SummaryResult } from '../types/summarization';

// ============ Props ============
interface Props {
  summary: SummaryResult;
}

const props = defineProps<Props>();

// ============ Emits ============
defineEmits<{
  copy: [];
}>();

// ============ Computed ============
const compressionRatioPercent = computed(() => {
  return (props.summary.metadata.compressionRatio * 100).toFixed(1);
});
</script>

<style scoped>
.summary-display {
  margin-top: 16px;
}

.summary-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

.summary-section {
  padding: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 1rem;
  color: #333;
  margin-bottom: 12px;
}

.core-text {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #555;
  margin: 0;
}

.key-points-list,
.action-items-list {
  background: transparent !important;
}

.key-point-item {
  padding: 8px 0;
}

.point-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #667eea;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  margin-right: 8px;
}

.action-item {
  padding: 6px 0;
}

.metadata-section {
  background-color: #f5f5f5;
  padding: 16px 20px;
}

.metadata-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
