<!--
  AIKnowledgeGeneratorDialog - AI 知识文档生成对话框
  
  功能：
  1. 用户输入知识主题
  2. AI 流式生成 Markdown 文档
  3. 保存到指定位置（与创建文件逻辑一致）
  
  设计原则：
  - 右键哪个文件夹，就在哪里创建（parentFolderUuid）
  - 根目录右键或工具栏按钮，在根目录创建
  - 使用 KnowledgeGenerationApplicationService 处理业务逻辑
-->

<template>
  <v-dialog
    v-model="dialogVisible"
    max-width="600"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-robot-outline" class="mr-2" color="primary" />
        AI 知识文档生成
      </v-card-title>

      <v-card-text>
        <!-- 输入阶段 -->
        <template v-if="!isGenerating && !isComplete">
          <p class="text-body-2 text-medium-emphasis mb-4">
            描述你想了解的知识主题，AI 将为你生成结构化的知识文档。
          </p>

          <v-textarea
            v-model="prompt"
            label="知识主题"
            placeholder="例如：详细讲讲软路由相关知识，包括常见软路由系统对比、硬件选型、典型应用场景等"
            rows="4"
            variant="outlined"
            counter
            maxlength="500"
            :disabled="isGenerating"
            autofocus
          />

          <v-switch
            v-model="createFolder"
            label="创建子文件夹"
            density="compact"
            color="primary"
            hide-details
            class="mt-2"
          />

          <v-text-field
            v-if="createFolder"
            v-model="folderName"
            label="文件夹名称"
            placeholder="留空则使用主题名称"
            variant="outlined"
            density="compact"
            class="mt-2"
            :disabled="isGenerating"
          />

          <div class="text-caption text-medium-emphasis mt-3">
            <v-icon icon="mdi-folder-outline" size="14" class="mr-1" />
            保存位置：{{ savePath }}
          </div>
        </template>

        <!-- 生成阶段 -->
        <template v-else-if="isGenerating">
          <div class="generation-progress">
            <div class="d-flex align-center mb-3">
              <v-progress-circular
                indeterminate
                size="20"
                width="2"
                color="primary"
                class="mr-2"
              />
              <span class="text-body-2">正在生成知识文档...</span>
            </div>

            <v-card variant="outlined" class="generated-content pa-3">
              <div class="markdown-preview" v-html="renderedContent"></div>
              <span class="cursor-blink">▌</span>
            </v-card>

            <div class="text-caption text-medium-emphasis mt-2">
              已生成 {{ generatedContent.length }} 字符
            </div>
          </div>
        </template>

        <!-- 完成阶段 -->
        <template v-else-if="isComplete">
          <v-alert type="success" variant="tonal" class="mb-4">
            <template #title>生成完成</template>
            知识文档已成功生成并保存
          </v-alert>

          <v-card variant="outlined" class="pa-3">
            <div class="d-flex align-center">
              <v-icon icon="mdi-file-document-outline" class="mr-2" color="primary" />
              <div>
                <div class="text-body-2 font-weight-medium">{{ generatedFileName }}</div>
                <div class="text-caption text-medium-emphasis">{{ resultPath }}</div>
              </div>
            </div>
          </v-card>
        </template>

        <!-- 错误提示 -->
        <v-alert v-if="error" type="error" variant="tonal" class="mt-4">
          {{ error }}
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          v-if="!isComplete"
          variant="text"
          :disabled="isGenerating"
          @click="handleCancel"
        >
          取消
        </v-btn>
        <v-btn
          v-if="!isGenerating && !isComplete"
          color="primary"
          variant="flat"
          :disabled="!canGenerate"
          @click="handleGenerate"
        >
          <v-icon icon="mdi-creation" class="mr-1" />
          生成
        </v-btn>
        <v-btn
          v-if="isComplete"
          color="primary"
          variant="flat"
          @click="handleOpenDocument"
        >
          <v-icon icon="mdi-open-in-new" class="mr-1" />
          查看文档
        </v-btn>
        <v-btn
          v-if="isComplete"
          variant="text"
          @click="handleClose"
        >
          完成
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { marked } from 'marked';
import { useRepositoryStore } from '../../stores/repositoryStore';
import { useFolderStore } from '../../stores/folderStore';
import { useResourceStore } from '../../stores/resourceStore';
import { knowledgeGenerationApplicationService } from '@/modules/ai/application/services';

// Props
interface Props {
  modelValue: boolean;
  repositoryUuid: string | null;
  /** 父文件夹 UUID，null 表示根目录 */
  parentFolderUuid?: string | null;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'generated', data: { folderUuid?: string; resourceUuid: string }): void;
}>();

