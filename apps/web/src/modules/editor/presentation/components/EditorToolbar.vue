<template>
  <v-toolbar density="compact" color="surface">
    <v-toolbar-title class="text-subtitle-2">Markdown 编辑器</v-toolbar-title>
    <v-spacer />
    <v-btn-group density="compact" variant="text">
      <v-menu>
        <template #activator="{ props }">
          <v-btn icon="mdi-format-header-pound" v-bind="props" size="small" />
        </template>
        <v-list density="compact">
          <v-list-item v-for="level in 6" :key="level" @click="insertHeading(level)">
            <v-list-item-title>标题 {{ level }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-divider vertical />
      <v-btn icon="mdi-format-bold" size="small" @click="insertBold" />
      <v-btn icon="mdi-format-italic" size="small" @click="insertItalic" />
      <v-btn icon="mdi-format-strikethrough" size="small" @click="insertStrikethrough" />
      <v-divider vertical />
      <v-btn icon="mdi-code-tags" size="small" @click="insertInlineCode" />
      <v-btn icon="mdi-code-block-tags" size="small" @click="insertCodeBlock" />
      <v-divider vertical />
      <v-btn icon="mdi-link" size="small" @click="insertLink" />
      <v-btn icon="mdi-image" size="small" @click="insertImage" />
      <v-divider vertical />
      <v-btn icon="mdi-format-list-bulleted" size="small" @click="insertUnorderedList" />
      <v-btn icon="mdi-format-list-numbered" size="small" @click="insertOrderedList" />
      <v-btn icon="mdi-checkbox-marked-outline" size="small" @click="insertTaskList" />
      <v-divider vertical />
      <v-btn icon="mdi-format-quote-close" size="small" @click="insertQuote" />
      <v-btn icon="mdi-minus" size="small" @click="insertDivider" />
      <v-btn icon="mdi-table" size="small" @click="insertTable" />
    </v-btn-group>
    <v-spacer />
    <v-btn-toggle v-model="viewMode" density="compact" mandatory @update:model-value="$emit('view-mode-change', $event)">
      <v-btn value="edit" size="small"><v-icon>mdi-pencil</v-icon></v-btn>
      <v-btn value="split" size="small"><v-icon>mdi-view-split-vertical</v-icon></v-btn>
      <v-btn value="preview" size="small"><v-icon>mdi-eye</v-icon></v-btn>
    </v-btn-toggle>
    <v-divider vertical class="mx-2" />
    <v-btn color="primary" prepend-icon="mdi-content-save" :loading="saving" @click="$emit('save')">保存</v-btn>
  </v-toolbar>
</template>

<script setup lang="ts">
import { ref } from 'vue';
interface Props { saving?: boolean; }
defineProps<Props>();
const emit = defineEmits<{
  'insert-text': [text: string];
  'wrap-selection': [prefix: string, suffix: string];
  'view-mode-change': [mode: 'edit' | 'split' | 'preview'];
  save: [];
}>();
const viewMode = ref<'edit' | 'split' | 'preview'>('split');
function insertHeading(level: number) { emit('insert-text', '#'.repeat(level) + ' '); }
function insertBold() { emit('wrap-selection', '**', '**'); }
function insertItalic() { emit('wrap-selection', '*', '*'); }
function insertStrikethrough() { emit('wrap-selection', '~~', '~~'); }
function insertInlineCode() { emit('wrap-selection', '`', '`'); }
function insertCodeBlock() { emit('insert-text', '\n```\n\n```\n'); }
function insertLink() { emit('wrap-selection', '[', '](url)'); }
function insertImage() { emit('wrap-selection', '![', '](url)'); }
function insertUnorderedList() { emit('insert-text', '\n- '); }
function insertOrderedList() { emit('insert-text', '\n1. '); }
function insertTaskList() { emit('insert-text', '\n- [ ] '); }
function insertQuote() { emit('insert-text', '\n> '); }
function insertDivider() { emit('insert-text', '\n\n---\n\n'); }
function insertTable() { emit('insert-text', '\n| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| 内容 | 内容 | 内容 |\n'); }
</script>
