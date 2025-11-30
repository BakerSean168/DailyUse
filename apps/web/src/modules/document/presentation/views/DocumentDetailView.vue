<!--
  Document Detail View with Version Management
  文档详情页面 - 集成版本历史功能
-->
<template>
  <v-container fluid class="document-detail-container">
    <!-- Loading State -->
    <v-card v-if="loading" class="d-flex align-center justify-center" style="min-height: 400px">
      <div class="text-center">
        <v-progress-circular indeterminate color="primary" size="64" />
        <p class="text-h6 text-medium-emphasis mt-4">加载文档...</p>
      </div>
    </v-card>

    <!-- Error State -->
    <v-card v-else-if="error" class="d-flex align-center justify-center" style="min-height: 400px">
      <div class="text-center">
        <v-icon size="64" color="error">mdi-alert-circle</v-icon>
        <p class="text-h6 mt-4">{{ error }}</p>
        <v-btn color="primary" class="mt-4" @click="$router.back()">返回</v-btn>
      </div>
    </v-card>

    <!-- Document Detail -->
    <v-row v-else-if="document">
      <!-- Left: Document Content -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <div>
              <h2>{{ document.name }}</h2>
              <div class="text-caption text-medium-emphasis mt-1">
                {{ document.path }}
              </div>
            </div>
            
            <div>
              <v-btn
                icon="mdi-history"
                variant="text"
                @click="showVersionHistory = !showVersionHistory"
                :color="showVersionHistory ? 'primary' : ''"
              >
                <v-icon>mdi-history</v-icon>
                <v-tooltip activator="parent" location="bottom">版本历史</v-tooltip>
              </v-btn>
              <v-btn
                icon="mdi-pencil"
                variant="text"
                @click="editDialog = true"
              >
                <v-icon>mdi-pencil</v-icon>
                <v-tooltip activator="parent" location="bottom">编辑文档</v-tooltip>
              </v-btn>
            </div>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <!-- Document Metadata -->
            <div class="mb-4">
              <v-chip size="small" class="mr-2">
                <v-icon start size="small">mdi-folder</v-icon>
                {{ getFolderPath(document.path) }}
              </v-chip>
              <v-chip
                v-for="tag in document.metadata.tags"
                :key="tag"
                size="small"
                class="mr-2"
                color="primary"
                variant="outlined"
              >
                {{ tag }}
              </v-chip>
            </div>

            <!-- Document Content (Markdown rendered) -->
            <div class="document-content">
              <div v-html="renderedContent" class="markdown-body" />
            </div>

            <!-- Document Info -->
            <v-divider class="my-4" />
            <div class="text-caption text-medium-emphasis">
              创建时间: {{ document.formattedCreatedAt }}
              <span class="mx-2">·</span>
              更新时间: {{ document.formattedUpdatedAt }}
              <span v-if="document.formattedLastModified" class="mx-2">·</span>
              <span v-if="document.formattedLastModified">
                最后修改: {{ document.formattedLastModified }}
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right: Version History Sidebar -->
      <v-col cols="12" md="4">
        <v-expand-transition>
          <div v-show="showVersionHistory">
            <VersionHistoryList
              :versions="versions ?? []"
              :total-versions="totalVersions ?? 0"
              :loading="versionLoading ?? false"
              :has-versions="hasVersions ?? false"
              :has-more-pages="hasMorePages ?? false"
              @select-version="handleSelectVersion"
              @compare="handleCompareVersion"
              @restore="handleRestoreVersion"
              @load-more="loadMore"
              @refresh="refresh"
            />
          </div>
        </v-expand-transition>
      </v-col>
    </v-row>

    <!-- Edit Dialog -->
    <v-dialog v-model="editDialog" max-width="900px" persistent scrollable>
      <v-card>
        <v-card-title>编辑文档</v-card-title>
        <v-card-text>
          <v-form ref="formRef">
            <v-text-field
              v-model="editForm.name"
              label="文件名"
              :rules="[(v) => !!v || '文件名不能为空']"
            />
            <v-text-field
              v-model="editForm.path"
              label="文件路径"
              :rules="[(v) => !!v || '路径不能为空']"
            />
            <v-textarea
              v-model="editForm.content"
              label="内容 (Markdown)"
              rows="15"
              auto-grow
            />
            <v-combobox
              v-model="editForm.tags"
              label="标签"
              chips
              multiple
              closable-chips
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="editDialog = false">取消</v-btn>
          <v-btn color="primary" @click="handleSave" :loading="saving">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Version Comparison Dialog -->
    <v-dialog v-model="comparisonDialog" max-width="1200px" scrollable>
      <VersionDiffViewer
        v-if="comparison"
        :comparison="comparison"
        @close="comparisonDialog = false"
      />
    </v-dialog>

    <!-- Restore Confirmation Dialog -->
    <v-dialog v-model="restoreDialog.show" max-width="500px">
      <v-card>
        <v-card-title>确认恢复版本</v-card-title>
        <v-card-text>
          确定要恢复到版本 v{{ restoreDialog.versionNumber }} 吗？
          <br />
          <span class="text-caption text-medium-emphasis">
            这将创建一个新版本，内容为选定版本的快照。
          </span>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="restoreDialog.show = false">取消</v-btn>
          <v-btn
            color="primary"
            @click="confirmRestore"
            :loading="restoring"
          >
            确认恢复
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { marked } from 'marked';
import VersionHistoryList from '../components/VersionHistoryList.vue';
import VersionDiffViewer from '../components/VersionDiffViewer.vue';
import { useDocumentVersion } from '../composables/useDocumentVersion';
import type { DocumentClientDTO, DocumentVersionClientDTO } from '@dailyuse/contracts/editor';
import { DocumentLanguage, IndexStatus } from '@dailyuse/contracts/editor';


