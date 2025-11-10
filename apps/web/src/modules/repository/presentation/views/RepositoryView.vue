<template>
  <div class="repository-view">
    <!-- 左侧：文件夹 + 资源列表 + 仓储选择器 -->
    <div class="sidebar">
      <div class="sidebar-content">
        <!-- 文件夹树 -->
        <FileExplorer
          ref="fileExplorerRef"
          :selected-repository="selectedRepository"
          @create-folder="handleCreateFolder"
          @rename-folder="handleRenameFolder"
          @delete-folder="handleDeleteFolder"
          @select-folder="handleSelectFolder"
        />
        
        <!-- 资源列表 -->
        <ResourceList
          v-if="selectedRepository"
          :repository-uuid="selectedRepository"
          class="resource-list-section"
        />
      </div>

      <!-- 底部仓储选择器 (Obsidian 风格) - 始终显示 -->
      <div class="repository-selector">
        <v-menu location="top" :close-on-content-click="false">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              block
              variant="text"
              class="repository-selector-btn"
            >
              <v-icon :icon="currentRepository ? getRepositoryIcon(currentRepository.type) : 'mdi-database-outline'" class="mr-2" />
              <span class="flex-1 text-left">{{ currentRepository?.name || '选择仓储' }}</span>
              <v-icon icon="mdi-chevron-up" size="small" />
            </v-btn>
          </template>

          <v-card min-width="280">
            <v-card-title class="d-flex align-center py-2">
              <span class="text-subtitle-2">切换仓储</span>
              <v-spacer />
              <v-btn
                icon="mdi-plus"
                size="x-small"
                variant="text"
                @click="showCreateRepositoryDialog = true"
              />
            </v-card-title>
            <v-divider />
            
            <!-- 仓储列表 -->
            <v-list v-if="repositories.length > 0" density="compact" max-height="300" class="overflow-y-auto">
              <v-list-item
                v-for="repo in repositories"
                :key="repo.uuid"
                :active="selectedRepository === repo.uuid"
                @click="handleSelectRepository(repo.uuid)"
              >
                <template #prepend>
                  <v-icon :icon="getRepositoryIcon(repo.type)" size="small" />
                </template>
                <v-list-item-title>{{ repo.name }}</v-list-item-title>
                <template #append>
                  <v-menu>
                    <template #activator="{ props: menuProps }">
                      <v-btn
                        icon="mdi-dots-vertical"
                        size="x-small"
                        variant="text"
                        v-bind="menuProps"
                        @click.stop
                      />
                    </template>
                    <v-list density="compact">
                      <v-list-item @click="handleArchiveRepository(repo.uuid)">
                        <template #prepend>
                          <v-icon icon="mdi-archive-outline" size="small" />
                        </template>
                        <v-list-item-title>归档</v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="handleDeleteRepository(repo.uuid)">
                        <template #prepend>
                          <v-icon icon="mdi-delete-outline" size="small" color="error" />
                        </template>
                        <v-list-item-title class="text-error">删除</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </template>
              </v-list-item>
            </v-list>
            
            <!-- 空状态或管理选项 -->
            <div v-if="repositories.length === 0" class="pa-4 text-center">
              <v-icon icon="mdi-database-off-outline" size="48" class="mb-2 text-disabled" />
              <p class="text-caption text-disabled mb-3">暂无仓储</p>
              <v-btn
                color="primary"
                variant="tonal"
                size="small"
                block
                @click="showCreateRepositoryDialog = true"
              >
                <v-icon icon="mdi-plus" class="mr-1" />
                创建仓储
              </v-btn>
            </div>
            <template v-else>
              <v-divider />
              <v-list density="compact">
                <v-list-item @click="showCreateRepositoryDialog = true">
                  <template #prepend>
                    <v-icon icon="mdi-cog-outline" size="small" />
                  </template>
                  <v-list-item-title>管理仓储...</v-list-item-title>
                </v-list-item>
              </v-list>
            </template>
          </v-card>
        </v-menu>
      </div>
    </div>

    <!-- 右侧：资源编辑器 + Tab 管理 (Epic 10 Story 10-2) -->
    <div class="resource-editor-panel">
      <v-card flat class="h-100">
        <!-- Tab 管理器 -->
        <TabManager v-if="hasOpenTabs" />

        <!-- 编辑器 -->
        <div v-if="activeResourceUuid" class="editor-wrapper">
          <ResourceEditor :resource-uuid="activeResourceUuid" />
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <v-icon icon="mdi-language-markdown" size="64" class="mb-4" color="grey-lighten-1" />
          <p class="text-h6 text-grey">双击资源以打开编辑器</p>
          <p class="text-caption text-grey-lighten-1">支持 Markdown、图片、视频等多种格式</p>
        </div>
      </v-card>
    </div>

    <!-- Dialogs -->
    <CreateRepositoryDialog
      v-model="showCreateRepositoryDialog"
      @created="handleRepositoryCreated"
    />

    <CreateFolderDialog
      v-if="selectedRepository"
      v-model="showCreateFolderDialog"
      :repository-uuid="selectedRepository"
      :parent-uuid="folderParentUuid"
      @created="handleFolderCreated"
    />

    <v-dialog v-model="showRenameFolderDialog" max-width="500" persistent>
      <v-card v-if="folderToRename">
        <v-card-title>重命名文件夹</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newFolderName"
            label="新名称"
            variant="outlined"
            autofocus
            @keyup.enter="handleSubmitRename"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showRenameFolderDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="isRenaming" @click="handleSubmitRename">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDeleteFolderDialog" max-width="500">
      <v-card v-if="folderToDelete">
        <v-card-title class="text-error">
          <v-icon icon="mdi-alert-circle-outline" class="mr-2" />
          删除文件夹
        </v-card-title>
        <v-card-text>
          <p>确定要删除文件夹 <strong>{{ folderToDelete.name }}</strong> 吗？</p>
          <p class="text-caption text-disabled mt-2">此操作不可撤销，文件夹及其所有子文件夹都将被删除。</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteFolderDialog = false">取消</v-btn>
          <v-btn color="error" :loading="isDeleting" @click="handleSubmitDelete">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRepositoryStore, useFolderStore } from '../stores';
