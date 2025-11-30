<!--
  Status Rules Demo View (STORY-021)
  状态规则演示视图 - 用于测试规则系统
-->
<template>
  <v-container fluid class="pa-4">
    <v-row>
      <!-- 左侧：规则配置 -->
      <v-col cols="12" md="6">
        <StatusRuleEditor />
      </v-col>

      <!-- 右侧：规则测试 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center ga-2">
            <v-icon icon="mdi-flask" />
            <span>规则测试器</span>
          </v-card-title>

          <v-card-text>
            <!-- 测试数据输入 -->
            <v-text-field
              v-model="testGoal.uuid"
              label="目标 UUID"
              variant="outlined"
              density="comfortable"
              readonly
              class="mb-3"
            />

            <v-select
              v-model="testGoal.status"
              label="当前状态"
              variant="outlined"
              density="comfortable"
              :items="statusOptions"
              item-title="title"
              item-value="value"
              class="mb-3"
            />

            <v-text-field
              v-model.number="krCount"
              label="关键结果数量"
              variant="outlined"
              density="comfortable"
              type="number"
              min="0"
              max="10"
              class="mb-3"
              @update:model-value="updateKeyResults"
            />

            <!-- KR 进度输入 -->
            <div v-if="testGoal.keyResults.length > 0" class="mb-3">
              <h4 class="text-subtitle-2 mb-2">关键结果进度</h4>
              <v-row v-for="(kr, index) in testGoal.keyResults" :key="index" class="mb-2">
                <v-col cols="6">
                  <v-text-field
                    :model-value="kr.progress"
                    label="进度 (%)"
                    variant="outlined"
                    density="compact"
                    type="number"
                    min="0"
                    max="100"
                    @update:model-value="updateKRProgress(index, $event)"
                  />
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    :model-value="kr.weight"
                    label="权重 (%)"
                    variant="outlined"
                    density="compact"
                    type="number"
                    min="0"
                    max="100"
                    @update:model-value="updateKRWeight(index, $event)"
                  />
                </v-col>
              </v-row>
            </div>

            <v-text-field
              v-model.number="daysToDeadline"
              label="剩余天数"
              variant="outlined"
              density="comfortable"
              type="number"
              class="mb-4"
            />

            <!-- 评估按钮 -->
            <v-btn
              prepend-icon="mdi-play"
              color="primary"
              block
              size="large"
              @click="evaluateRules"
            >
              执行规则评估
            </v-btn>

            <v-divider class="my-4" />

            <!-- 评估结果 -->
            <div v-if="suggestion">
              <h4 class="text-h6 mb-3">评估结果</h4>

              <v-alert
                v-if="suggestion.suggestedStatus"
                :type="suggestion.suggestedStatus === testGoal.status ? 'info' : 'warning'"
                variant="tonal"
                class="mb-3"
              >
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="font-weight-bold mb-1">
                      状态建议: {{ getStatusText(suggestion.suggestedStatus) }}
                    </div>
                    <div class="text-caption">
                      当前状态: {{ getStatusText(suggestion.currentStatus) }}
                    </div>
                  </div>
                  <v-chip
                    v-if="suggestion.suggestedStatus !== testGoal.status"
                    color="warning"
                    variant="flat"
                  >
                    需要变更
                  </v-chip>
                  <v-chip v-else color="success" variant="flat"> 保持不变 </v-chip>
                </div>
              </v-alert>

              <v-alert
                v-if="suggestion.message"
                :type="suggestion.notify ? 'warning' : 'info'"
                variant="tonal"
                class="mb-3"
              >
                <div class="d-flex align-center ga-2">
                  <v-icon v-if="suggestion.notify" icon="mdi-bell" />
                  <span>{{ suggestion.message }}</span>
                </div>
              </v-alert>

              <!-- 匹配的规则详情 -->
              <v-card v-if="suggestion.executionResult?.matched" variant="outlined" class="mb-3">
                <v-card-title class="text-subtitle-1"> 匹配规则详情 </v-card-title>
                <v-card-text>
                  <div class="mb-2">
                    <strong>规则 ID:</strong> {{ suggestion.executionResult.ruleId }}
                  </div>
                  <div v-if="suggestion.executionResult.matchedConditions" class="mb-2">
                    <strong>匹配条件:</strong>
                    <ul class="mt-1">
                      <li
                        v-for="(cond, i) in suggestion.executionResult.matchedConditions"
                        :key="i"
                        class="text-caption"
                      >
                        {{ cond }}
                      </li>
                    </ul>
                  </div>
                  <div class="text-caption text-grey">
                    执行时间: {{ new Date(suggestion.executionResult.executedAt).toLocaleString() }}
                  </div>
                </v-card-text>
              </v-card>

              <v-alert v-if="!suggestion.executionResult?.matched" type="info" variant="tonal">
                无匹配规则
              </v-alert>
            </div>

            <v-alert v-else type="info" variant="tonal" class="mt-4">
              点击"执行规则评估"查看结果
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- 执行历史 -->
        <v-card v-if="executionHistory.length > 0" class="mt-4">
          <v-card-title>执行历史 ({{ executionHistory.length }})</v-card-title>
          <v-card-text>
            <v-timeline density="compact" side="end">
              <v-timeline-item
                v-for="(record, index) in executionHistory.slice(0, 5)"
                :key="index"
                dot-color="primary"
                size="small"
              >
                <template #opposite>
                  <div class="text-caption">
                    {{ new Date(record.executedAt).toLocaleTimeString() }}
                  </div>
                </template>
                <div>
                  <div class="text-subtitle-2">{{ record.ruleId }}</div>
                  <div class="text-caption">
                    {{ getStatusText(record.previousStatus) }} →
                    {{ getStatusText(record.newStatus) }}
                  </div>
                  <div v-if="record.message" class="text-caption text-grey mt-1">
                    {{ record.message }}
                  </div>
                </div>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import StatusRuleEditor from '../components/rules/StatusRuleEditor.vue';