// Stores
const repositoryStore = useRepositoryStore();
const folderStore = useFolderStore();
const resourceStore = useResourceStore();

// State
const prompt = ref('');
const folderName = ref('');
const createFolder = ref(true);
const generatedContent = ref('');
const isGenerating = ref(false);
const isComplete = ref(false);
const error = ref('');
const generatedResourceUuid = ref<string | null>(null);
const generatedFolderUuid = ref<string | null>(null);
const generatedFileName = ref('');
const resultPath = ref('');

// Computed
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const canGenerate = computed(() => {
  return prompt.value.trim().length >= 2 && props.repositoryUuid;
});

const parentFolderName = computed(() => {
  if (!props.parentFolderUuid) return null;
  const folder = folderStore.folders.find(f => f.uuid === props.parentFolderUuid);
  return folder?.name || null;
});

const savePath = computed(() => {
  const repo = repositoryStore.repositories.find((r) => r.uuid === props.repositoryUuid);
  const repoName = repo?.name || '知识库';
  const parentPath = parentFolderName.value ? `/${parentFolderName.value}` : '';
  const folderPath = createFolder.value ? `/${folderName.value || extractTopicName(prompt.value) || '新知识'}` : '';
  return `${repoName}${parentPath}${folderPath}`;
});

const renderedContent = computed(() => {
  try {
    return marked(generatedContent.value);
  } catch {
    return generatedContent.value;
  }
});

// Watch prompt to auto-generate folder name
watch(prompt, (newPrompt) => {
  if (!folderName.value && newPrompt) {
    folderName.value = extractTopicName(newPrompt);
  }
});

// Reset state when dialog opens
watch(dialogVisible, (visible) => {
  if (visible) {
    prompt.value = '';
    folderName.value = '';
    createFolder.value = true;
    generatedContent.value = '';
    isGenerating.value = false;
    isComplete.value = false;
    error.value = '';
    generatedResourceUuid.value = null;
    generatedFolderUuid.value = null;
    resultPath.value = '';
  }
});

// Helper: 从提示词中提取主题名称
function extractTopicName(text: string): string {
  const keywords = text.match(/[\u4e00-\u9fa5a-zA-Z0-9]+/g);
  if (keywords && keywords.length > 0) {
    return keywords.slice(0, 3).join('').substring(0, 30);
  }
  return '';
}

// Methods
async function handleGenerate() {
  if (!canGenerate.value || !props.repositoryUuid) return;

  isGenerating.value = true;
  error.value = '';
  generatedContent.value = '';

  try {
    const result = await knowledgeGenerationApplicationService.generateKnowledge(
      {
        topic: prompt.value.trim(),
        repositoryUuid: props.repositoryUuid,
        parentFolderUuid: props.parentFolderUuid,
        createFolder: createFolder.value,
        folderName: folderName.value.trim() || undefined,
      },
      (chunk) => {
        generatedContent.value += chunk;
      }
    );

    generatedResourceUuid.value = result.resourceUuid;
    generatedFolderUuid.value = result.folderUuid || null;
    generatedFileName.value = result.fileName;
    resultPath.value = result.filePath;
    isComplete.value = true;
  } catch (err: any) {
    error.value = err.message || '生成失败，请重试';
    console.error('AI 知识生成失败:', err);
  } finally {
    isGenerating.value = false;
  }
}

function handleCancel() {
  dialogVisible.value = false;
}

function handleClose() {
  dialogVisible.value = false;
}

async function handleOpenDocument() {
  if (generatedResourceUuid.value) {
    const resource = resourceStore.resources.find(r => r.uuid === generatedResourceUuid.value);
    if (resource) {
      await resourceStore.openInTab(resource);
    }
    emit('generated', {
      folderUuid: generatedFolderUuid.value || undefined,
      resourceUuid: generatedResourceUuid.value,
    });
  }
  dialogVisible.value = false;
}
</script>

<style scoped>
.generation-progress {
  min-height: 200px;
}

.generated-content {
  max-height: 300px;
  overflow-y: auto;
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.markdown-preview {
  font-size: 13px;
  line-height: 1.6;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3) {
  margin-top: 12px;
  margin-bottom: 8px;
}

.markdown-preview :deep(p) {
  margin-bottom: 8px;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  padding-left: 20px;
  margin-bottom: 8px;
}

.cursor-blink {
  animation: blink 1s step-end infinite;
  color: rgb(var(--v-theme-primary));
}

@keyframes blink {
  50% { opacity: 0; }
}
</style>
