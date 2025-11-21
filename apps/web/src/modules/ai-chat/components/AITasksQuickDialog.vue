<template>
    <v-dialog v-model="show" max-width="640" persistent>
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
                <span>AI 分解任务</span>
                <v-spacer />
                <v-btn icon="mdi-close" variant="text" size="small" @click="close" :disabled="isGenerating" />
            </v-card-title>
            <v-divider />
            <v-card-text>
                <v-alert v-if="quota" :type="hasQuota ? 'info' : 'warning'" variant="tonal" density="compact" class="mb-4">
                    今日剩余：{{ quota.remainingQuota }}/{{ quota.quotaLimit }}
                </v-alert>
                <v-form ref="formRef" v-model="formValid">
                    <v-text-field v-model="form.keyResultTitle" label="关键结果标题 *" :rules="[rules.required]"
                        prepend-inner-icon="mdi-target" :disabled="isGenerating" />
                    <v-textarea v-model="form.keyResultDescription" label="描述 (可选)" rows="2"
                        prepend-inner-icon="mdi-text" :disabled="isGenerating" />
                    <v-row>
                        <v-col cols="6">
                            <v-text-field v-model.number="form.targetValue" label="目标值 *" type="number"
                                :rules="[rules.required]" prepend-inner-icon="mdi-flag-checkered"
                                :disabled="isGenerating" />
                        </v-col>
                        <v-col cols="6">
                            <v-text-field v-model.number="form.currentValue" label="当前值 *" type="number"
                                :rules="[rules.required]" prepend-inner-icon="mdi-progress-check"
                                :disabled="isGenerating" />
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="6">
                            <v-text-field v-model="form.unit" label="单位 (可选)" prepend-inner-icon="mdi-ruler"
                                :disabled="isGenerating" />
                        </v-col>
                        <v-col cols="6">
                            <v-text-field v-model.number="form.timeRemaining" label="剩余天数 *" type="number"
                                :rules="[rules.required]" prepend-inner-icon="mdi-timer" :disabled="isGenerating" />
                        </v-col>
                    </v-row>
                </v-form>
                <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-2" closable
                    @click:close="clearError()">{{ error }}</v-alert>
            </v-card-text>
            <v-divider />
            <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="close" :disabled="isGenerating">取消</v-btn>
                <v-btn color="primary" :loading="isGenerating" :disabled="!formValid || !hasQuota"
                    @click="handleGenerate" prepend-icon="mdi-creation">生成任务</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useAIGeneration } from '@/modules/ai/presentation/composables/useAIGeneration';
import { useSnackbar } from '@/shared/composables/useSnackbar';

const show = ref(false);
const formRef = ref();
const formValid = ref(false);

const form = ref({
    keyResultTitle: '',
    keyResultDescription: '',
    targetValue: 0,
    currentValue: 0,
    unit: '',
    timeRemaining: 30,
});

const rules = { required: (v: any) => (v !== undefined && v !== null && v !== '' ? true : '必填') };

const { generateTasks, isGenerating, error, hasQuota, quota, clearError } = useAIGeneration();
const { showError, showSuccess } = useSnackbar();

function openDialog(initial?: Partial<typeof form.value>) {
    if (initial) Object.assign(form.value, initial);
    show.value = true;
}
function close() {
    if (!isGenerating.value) show.value = false;
}
async function handleGenerate() {
    try {
        const result = await generateTasks({
            keyResultTitle: form.value.keyResultTitle,
            keyResultDescription: form.value.keyResultDescription || undefined,
            targetValue: form.value.targetValue,
            currentValue: form.value.currentValue,
            unit: form.value.unit || undefined,
            timeRemaining: form.value.timeRemaining,
        });
        showSuccess(`生成 ${result.tasks.length} 个任务模板`);
        close();
        // 注入到聊天
        const list = result.tasks.map((t: any, i: number) => `${i + 1}. ${t.title || t.name}`).join('\n');
        window.dispatchEvent(new CustomEvent('ai-chat:inject', { detail: { content: `已生成任务列表:\n\n${list}\n\n请帮我基于这些任务制定执行优先级与时间安排。` } }));
    } catch (e: any) {
        showError(e?.message || '生成任务失败');
    }
}

const emit = defineEmits<{ (e: 'generated', result: any): void; (e: 'error', msg: string): void }>();

defineExpose({ openDialog, close });
</script>
<style scoped>
:deep(.v-card) {
    border-radius: 20px !important;
    box-shadow:
        0 12px 40px rgba(0, 0, 0, 0.15),
        0 4px 12px rgba(74, 108, 247, 0.1) !important;
}

:deep(.v-card-title) {
    background: linear-gradient(135deg, #4a6cf7 0%, #5e7bfa 100%);
    color: white !important;
    padding: 16px 20px !important;
    font-weight: 600;
    letter-spacing: 0.3px;
}

:deep(.v-card-title .v-icon) {
    color: white !important;
}

:deep(.v-card-text) {
    padding: 24px !important;
}

:deep(.v-text-field),
:deep(.v-textarea),
:deep(.v-select) {
    margin-bottom: 8px;
}

:deep(.v-field) {
    border-radius: 12px;
}

:deep(.v-btn.v-btn--variant-elevated) {
    background: linear-gradient(135deg, #4a6cf7 0%, #5e7bfa 100%);
    box-shadow:
        0 2px 8px rgba(74, 108, 247, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    text-transform: none;
    letter-spacing: 0.3px;
}

:deep(.v-btn.v-btn--variant-elevated:hover) {
    box-shadow:
        0 4px 12px rgba(74, 108, 247, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
</style>