import { useAutoStatusRules } from '../../application/composables/useAutoStatusRules';
import type { RuleSuggestion } from '../../application/composables/useAutoStatusRules';
import { GoalStatus } from '@dailyuse/contracts/goal';

const { evaluateGoal, recordHistory, executionHistory } = useAutoStatusRules();

const statusOptions = [
  { title: '草稿', value: GoalStatus.DRAFT },
  { title: '进行中', value: GoalStatus.ACTIVE },
  { title: '已完成', value: GoalStatus.COMPLETED },
  { title: '已归档', value: GoalStatus.ARCHIVED },
];

const krCount = ref(2);
const daysToDeadline = ref(30);

const testGoal = ref<any>({
  uuid: 'test-goal-' + Date.now(),
  status: GoalStatus.ACTIVE,
  keyResults: [
    { uuid: 'kr-1', progress: 50, weight: 50 },
    { uuid: 'kr-2', progress: 60, weight: 50 },
  ],
  deadline: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const suggestion = ref<RuleSuggestion | null>(null);

const updateKeyResults = () => {
  const count = Math.max(0, Math.min(10, krCount.value));
  const krs = [];

  for (let i = 0; i < count; i++) {
    krs.push({
      uuid: `kr-${i + 1}`,
      progress: 50,
      weight: Math.floor(100 / count),
    });
  }

  testGoal.value.keyResults = krs;
};

const updateKRProgress = (index: number, value: any) => {
  testGoal.value.keyResults[index].progress = Number(value);
};

const updateKRWeight = (index: number, value: any) => {
  testGoal.value.keyResults[index].weight = Number(value);
};

const evaluateRules = () => {
  // 更新截止日期
  if (daysToDeadline.value > 0) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + daysToDeadline.value);
    testGoal.value.deadline = deadline.getTime();
  } else {
    testGoal.value.deadline = null;
  }

  // 执行评估
  const result = evaluateGoal(testGoal.value);
  suggestion.value = result;

  // 如果有状态变更，记录历史
  if (result.suggestedStatus && result.suggestedStatus !== testGoal.value.status) {
    recordHistory(
      testGoal.value.uuid,
      result.executionResult?.ruleId || 'unknown',
      testGoal.value.status,
      result.suggestedStatus,
      result.message,
    );
  }
};

const getStatusText = (status: string) => {
  const option = statusOptions.find((opt) => opt.value === status);
  return option?.title || status;
};
</script>

<style scoped lang="scss">
.v-timeline {
  :deep(.v-timeline-item__body) {
    padding-bottom: 16px;
  }
}
</style>