const route = useRoute();
const router = useRouter();

// Helper function
function getFolderPath(path: string): string {
  const lastSlash = path.lastIndexOf('/');
  return lastSlash > 0 ? path.substring(0, lastSlash) : '/';
}

// Document State
const document = ref<DocumentClientDTO | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// Edit State
const editDialog = ref(false);
const editForm = ref({
  name: '',
  content: '',
  path: '',
  tags: [] as string[],
});
const formRef = ref();
const saving = ref(false);

// Version Management State
const showVersionHistory = ref(false);
const comparisonDialog = ref(false);
const restoreDialog = ref({
  show: false,
  versionNumber: 0,
});

// Version Composable (only initialize when document loaded)
const documentUuid = computed(() => route.params.uuid as string);
const versionComposable = computed(() => {
  if (!documentUuid.value) return null;
  return useDocumentVersion(documentUuid.value);
});

const {
  versions,
  totalVersions,
  loading: versionLoading,
  comparison,
  restoring,
  hasVersions,
  hasMorePages,
  loadVersions,
  loadMore,
  compareVersions,
  restoreToVersion,
  clearComparison,
  refresh,
} = versionComposable.value || {};

// Computed
const renderedContent = computed(() => {
  if (!document.value?.content) return '';
  return marked(document.value.content);
});

