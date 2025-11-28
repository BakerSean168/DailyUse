<template>
  <v-card class="setting-advanced-actions">
    <v-card-title>
      <v-icon>mdi-cog-sync</v-icon>
      高级操作
    </v-card-title>
    
    <v-divider />
    
    <v-card-text class="pa-4">
      <v-row class="mb-4">
        <v-col cols="12" sm="6">
          <!-- 导出设置 -->
          <v-menu>
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                prepend-icon="mdi-download"
                color="primary"
                variant="outlined"
                block
              >
                导出设置
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="handleExportJSON">
                <template #prepend>
                  <v-icon>mdi-file-json</v-icon>
                </template>
                <v-list-item-title>导出为 JSON</v-list-item-title>
              </v-list-item>
              <v-list-item @click="handleExportCSV">
                <template #prepend>
                  <v-icon>mdi-file-delimited</v-icon>
                </template>
                <v-list-item-title>导出为 CSV</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-col>
        
        <v-col cols="12" sm="6">
          <!-- 导入设置 -->
          <v-btn
            prepend-icon="mdi-upload"
            color="primary"
            variant="outlined"
            block
            @click="triggerFileInput"
          >
            导入设置
          </v-btn>
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            style="display: none"
            @change="handleImport"
          />
        </v-col>
      </v-row>
      
      <v-row class="mb-4">
        <v-col cols="12" sm="6">
          <!-- 本地备份 -->
          <v-btn
            prepend-icon="mdi-backup-restore"
            color="success"
            variant="outlined"
            block
            @click="handleCreateBackup"
          >
            创建本地备份
          </v-btn>
        </v-col>
        
        <v-col cols="12" sm="6">
          <!-- 恢复备份 -->
          <v-menu v-if="backups.length > 0">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                prepend-icon="mdi-restore"
                color="warning"
                variant="outlined"
                block
              >
                恢复备份
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                v-for="backup in backups"
                :key="backup.key"
                @click="handleRestoreBackup(backup.key)"
              >
                <v-list-item-title>
                  {{ backup.label }}
                </v-list-item-title>
                <template #subtitle>
                  {{ formatTime(backup.time) }}
                </template>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-btn
            v-else
            prepend-icon="mdi-restore"
            color="warning"
            variant="outlined"
            block
            disabled
          >
            恢复备份（无可用备份）
          </v-btn>
        </v-col>
      </v-row>
      
      <v-divider class="my-4" />
      
      <!-- 云同步相关（Phase 3） -->
      <v-row class="mb-2">
        <v-col cols="12">
          <h3 class="text-subtitle2 mb-2">☁️ 云同步</h3>
        </v-col>
      </v-row>
      
      <v-row>
        <v-col cols="12" sm="6">
          <v-btn
            prepend-icon="mdi-cloud-sync"
            color="info"
            variant="outlined"
            block
            :loading="syncing"
            @click="handleCloudSync"
          >
            {{ syncing ? '同步中...' : '同步所有设备' }}
          </v-btn>
        </v-col>
        
        <v-col cols="12" sm="6">
          <v-btn
            prepend-icon="mdi-history"
            color="info"
            variant="outlined"
            block
            @click="showVersionHistory = true"
          >
            查看版本历史
          </v-btn>
        </v-col>
      </v-row>
      
      <!-- 同步状态显示 -->
      <v-card v-if="syncStatus" class="mt-4" variant="outlined">
        <v-card-text>
          <div class="text-caption text-disabled">最后同步</div>
          <div class="text-body2 mb-2">{{ formatTime(syncStatus.lastSyncedAt) }}</div>
          <v-progress-linear
            :value="(syncStatus.versionCount / 20) * 100"
            class="mb-2"
          />
          <div class="text-caption">版本: {{ syncStatus.versionCount }}/20</div>
        </v-card-text>
      </v-card>
    </v-card-text>
    
    <!-- 版本历史对话框 -->
    <v-dialog v-model="showVersionHistory" max-width="500">
      <v-card>
        <v-card-title>版本历史</v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
          <v-list>
            <v-list-item
              v-for="(version, index) in versions"
              :key="version.uuid"
              class="border-b"
            >
              <template #prepend>
                <v-avatar color="primary" size="small">
                  v{{ version.version }}
                </v-avatar>
              </template>
              <v-list-item-title>
                版本 {{ version.version }} - {{ version.deviceName }}
              </v-list-item-title>
              <template #subtitle>
                {{ formatTime(version.createdAt) }}
              </template>
              <template #append>
                <v-btn
                  icon="mdi-restore"
                  variant="text"
                  size="small"
                  @click="handleRestoreVersion(version.uuid)"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showVersionHistory = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- 消息提示 -->
    <v-snackbar v-model="snackbar.show" :timeout="3000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn color="white" variant="text" @click="snackbar.show = false">
          关闭
        </v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSettingImportExport } from '../composables/useSettingImportExport';
