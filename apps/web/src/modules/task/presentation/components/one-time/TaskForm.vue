<template>
  <v-form ref="formRef" v-model="valid" @submit.prevent="handleSubmit">
    <v-card>
      <v-card-title>
        <span class="text-h5">{{ isEdit ? '编辑任务' : '创建任务' }}</span>
      </v-card-title>

      <v-card-text>
        <v-container>
          <v-row>
            <!-- 任务标题 -->
            <v-col cols="12">
              <v-text-field
                v-model="formData.title"
                label="任务标题 *"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
                counter="200"
                maxlength="200"
                prepend-inner-icon="mdi-format-title"
              />
            </v-col>

            <!-- 任务描述 -->
            <v-col cols="12">
              <v-textarea
                v-model="formData.description"
                label="任务描述"
                variant="outlined"
                density="comfortable"
                rows="4"
                counter="1000"
                maxlength="1000"
                prepend-inner-icon="mdi-text"
                placeholder="详细描述任务内容..."
              />
            </v-col>

            <!-- 优先级 -->
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.priority"
                label="优先级"
                :items="priorityOptions"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-flag"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template v-slot:prepend>
                      <v-icon :color="item.raw.color">{{ item.raw.icon }}</v-icon>
                    </template>
                  </v-list-item>
                </template>
                <template v-slot:selection="{ item }">
                  <div class="d-flex align-center">
                    <v-icon :color="item.raw.color" class="mr-2">{{ item.raw.icon }}</v-icon>
                    {{ item.title }}
                  </div>
                </template>
              </v-select>
            </v-col>

            <!-- 截止日期 -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.dueDate"
                label="截止日期"
                type="date"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-calendar"
                :min="minDate"
              />
            </v-col>

            <!-- 预估时长 -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formData.estimatedMinutes"
                label="预估时长（分钟）"
                type="number"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-clock-outline"
                min="0"
                step="15"
                hint="以 15 分钟为单位"
              />
            </v-col>

            <!-- 是否为父任务 -->
            <v-col cols="12" md="6">
              <v-switch
                v-model="formData.isParent"
                label="这是一个父任务（可以有子任务）"
                color="primary"
                hide-details
                :disabled="isEdit && task?.subtaskCount && task.subtaskCount > 0"
              />
            </v-col>

            <!-- 父任务选择 (仅在不是父任务时显示) -->
            <v-col v-if="!formData.isParent" cols="12">
              <v-autocomplete
                v-model="formData.parentTaskUuid"
                label="父任务"
                :items="parentTaskOptions"
                item-title="title"
                item-value="uuid"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-file-tree"
                clearable
                :loading="loadingParentTasks"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template v-slot:prepend>
                      <v-chip size="small" :color="getStatusColor(item.raw.status)">
                        {{ getStatusText(item.raw.status) }}
                      </v-chip>
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>

            <!-- 标签 -->
            <v-col cols="12">
              <v-combobox
                v-model="formData.tags"
                label="标签"
                multiple
                chips
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-tag-multiple"
                hint="按 Enter 添加标签"
                :delimiters="[',', ' ']"
              >
                <template v-slot:chip="{ props, item }">
                  <v-chip v-bind="props" closable>
                    {{ item }}
                  </v-chip>
                </template>
              </v-combobox>
            </v-col>

            <!-- 关联目标 -->
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="formData.goalUuid"
                label="关联目标 (OKR)"
                :items="goalOptions"
                item-title="title"
                item-value="uuid"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-target"
                clearable
                :loading="loadingGoals"
              />
            </v-col>

            <!-- 关联关键结果 -->
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="formData.keyResultUuid"
                label="关联关键结果"
                :items="keyResultOptions"
                item-title="title"
                item-value="uuid"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-key"
                clearable
                :loading="loadingKeyResults"
                :disabled="!formData.goalUuid"
              />
            </v-col>

            <!-- 任务依赖 -->
            <v-col cols="12">
              <v-autocomplete
                v-model="formData.dependencies"
                label="依赖任务"
                :items="dependencyOptions"
                item-title="title"
                item-value="uuid"
                multiple
                chips
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-link-variant"
                clearable
                :loading="loadingDependencies"
                hint="选择需要在此任务之前完成的任务"
              >
                <template v-slot:chip="{ props, item }">
                  <v-chip v-bind="props" closable>
                    {{ item.title }}
                  </v-chip>
                </template>
              </v-autocomplete>
            </v-col>

            <!-- 阻塞原因 (仅在编辑且状态为 BLOCKED 时显示) -->
            <v-col v-if="isEdit && task?.status === 'BLOCKED'" cols="12">
              <v-textarea
                v-model="formData.blockReason"
                label="阻塞原因"
                variant="outlined"
                density="comfortable"
                rows="3"
                prepend-inner-icon="mdi-alert-circle"
                hint="说明任务被阻塞的原因"
              />
            </v-col>

            <!-- 备注 -->
            <v-col cols="12">
              <v-textarea
                v-model="formData.notes"
                label="备注"
                variant="outlined"
                density="comfortable"
                rows="3"
                prepend-inner-icon="mdi-note-text"
                placeholder="添加额外的说明或注意事项..."
              />
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="$emit('cancel')"
          :disabled="submitting"
        >
          取消
        </v-btn>
        <v-btn
          color="primary"
          type="submit"
          :loading="submitting"
          :disabled="!valid"
        >
          {{ isEdit ? '保存' : '创建' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-form>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { TaskTemplateDTO } from '@dailyuse/contracts';

interface FormData {
  title: string;
  description: string;
  priority: number | null;
  dueDate: string;
  estimatedMinutes: number | null;
  isParent: boolean;
  parentTaskUuid: string | null;
  tags: string[];
  goalUuid: string | null;
  keyResultUuid: string | null;
  dependencies: string[];
  blockReason: string;
  notes: string;
}

interface Props {
  task?: TaskTemplateDTO | null;
  parentTaskOptions?: TaskTemplateDTO[];
  goalOptions?: Array<{ uuid: string; title: string }>;
  keyResultOptions?: Array<{ uuid: string; title: string }>;
  dependencyOptions?: TaskTemplateDTO[];
  loadingParentTasks?: boolean;
  loadingGoals?: boolean;
  loadingKeyResults?: boolean;
  loadingDependencies?: boolean;
  submitting?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  task: null,
  parentTaskOptions: () => [],
  goalOptions: () => [],
  keyResultOptions: () => [],
  dependencyOptions: () => [],
  loadingParentTasks: false,
  loadingGoals: false,
  loadingKeyResults: false,
  loadingDependencies: false,
  submitting: false,
});

const emit = defineEmits<{
  'submit': [data: FormData];
  'cancel': [];
}>();

const formRef = ref();
const valid = ref(false);

const formData = ref<FormData>({
  title: '',
  description: '',
  priority: 2,
  dueDate: '',
  estimatedMinutes: null,
  isParent: false,
  parentTaskUuid: null,
  tags: [],
  goalUuid: null,
  keyResultUuid: null,
  dependencies: [],
  blockReason: '',
  notes: '',
});

// 计算属性
const isEdit = computed(() => !!props.task);

const minDate = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

const priorityOptions = [
  { title: '低优先级', value: 1, color: 'grey', icon: 'mdi-chevron-down' },
  { title: '普通', value: 2, color: 'info', icon: 'mdi-minus' },
  { title: '中优先级', value: 3, color: 'warning', icon: 'mdi-chevron-up' },
  { title: '高优先级', value: 4, color: 'error', icon: 'mdi-chevron-double-up' },
  { title: '紧急', value: 5, color: 'error', icon: 'mdi-fire' },
];

// 验证规则
const rules = {
  required: (v: string) => !!v || '此项为必填项',
};

// 监听任务变化，初始化表单
watch(() => props.task, (task) => {
  if (task) {
    formData.value = {
      title: task.title,
      description: task.description || '',
      priority: task.priority || 2,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      estimatedMinutes: task.estimatedMinutes || null,
      isParent: task.isParent || false,
      parentTaskUuid: task.parentTaskUuid || null,
      tags: task.tags || [],
      goalUuid: task.goalUuid || null,
      keyResultUuid: task.keyResultUuid || null,
      dependencies: [], // TODO: 从任务依赖关系中获取
      blockReason: '', // TODO: 从任务状态中获取
      notes: '', // TODO: 从任务备注中获取
    };
  }
}, { immediate: true });

// 监听目标变化，清空关键结果
watch(() => formData.value.goalUuid, () => {
  formData.value.keyResultUuid = null;
});

// 监听 isParent 变化，清空父任务
watch(() => formData.value.isParent, (isParent) => {
  if (isParent) {
    formData.value.parentTaskUuid = null;
  }
});

// 方法
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'grey',
    IN_PROGRESS: 'primary',
    COMPLETED: 'success',
    BLOCKED: 'warning',
    CANCELED: 'error',
  };
  return colors[status] || 'grey';
}

function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    PENDING: '待执行',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    BLOCKED: '被阻塞',
    CANCELED: '已取消',
  };
  return texts[status] || status;
}

async function handleSubmit() {
  const { valid: isValid } = await formRef.value.validate();
  if (!isValid) return;
  
  emit('submit', formData.value);
}

// 重置表单
function reset() {
  formRef.value?.reset();
  formData.value = {
    title: '',
    description: '',
    priority: 2,
    dueDate: '',
    estimatedMinutes: null,
    isParent: false,
    parentTaskUuid: null,
    tags: [],
    goalUuid: null,
    keyResultUuid: null,
    dependencies: [],
    blockReason: '',
    notes: '',
  };
}

// 暴露方法
defineExpose({
  reset,
});
</script>

<style scoped lang="scss">
// 可以添加自定义样式
</style>
