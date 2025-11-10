<template>
  <v-dialog v-model="isOpen" max-width="600" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-folder-plus-outline" class="mr-2" />
        <span>{{ parentUuid ? '创建子文件夹' : '创建文件夹' }}</span>
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="formData.name"
            label="文件夹名称"
            placeholder="请输入文件夹名称"
            :rules="nameRules"
            :error-messages="errorMessages"
            autofocus
            required
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />

          <v-select
            v-if="!parentUuid"
            v-model="formData.parentUuid"
            label="父文件夹（可选）"
            placeholder="选择父文件夹"
            :items="parentFolderOptions"
            item-title="name"
            item-value="uuid"
            clearable
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />

          <v-expansion-panels v-model="expandedPanel" class="mb-3">
            <v-expansion-panel value="metadata">
              <v-expansion-panel-title>
                <v-icon icon="mdi-cog-outline" class="mr-2" />
                元数据（可选）
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-text-field
                  v-model="formData.icon"
                  label="图标"
                  placeholder="mdi-folder"
                  hint="Material Design Icons 名称"
                  variant="outlined"
                  density="comfortable"
                  class="mb-3"
                >
                  <template #prepend-inner>
                    <v-icon v-if="formData.icon" :icon="formData.icon" />
                  </template>
                </v-text-field>

                <v-text-field
                  v-model="formData.color"
                  label="颜色"
                  placeholder="#2196F3"
                  hint="十六进制颜色代码"
                  variant="outlined"
                  density="comfortable"
                  type="color"
                  class="mb-3"
                />

                <v-text-field
                  v-model="formData.tags"
                  label="标签"
                  placeholder="标签1, 标签2, 标签3"
                  hint="多个标签用逗号分隔"
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
import { ref, watch, computed } from 'vue';
import { useFolderStore } from '../stores';
import { FolderApiClient } from '../../api';
import type { Folder } from '@dailyuse/domain-client';

// Props
interface Props {
  modelValue: boolean;
  repositoryUuid: string;
  parentUuid?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  parentUuid: null,
});

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'created', folder: Folder): void;
}>();

// Store
const folderStore = useFolderStore();

// Local state
const formRef = ref<any>(null);
const isSubmitting = ref(false);
const errorMessages = ref<string[]>([]);
const expandedPanel = ref<string | undefined>(undefined);

const formData = ref({
  name: '',
  parentUuid: props.parentUuid || null,
  icon: '',
  color: '',
  tags: '',
});

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const parentFolderOptions = computed(() => {
  return folderStore.getFoldersByRepositoryUuid(props.repositoryUuid);
});

const nameRules = [
  (v: string) => !!v || '文件夹名称不能为空',
  (v: string) => v.length <= 255 || '文件夹名称不能超过255个字符',
  (v: string) => /^[^/\\:*?"<>|]+$/.test(v) || '文件夹名称包含非法字符',
];

// Methods
async function handleSubmit() {
  errorMessages.value = [];

  const { valid } = await formRef.value?.validate();
  if (!valid) return;

  isSubmitting.value = true;

  try {
    // 构建元数据
    const metadata: any = {};
    if (formData.value.icon) metadata.icon = formData.value.icon;
    if (formData.value.color) metadata.color = formData.value.color;
    if (formData.value.tags) {
      metadata.tags = formData.value.tags.split(',').map((tag) => tag.trim());
    }

    const payload = {
      repositoryUuid: props.repositoryUuid,
      name: formData.value.name,
      parentUuid: formData.value.parentUuid || null,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };

    const response = await FolderApiClient.createFolder(payload);

    if (response.success && response.data) {
      const folder = Folder.fromServerDTO(response.data);
      folderStore.addFolder(folder);
      emit('created', folder);
      handleClose();
    } else {
      errorMessages.value = [response.message || '创建文件夹失败'];
    }
  } catch (err: any) {
    errorMessages.value = [err.message || '创建文件夹失败'];
    console.error('创建文件夹失败:', err);
  } finally {
    isSubmitting.value = false;
  }
}

function handleCancel() {
  handleClose();
}

function handleClose() {
  formRef.value?.reset();
  formData.value = {
    name: '',
    parentUuid: props.parentUuid || null,
    icon: '',
    color: '',
    tags: '',
  };
  errorMessages.value = [];
  expandedPanel.value = undefined;
  isOpen.value = false;
}

// Watchers
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      formData.value.parentUuid = props.parentUuid || null;
    }
  }
);

watch(
  () => props.parentUuid,
  (newValue) => {
    formData.value.parentUuid = newValue || null;
  }
);
</script>

<style scoped>
.v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
  padding-top: 16px;
}
</style>
