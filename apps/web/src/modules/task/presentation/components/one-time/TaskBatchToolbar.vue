<template>
  <v-expand-transition>
    <v-card
      v-if="selectedCount > 0"
      class="batch-toolbar"
      elevation="4"
    >
      <v-card-text class="py-3">
        <div class="d-flex align-center justify-space-between">
          <!-- 左侧：选择信息 -->
          <div class="d-flex align-center gap-3">
            <v-checkbox
              :model-value="allSelected"
              :indeterminate="someSelected && !allSelected"
              @update:model-value="$emit('toggle-all')"
              hide-details
              density="compact"
            />

            <div>
              <div class="text-subtitle-1 font-weight-medium">
                已选择 {{ selectedCount }} 个任务
              </div>
              <div class="text-caption text-grey">
                从 {{ totalCount }} 个任务中选择
              </div>
            </div>
          </div>

          <!-- 中间：快速选择 -->
          <div class="d-flex align-center gap-2">
            <v-btn-group variant="outlined" density="compact">
              <v-btn @click="$emit('select-all')">
                <v-icon start>mdi-checkbox-multiple-marked</v-icon>
                全选
              </v-btn>
              <v-btn @click="$emit('select-none')">
                <v-icon start>mdi-checkbox-multiple-blank-outline</v-icon>
                清空
              </v-btn>
              <v-btn @click="$emit('invert-selection')">
                <v-icon start>mdi-select-inverse</v-icon>
                反选
              </v-btn>
            </v-btn-group>

            <v-divider vertical class="mx-2" />

            <v-btn-group variant="outlined" density="compact">
              <v-btn @click="$emit('select-overdue')">
                <v-icon start color="error">mdi-alert-circle</v-icon>
                逾期
              </v-btn>
              <v-btn @click="$emit('select-high-priority')">
                <v-icon start color="error">mdi-fire</v-icon>
                高优先级
              </v-btn>
              <v-btn @click="$emit('select-pending')">
                <v-icon start>mdi-circle-outline</v-icon>
                待执行
              </v-btn>
            </v-btn-group>
          </div>

          <!-- 右侧：批量操作 -->
          <div class="d-flex align-center gap-2">
            <!-- 批量更新优先级 -->
            <v-menu :close-on-content-click="false">
              <template v-slot:activator="{ props }">
                <v-btn
                  color="primary"
                  v-bind="props"
                  :disabled="operationLoading"
                >
                  <v-icon start>mdi-flag</v-icon>
                  更新优先级
                </v-btn>
              </template>
              <v-card min-width="250">
                <v-card-title class="text-body-1">选择优先级</v-card-title>
                <v-card-text>
                  <v-list density="compact">
                    <v-list-item
                      v-for="option in priorityOptions"
                      :key="option.value"
                      @click="handleBatchUpdatePriority(option.value)"
                    >
                      <template v-slot:prepend>
                        <v-icon :color="option.color">{{ option.icon }}</v-icon>
                      </template>
                      <v-list-item-title>{{ option.label }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-menu>

            <!-- 批量更新状态 -->
            <v-menu :close-on-content-click="false">
              <template v-slot:activator="{ props }">
                <v-btn
                  color="primary"
                  variant="outlined"
                  v-bind="props"
                  :disabled="operationLoading"
                >
                  <v-icon start>mdi-state-machine</v-icon>
                  更新状态
                </v-btn>
              </template>
              <v-card min-width="200">
                <v-card-title class="text-body-1">选择操作</v-card-title>
                <v-card-text>
                  <v-list density="compact">
                    <v-list-item @click="$emit('batch-start')">
                      <template v-slot:prepend>
                        <v-icon color="primary">mdi-play</v-icon>
                      </template>
                      <v-list-item-title>开始任务</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="$emit('batch-complete')">
                      <template v-slot:prepend>
                        <v-icon color="success">mdi-check</v-icon>
                      </template>
                      <v-list-item-title>完成任务</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="confirmBatchCancel = true">
                      <template v-slot:prepend>
                        <v-icon color="error">mdi-close</v-icon>
                      </template>
                      <v-list-item-title>取消任务</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-menu>

            <!-- 更多操作 -->
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  variant="outlined"
                  v-bind="props"
                  :disabled="operationLoading"
                >
                  <v-icon start>mdi-dots-horizontal</v-icon>
                  更多
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item @click="$emit('batch-add-tags')">
                  <template v-slot:prepend>
                    <v-icon>mdi-tag-plus</v-icon>
                  </template>
                  <v-list-item-title>添加标签</v-list-item-title>
                </v-list-item>
                <v-list-item @click="$emit('batch-link-goal')">
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-target</v-icon>
                  </template>
                  <v-list-item-title>关联目标</v-list-item-title>
                </v-list-item>
                <v-list-item @click="$emit('batch-export')">
                  <template v-slot:prepend>
                    <v-icon>mdi-download</v-icon>
                  </template>
                  <v-list-item-title>导出任务</v-list-item-title>
                </v-list-item>
                <v-divider />
                <v-list-item @click="confirmBatchDelete = true" class="text-error">
                  <template v-slot:prepend>
                    <v-icon color="error">mdi-delete</v-icon>
                  </template>
                  <v-list-item-title>删除任务</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>

            <v-divider vertical class="mx-2" />

            <!-- 关闭按钮 -->
            <v-btn
              icon="mdi-close"
              variant="text"
              @click="$emit('close')"
            />
          </div>
        </div>

        <!-- 操作进度 -->
        <v-expand-transition>
          <div v-if="operationLoading" class="mt-3">
            <v-progress-linear
              :model-value="operationProgress"
              color="primary"
              height="4"
            />
            <div class="text-caption text-center mt-1">
              {{ operationMessage }} ({{ operationProgress }}%)
            </div>
          </div>
        </v-expand-transition>
      </v-card-text>
    </v-card>
  </v-expand-transition>

  <!-- 批量取消确认对话框 -->
  <v-dialog v-model="confirmBatchCancel" max-width="400">
    <v-card>
      <v-card-title class="text-h6">
        <v-icon color="warning" class="mr-2">mdi-alert</v-icon>
        确认批量取消
      </v-card-title>
      <v-card-text>
        你确定要取消选中的 <strong>{{ selectedCount }}</strong> 个任务吗？
        <br />
        此操作不可撤销。
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="confirmBatchCancel = false">取消</v-btn>
        <v-btn
          color="error"
          @click="handleBatchCancel"
        >
          确认取消
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 批量删除确认对话框 -->
  <v-dialog v-model="confirmBatchDelete" max-width="400">
    <v-card>
      <v-card-title class="text-h6">
        <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
        确认批量删除
      </v-card-title>
      <v-card-text>
        你确定要删除选中的 <strong>{{ selectedCount }}</strong> 个任务吗？
        <br />
        <span class="text-error font-weight-bold">此操作不可撤销！</span>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="confirmBatchDelete = false">取消</v-btn>
        <v-btn
          color="error"
          @click="handleBatchDelete"
        >
          确认删除
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  selectedCount: number;
  totalCount: number;
  allSelected?: boolean;
  operationLoading?: boolean;
  operationProgress?: number;
  operationMessage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  allSelected: false,
  operationLoading: false,
  operationProgress: 0,
  operationMessage: '处理中...',
});