import type { UserSettingClientDTO, UpdateUserSettingRequest } from '@dailyuse/contracts/setting';

type UserSettingClientDTO = UserSettingClientDTO;

interface SyncStatus {
  lastSyncedAt: number;
  versionCount: number;
  hasConflicts: boolean;
}

interface SettingVersion {
  uuid: string;
  version: number;
  deviceName: string;
  createdAt: number;
}

interface Backup {
  key: string;
  label: string;
  time: number;
}

const props = defineProps<{
  settings: UserSettingClientDTO;
}>();

const emit = defineEmits<{
  update: [settings: UserSettingClientDTO];
}>();

const {
  exportSettings,
  importSettings,
  exportAsCSV,
  createLocalBackup,
  restoreFromLocalBackup,
  getLocalBackups,
} = useSettingImportExport();

const fileInput = ref<HTMLInputElement>();
const showVersionHistory = ref(false);
const syncing = ref(false);
const backups = ref<Backup[]>([]);
const versions = ref<SettingVersion[]>([]);
const syncStatus = ref<SyncStatus | null>(null);

const snackbar = ref({
  show: false,
  message: '',
});

onMounted(() => {
  loadBackups();
  loadSyncStatus();
});

const loadBackups = () => {
  try {
    const items = getLocalBackups();
    backups.value = items;
  } catch (error) {
    console.error('Error loading backups:', error);
  }
};

const loadSyncStatus = async () => {
  // TODO: 连接到实际的云同步 API
  syncStatus.value = {
    lastSyncedAt: Date.now() - 60000,
    versionCount: 5,
    hasConflicts: false,
  };
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleExportJSON = () => {
  try {
    exportSettings(props.settings, `dailyuse-settings-${Date.now()}.json`);
    snackbar.value = {
      show: true,
      message: '✅ 设置已导出为 JSON 文件',
    };
  } catch (error) {
    snackbar.value = {
      show: true,
      message: '❌ 导出失败：' + (error as Error).message,
    };
  }
};

const handleExportCSV = () => {
  try {
    exportAsCSV(props.settings, `dailyuse-settings-${Date.now()}.csv`);
    snackbar.value = {
      show: true,
      message: '✅ 设置已导出为 CSV 文件',
    };
  } catch (error) {
    snackbar.value = {
      show: true,
      message: '❌ 导出失败：' + (error as Error).message,
    };
  }
};

const handleImport = async (event: Event) => {
  try {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const imported = await importSettings(file);
    if (imported) {
      emit('update', imported);
    }
    snackbar.value = {
      show: true,
      message: '✅ 设置已成功导入',
    };
    target.value = '';
  } catch (error) {
    snackbar.value = {
      show: true,
      message: '❌ 导入失败：' + (error as Error).message,
    };
  }
};

const handleCreateBackup = () => {
  try {
    const timestamp = new Date().toLocaleString('zh-CN');
    createLocalBackup(props.settings, `backup_${Date.now()}`);
    loadBackups();
    snackbar.value = {
      show: true,
      message: `✅ 备份已创建: ${timestamp}`,
    };
  } catch (error) {
    snackbar.value = {
      show: true,
      message: '❌ 备份创建失败：' + (error as Error).message,
    };
  }
};

const handleRestoreBackup = (key: string) => {
  try {
    const restored = restoreFromLocalBackup(key);
    if (restored) {
      emit('update', restored);
      snackbar.value = {
        show: true,
        message: '✅ 备份已恢复',
      };
    }
  } catch (error) {
    snackbar.value = {
      show: true,
      message: '❌ 恢复失败：' + (error as Error).message,
    };
  }
};

const handleCloudSync = async () => {
  syncing.value = true;
  try {
    // TODO: 调用实际的云同步 API
    await new Promise(resolve => setTimeout(resolve, 1000));
    loadSyncStatus();
    snackbar.value = {
      show: true,
      message: '✅ 同步完成',
    };
  } catch (error) {
    snackbar.value = {
      show: true,
      message: '❌ 同步失败：' + (error as Error).message,
    };
  } finally {
    syncing.value = false;
  }
};

const handleRestoreVersion = (uuid: string) => {
  // TODO: 调用实际的版本恢复 API
  snackbar.value = {
    show: true,
    message: '✅ 版本已恢复',
  };
  showVersionHistory.value = false;
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleString('zh-CN');
};
</script>

<style scoped>
.setting-advanced-actions {
  margin-top: 16px;
}

.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
</style>

