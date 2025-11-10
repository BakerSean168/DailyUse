<template>
  <v-dialog v-model="isOpen" max-width="700" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-database-plus-outline" class="mr-2" />
        <span>创建仓储</span>
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="formData.name"
            label="仓储名称"
            placeholder="请输入仓储名称"
            :rules="nameRules"
            :error-messages="errorMessages"
            autofocus
            required
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />

          <v-select
            v-model="formData.type"
            label="仓储类型"
            placeholder="选择仓储类型"
            :items="repositoryTypes"
            item-title="label"
            item-value="value"
            :rules="typeRules"
            required
            variant="outlined"
            density="comfortable"
            class="mb-3"
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps">
                <template #prepend>
                  <v-icon :icon="item.raw.icon" />
                </template>
                <v-list-item-title>{{ item.raw.label }}</v-list-item-title>
                <v-list-item-subtitle>{{ item.raw.description }}</v-list-item-subtitle>
              </v-list-item>
            </template>

            <template #selection="{ item }">
              <v-icon :icon="item.raw.icon" class="mr-2" />
              {{ item.raw.label }}
            </template>
          </v-select>

          <v-text-field
            v-model="formData.path"
            label="存储路径"
            placeholder="/path/to/repository"
            :rules="pathRules"
            hint="仓储文件存储的物理路径"
            persistent-hint
            required
            variant="outlined"
            density="comfortable"
            class="mb-3"
          >
            <template #append>
              <v-btn
                icon="mdi-folder-open-outline"
                size="small"
                variant="text"
                @click="handleBrowsePath"
              />
            </template>
          </v-text-field>

          <v-textarea
            v-model="formData.description"
            label="描述（可选）"
            placeholder="请输入仓储描述"
            rows="3"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />

          <v-expansion-panels v-model="expandedPanel" class="mb-3">
            <v-expansion-panel value="config">
              <v-expansion-panel-title>
                <v-icon icon="mdi-cog-outline" class="mr-2" />
                配置（可选）
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-switch
                  v-model="formData.autoSync"
                  label="自动同步"
                  hint="自动检测文件变更并同步"
                  persistent-hint
                  color="primary"
                  class="mb-3"
                />

                <v-text-field
                  v-model.number="formData.maxFileSize"
                  label="最大文件大小（MB）"
                  placeholder="100"
                  type="number"
                  min="1"
                  max="1000"
                  variant="outlined"
                  density="comfortable"
                  class="mb-3"
                />

                <v-combobox
                  v-model="formData.excludePatterns"
                  label="排除模式"
                  placeholder=".git, node_modules, *.log"
                  hint="排除的文件/文件夹模式，按回车添加"
                  persistent-hint
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="comfortable"
                />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel">取消</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="isSubmitting"
          @click="handleSubmit"
        >
          创建
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRepositoryStore } from '../stores';
import { RepositoryApiClient } from '../../api';
import { Repository } from '@dailyuse/domain-client';

// Props
interface Props {
  modelValue: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
});

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'created', repository: Repository): void;
}>();

// Store
const repositoryStore = useRepositoryStore();

// Local state
const formRef = ref<any>(null);
const isSubmitting = ref(false);
const errorMessages = ref<string[]>([]);
const expandedPanel = ref<string | undefined>(undefined);

const formData = ref({
  name: '',
  type: 'LOCAL' as const,
  path: '',
  description: '',
  autoSync: true,
  maxFileSize: 100,
  excludePatterns: ['.git', 'node_modules', '*.tmp'],
});

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const repositoryTypes = [
  {
    value: 'LOCAL',
    label: '本地仓储',
    description: '存储在本地文件系统',
    icon: 'mdi-folder-outline',
  },
  {
    value: 'GIT',
    label: 'Git 仓储',
    description: '支持 Git 版本控制',
    icon: 'mdi-git',
  },
  {
    value: 'CLOUD',
    label: '云端仓储',
    description: '存储在云端服务',
    icon: 'mdi-cloud-outline',
  },
];

const nameRules = [
  (v: string) => !!v || '仓储名称不能为空',
  (v: string) => v.length <= 100 || '仓储名称不能超过100个字符',
];

const typeRules = [(v: string) => !!v || '请选择仓储类型'];

const pathRules = [
  (v: string) => !!v || '存储路径不能为空',
  (v: string) => v.length <= 500 || '存储路径不能超过500个字符',
];

// Methods
async function handleSubmit() {
  errorMessages.value = [];

  const { valid } = await formRef.value?.validate();
  if (!valid) return;

  isSubmitting.value = true;

  try {
    const payload = {
      name: formData.value.name,
      type: formData.value.type,
      path: formData.value.path,
      description: formData.value.description || undefined,
      config: {
        autoSync: formData.value.autoSync,
        maxFileSize: formData.value.maxFileSize,
        excludePatterns: formData.value.excludePatterns,
      },
    };

    const response = await RepositoryApiClient.createRepository(payload);

    if (response.success && response.data) {
      const repository = Repository.fromServerDTO(response.data);
      repositoryStore.addRepository(repository);
      emit('created', repository);
      handleClose();
    } else {
      errorMessages.value = [response.message || '创建仓储失败'];
    }
  } catch (err: any) {
    errorMessages.value = [err.message || '创建仓储失败'];
    console.error('创建仓储失败:', err);
  } finally {
    isSubmitting.value = false;
  }
}

function handleCancel() {
  handleClose();
}

function handleBrowsePath() {
  // TODO: 实现文件夹选择器（可能需要 Electron API）
  console.log('浏览路径');
}

function handleClose() {
  formRef.value?.reset();
  formData.value = {
    name: '',
    type: 'LOCAL',
    path: '',
    description: '',
    autoSync: true,
    maxFileSize: 100,
    excludePatterns: ['.git', 'node_modules', '*.tmp'],
  };
  errorMessages.value = [];
  expandedPanel.value = undefined;
  isOpen.value = false;
}
</script>

<style scoped>
.v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
  padding-top: 16px;
}
</style>