import { useResourceStore } from '../stores/resourceStore';
import { RepositoryApiClient, FolderApiClient } from '../../api';
import { Repository, Folder } from '@dailyuse/domain-client';
import FileExplorer from '../components/FileExplorer.vue';
import CreateRepositoryDialog from '../components/CreateRepositoryDialog.vue';
import CreateFolderDialog from '../components/CreateFolderDialog.vue';
import ResourceList from '../components/ResourceList.vue';
import ResourceEditor from '../components/ResourceEditor.vue';
import TabManager from '../components/TabManager.vue';

// Stores
const repositoryStore = useRepositoryStore();
const folderStore = useFolderStore();
const resourceStore = useResourceStore();

// Refs
const fileExplorerRef = ref<InstanceType<typeof FileExplorer> | null>(null);

// Local state
const isLoading = ref(false);
const error = ref<string | null>(null);
const selectedRepository = ref<string | null>(null);
const selectedFolder = ref<Folder | null>(null);

// Dialogs
const showCreateRepositoryDialog = ref(false);
const showCreateFolderDialog = ref(false);
const showRenameFolderDialog = ref(false);
const showDeleteFolderDialog = ref(false);

// Folder operations
const folderParentUuid = ref<string | undefined>(undefined);
const folderToRename = ref<Folder | null>(null);
const folderToDelete = ref<Folder | null>(null);
const newFolderName = ref('');
const isRenaming = ref(false);
const isDeleting = ref(false);

// Computed
const repositories = computed(() => repositoryStore.getAllRepositories);
const currentRepository = computed(() => 
  repositories.value.find(r => r.uuid === selectedRepository.value)
);
const hasOpenTabs = computed(() => resourceStore.openTabs.length > 0);
const activeResourceUuid = computed(() => resourceStore.activeTabUuid);

// Methods
async function loadRepositories() {
  isLoading.value = true;
  error.value = null;

  try {
    const data = await RepositoryApiClient.listRepositories();
    const repos = data.map((dto: any) => Repository.fromClientDTO(dto));
    repositoryStore.setRepositories(repos);

    // 如果有仓储，默认选中第一个
    if (repos.length > 0 && !selectedRepository.value) {
      selectedRepository.value = repos[0].uuid;
    }
  } catch (err: any) {
    error.value = err.message || '加载仓储列表失败';
    console.error('加载仓储列表失败:', err);
  } finally {
    isLoading.value = false;
  }
}

function getRepositoryIcon(type: string): string {
  const iconMap: Record<string, string> = {
    LOCAL: 'mdi-folder-outline',
    GIT: 'mdi-git',
    CLOUD: 'mdi-cloud-outline',
  };
  return iconMap[type] || 'mdi-database-outline';
}

