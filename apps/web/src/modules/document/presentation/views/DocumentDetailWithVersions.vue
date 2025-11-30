<template>
  <v-container fluid>
    <v-row>
      <!-- Main Document Content (Left) -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span>{{ document?.name || '文档详情' }}</span>
            <div>
              <v-btn
                icon="mdi-history"
                variant="text"
                @click="toggleVersionPanel"
              >
                <v-badge
                  :content="versionState.totalVersions.value"
                  color="primary"
                  :model-value="versionState.totalVersions.value > 0"
                >
                  <v-icon>mdi-history</v-icon>
                </v-badge>
              </v-btn>
            </div>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <div v-if="document">
              <p class="text-caption text-medium-emphasis mb-2">
                最后更新: {{ document.formattedUpdatedAt || formatDate(String(document.updatedAt)) }}
              </p>
              <div v-html="document.content" class="document-content" />
            </div>
            <v-skeleton-loader v-else type="article" />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Version History Panel (Right) -->
      <v-col v-if="showVersionPanel" cols="12" md="4">
        <VersionHistoryList
          :versions="versionState.versions.value ?? []"
          :total-versions="versionState.totalVersions.value ?? 0"
          :loading="versionState.loading.value ?? false"
          :has-versions="versionState.hasVersions.value ?? false"
          :has-more-pages="versionState.hasMorePages.value ?? false"
          @select-version="handleSelectVersion"
          @compare="handleCompareVersion"
          @restore="handleRestoreVersion"
          @load-more="versionState.loadMore"
          @refresh="versionState.refresh"
        />
      </v-col>
    </v-row>

    <!-- Version Diff Dialog -->
    <v-dialog
      v-model="showDiffDialog"
      max-width="1200"
      scrollable
    >
      <VersionDiffViewer
        v-if="versionState.comparison"
        :comparison="versionState.comparison"
        @close="showDiffDialog = false"
      />
    </v-dialog>

    <!-- Restore Confirmation Dialog -->
    <v-dialog v-model="showRestoreDialog" max-width="500">
      <v-card>
        <v-card-title>确认恢复版本</v-card-title>
        <v-card-text>
          <p>您确定要恢复到版本 {{ selectedVersionToRestore?.versionNumber }} 吗？</p>
          <p class="text-caption text-warning">
            注意：这将创建一个新版本，不会删除当前版本。
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showRestoreDialog = false">取消</v-btn>
          <v-btn
            color="primary"
            :loading="versionState.restoring.value"
            @click="confirmRestore"
          >
            确认恢复
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useDocumentVersion } from '../composables/useDocumentVersion';
import VersionHistoryList from '../components/VersionHistoryList.vue';
import VersionDiffViewer from '../components/VersionDiffViewer.vue';
import type { DocumentClientDTO, DocumentVersionClientDTO } from '@dailyuse/contracts/editor';
import { DocumentLanguage, IndexStatus } from '@dailyuse/contracts/editor';


// ==================== Route & State ====================
const route = useRoute();
const documentUuid = computed(() => route.params.uuid as string);

const document = ref<DocumentClientDTO | null>(null);
const showVersionPanel = ref(true);
const showDiffDialog = ref(false);
const showRestoreDialog = ref(false);
const selectedVersionToRestore = ref<DocumentVersionClientDTO | null>(null);

const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
});

// ==================== Version Management ====================
const versionState = useDocumentVersion(documentUuid.value);

// ==================== Handlers ====================
function toggleVersionPanel() {
  showVersionPanel.value = !showVersionPanel.value;
}

function handleSelectVersion(version: DocumentVersionClientDTO) {
  console.log('Selected version:', version);
  // TODO: Load version snapshot and display
}

async function handleCompareVersion(version: DocumentVersionClientDTO) {
  if (!document.value) return;
  
  try {
    // Compare with latest version (first in history list)
    const latestVersion = versionState.versions.value?.[0];
    const latestVersionNumber = latestVersion?.versionNumber ?? version.versionNumber;
    
    await versionState.compareVersions(
      version.versionNumber,
      latestVersionNumber
    );
    showDiffDialog.value = true;
  } catch (error) {
    showSnackbar('比较版本失败', 'error');
  }
}

function handleRestoreVersion(version: DocumentVersionClientDTO) {
  selectedVersionToRestore.value = version;
  showRestoreDialog.value = true;
}

async function confirmRestore() {
  if (!selectedVersionToRestore.value) return;
  
  const success = await versionState.restoreToVersion(
    selectedVersionToRestore.value.versionNumber
  );
  
  showRestoreDialog.value = false;
  selectedVersionToRestore.value = null;
  
  if (success) {
    showSnackbar('版本恢复成功', 'success');
    // TODO: Reload document
  } else {
    showSnackbar('版本恢复失败', 'error');
  }
}

function showSnackbar(message: string, color: string) {
  snackbar.value = { show: true, message, color };
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
}

// ==================== Lifecycle ====================
onMounted(async () => {
  // TODO: Load document details
  // For now, mock data
  document.value = {
    uuid: documentUuid.value,
    workspaceUuid: '',
    accountUuid: '',
    path: '/documents/示例文档.md',
    name: '示例文档',
    language: DocumentLanguage.MARKDOWN,
    content: '<p>这是文档内容...</p>',
    contentHash: '',
    metadata: {
      tags: [],
      category: null,
      wordCount: 50,
      characterCount: 200,
      readingTime: 1,
      wordCountFormatted: '50 字',
      readingTimeFormatted: '1 分钟',
    },
    indexStatus: IndexStatus.NOT_INDEXED,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    formattedCreatedAt: new Date().toLocaleString('zh-CN'),
    formattedUpdatedAt: new Date().toLocaleString('zh-CN'),
  };
  
  // Load version history
  await versionState.loadVersions();
});
</script>

<style scoped>
.document-content {
  line-height: 1.8;
  font-size: 1rem;
}
</style>