const emit = defineEmits<{
  'toggle-all': [];
  'select-all': [];
  'select-none': [];
  'invert-selection': [];
  'select-overdue': [];
  'select-high-priority': [];
  'select-pending': [];
  'batch-update-priority': [priority: number];
  'batch-start': [];
  'batch-complete': [];
  'batch-cancel': [];
  'batch-delete': [];
  'batch-add-tags': [];
  'batch-link-goal': [];
  'batch-export': [];
  'close': [];
}>();

// 本地状态
const confirmBatchCancel = ref(false);
const confirmBatchDelete = ref(false);

// 计算属性
const someSelected = computed(() => {
  return props.selectedCount > 0 && props.selectedCount < props.totalCount;
});

// 优先级选项
const priorityOptions = [
  { value: 5, label: '紧急', color: 'error', icon: 'mdi-fire' },
  { value: 4, label: '高优先级', color: 'error', icon: 'mdi-chevron-double-up' },
  { value: 3, label: '中优先级', color: 'warning', icon: 'mdi-chevron-up' },
  { value: 2, label: '普通', color: 'info', icon: 'mdi-minus' },
  { value: 1, label: '低优先级', color: 'grey', icon: 'mdi-chevron-down' },
];

// 方法
function handleBatchUpdatePriority(priority: number) {
  emit('batch-update-priority', priority);
}

function handleBatchCancel() {
  confirmBatchCancel.value = false;
  emit('batch-cancel');
}

function handleBatchDelete() {
  confirmBatchDelete.value = false;
  emit('batch-delete');
}
</script>

<style scoped lang="scss">
.batch-toolbar {
  position: sticky;
  top: 64px;
  z-index: 100;
  border-radius: 8px;
  margin-bottom: 16px;
}
</style>