function handleSelectRepository(uuid: string) {
  selectedRepository.value = uuid;
  selectedFolder.value = null;
}

async function handleArchiveRepository(uuid: string) {
  try {
    await RepositoryApiClient.archiveRepository(uuid);
    console.log('仓储已归档');
    loadRepositories();
  } catch (err: any) {
    console.error('归档仓储失败:', err);
  }
}

async function handleDeleteRepository(uuid: string) {
  if (!confirm('确定要删除此仓储吗？此操作不可撤销。')) return;

  try {
    await RepositoryApiClient.deleteRepository(uuid);
    repositoryStore.removeRepository(uuid);
    folderStore.removeFoldersByRepositoryUuid(uuid);
    
    if (selectedRepository.value === uuid) {
      selectedRepository.value = repositories.value[0]?.uuid || null;
    }
  } catch (err: any) {
    console.error('删除仓储失败:', err);
  }
}

function handleRepositoryCreated(repository: Repository) {
  console.log('仓储已创建:', repository.name);
  // Store已经更新，刷新 UI
  selectedRepository.value = repository.uuid;
}

function handleCreateFolder(parentUuid?: string) {
  folderParentUuid.value = parentUuid;
  showCreateFolderDialog.value = true;
}

function handleFolderCreated(folder: Folder) {
  console.log('文件夹已创建:', folder.name);
  fileExplorerRef.value?.refresh();
}

function handleRenameFolder(folder: Folder) {
  folderToRename.value = folder;
  newFolderName.value = folder.name;
  showRenameFolderDialog.value = true;
}

async function handleSubmitRename() {
  if (!folderToRename.value || !newFolderName.value) return;

  isRenaming.value = true;

  try {
    const updatedFolderDTO = await FolderApiClient.renameFolder(
      folderToRename.value.uuid,
      newFolderName.value
    );
    const updatedFolder = Folder.fromServerDTO(updatedFolderDTO);
    folderStore.updateFolder(updatedFolder.uuid, updatedFolder);
    showRenameFolderDialog.value = false;
    fileExplorerRef.value?.refresh();
  } catch (err: any) {
    console.error('重命名文件夹失败:', err);
  } finally {
    isRenaming.value = false;
  }
}

function handleDeleteFolder(folder: Folder) {
  folderToDelete.value = folder;
  showDeleteFolderDialog.value = true;
}

async function handleSubmitDelete() {
  if (!folderToDelete.value) return;

  isDeleting.value = true;

  try {
    await FolderApiClient.deleteFolder(folderToDelete.value.uuid);
    folderStore.removeFolder(folderToDelete.value.uuid);
    showDeleteFolderDialog.value = false;
    fileExplorerRef.value?.refresh();
  } catch (err: any) {
    console.error('删除文件夹失败:', err);
  } finally {
    isDeleting.value = false;
  }
}

function handleSelectFolder(folder: Folder | null) {
  selectedFolder.value = folder;
}

// Resource 相关 (Epic 10 Story 10-2)
watch(selectedRepository, async (newRepoUuid) => {
  if (newRepoUuid) {
    try {
      await resourceStore.loadResources(newRepoUuid);
    } catch (error) {
      console.error('Failed to load resources:', error);
    }
  }
});

// Lifecycle
onMounted(async () => {
  await loadRepositories();
  
  // 如果没有仓储，自动打开欢迎对话框
  if (repositories.value.length === 0) {
    showCreateRepositoryDialog.value = true;
  }
});
</script>

<style scoped>
.repository-view {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 0;
  height: 100vh;
  overflow: hidden;
}

/* 左侧边栏 - Obsidian 风格 */
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.resource-list-section {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* 底部仓储选择器 - Obsidian 风格 */
.repository-selector {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding: 8px;
  background: rgb(var(--v-theme-surface));
}

.repository-selector-btn {
  justify-content: flex-start;
  text-transform: none;
  font-weight: 500;
}

/* 右侧编辑器面板 */
.resource-editor-panel {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: rgb(var(--v-theme-background));
}

.editor-wrapper {
  flex: 1;
  overflow: hidden;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 32px;
}

.h-100 {
  height: 100%;
}

.text-disabled {
  color: rgba(var(--v-theme-on-surface), 0.38);
}

.text-error {
  color: rgb(var(--v-theme-error));
}
</style>