// Methods
async function loadDocument() {
  loading.value = true;
  error.value = null;
  
  try {
    // TODO: Replace with actual API call
    // const response = await documentApi.getByUuid(documentUuid.value);
    // document.value = response;
    
    // Mock data for demo
    const now = Date.now();
    document.value = {
      uuid: documentUuid.value,
      workspaceUuid: 'workspace-1',
      accountUuid: 'account-1',
      path: '/personal/notes/example.md',
      name: '示例文档.md',
      language: DocumentLanguage.MARKDOWN,
      content: '# 欢迎\n\n这是一个示例文档，支持 Markdown 格式。\n\n## 功能特性\n\n- 版本历史\n- Git 风格 Diff\n- 版本恢复',
      contentHash: 'hash123',
      metadata: {
        tags: ['示例', 'Markdown'],
        category: null,
        wordCount: 50,
        characterCount: 200,
        readingTime: 1,
        wordCountFormatted: '50 字',
        readingTimeFormatted: '1 分钟',
      },
      indexStatus: IndexStatus.INDEXED,
      lastIndexedAt: now,
      lastModifiedAt: now,
      createdAt: now,
      updatedAt: now,
      formattedLastIndexed: new Date(now).toLocaleString('zh-CN'),
      formattedLastModified: new Date(now).toLocaleString('zh-CN'),
      formattedCreatedAt: new Date(now).toLocaleString('zh-CN'),
      formattedUpdatedAt: new Date(now).toLocaleString('zh-CN'),
    };
    
    // Load version history if composable is available
    if (loadVersions) {
      await loadVersions();
    }
  } catch (err: any) {
    error.value = err.message || '加载文档失败';
    console.error('Load document error:', err);
  } finally {
    loading.value = false;
  }
}

function handleSelectVersion(version: DocumentVersionClientDTO) {
  console.log('Selected version:', version);
  // TODO: Implement version preview
}

async function handleCompareVersion(version: DocumentVersionClientDTO) {
  if (!compareVersions) return;
  
  const versionsList = versions?.value ?? [];
  if (!versionsList.length) return;
  
  // Compare with latest version
  const latestVersion = versionsList[0]?.versionNumber || 1;
  
  try {
    await compareVersions(version.versionNumber, latestVersion);
    comparisonDialog.value = true;
  } catch (err) {
    console.error('Compare version error:', err);
  }
}

function handleRestoreVersion(version: DocumentVersionClientDTO) {
  restoreDialog.value = {
    show: true,
    versionNumber: version.versionNumber,
  };
}

async function confirmRestore() {
  if (!restoreToVersion) return;
  
  const success = await restoreToVersion(restoreDialog.value.versionNumber);
  if (success) {
    restoreDialog.value.show = false;
    // Reload document
    await loadDocument();
  }
}

async function handleSave() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  
  saving.value = true;
  try {
    // TODO: Replace with actual API call
    // await documentApi.update(documentUuid.value, editForm.value);
    
    // Update local state
    if (document.value) {
      const now = Date.now();
      document.value = {
        ...document.value,
        name: editForm.value.name,
        path: editForm.value.path,
        content: editForm.value.content,
        metadata: {
          ...document.value.metadata,
          tags: editForm.value.tags,
        },
        updatedAt: now,
        formattedUpdatedAt: new Date(now).toLocaleString('zh-CN'),
      };
    }
    
    editDialog.value = false;
    
    // Reload version history
    if (refresh) {
      await refresh();
    }
  } catch (err) {
    console.error('Save document error:', err);
  } finally {
    saving.value = false;
  }
}

// Lifecycle
onMounted(() => {
  loadDocument();
});
</script>

<style scoped>
.document-detail-container {
  padding: 24px;
}

.document-content {
  padding: 16px 0;
}

.markdown-body {
  line-height: 1.8;
  font-size: 16px;
}

.markdown-body h1 {
  font-size: 2em;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  padding-bottom: 8px;
}

.markdown-body h2 {
  font-size: 1.5em;
  margin-top: 24px;
  margin-bottom: 12px;
}

.markdown-body h3 {
  font-size: 1.25em;
  margin-top: 16px;
  margin-bottom: 8px;
}

.markdown-body p {
  margin-bottom: 16px;
}

.markdown-body ul,
.markdown-body ol {
  margin-bottom: 16px;
  padding-left: 32px;
}

.markdown-body li {
  margin-bottom: 4px;
}

.markdown-body code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
}

.markdown-body pre {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 16px;
}

.markdown-body pre code {
  background-color: transparent;
  padding: 0;
}
</style>

