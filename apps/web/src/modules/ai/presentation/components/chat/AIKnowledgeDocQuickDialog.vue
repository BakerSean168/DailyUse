<template>
    <v-dialog v-model="show" max-width="640" persistent>
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-book-open-page-variant</v-icon><span>AI 知识文档生成</span><v-spacer />
                <v-btn icon="mdi-close" variant="text" size="small" @click="close" :disabled="isGenerating" />
            </v-card-title>
            <v-divider />
            <v-card-text>
                <v-alert v-if="quota" :type="hasQuota ? 'info' : 'warning'" variant="tonal" density="compact"
                    class="mb-4">剩余额度：{{ quota.remainingQuota }}/{{ quota.quotaLimit }}</v-alert>
                <v-form ref="formRef" v-model="formValid">
                    <v-text-field v-model="form.topic" label="主题 *" :rules="[rules.required]"
                        prepend-inner-icon="mdi-lightbulb-on" :disabled="isGenerating" />
                    <v-textarea v-model="form.context" label="上下文 (可选)" rows="3" prepend-inner-icon="mdi-text"
                        :disabled="isGenerating" />
                    <v-select v-model="form.templateType" :items="templateTypes" label="文档模板 *"
                        :rules="[rules.required]" prepend-inner-icon="mdi-file-document" :disabled="isGenerating" />
                </v-form>
                <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-2" closable
                    @click:close="clearError()">{{ error }}</v-alert>
            </v-card-text>
            <v-divider />
            <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="close" :disabled="isGenerating">取消</v-btn>
                <v-btn color="primary" :loading="isGenerating" :disabled="!formValid || !hasQuota"
                    @click="handleGenerate" prepend-icon="mdi-sparkles">生成文档</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useAIGeneration } from '@/modules/ai/presentation/composables/useAIGeneration';
import { useSnackbar } from '@/shared/composables/useSnackbar';
const show = ref(false); const formRef = ref(); const formValid = ref(false);
const form = ref({ topic: '', context: '', templateType: 'SUMMARY' });
const templateTypes = ['SUMMARY', 'GUIDE', 'CHECKLIST', 'FAQ'];
const rules = { required: (v: any) => (v ? true : '必填') };
const { generateKnowledgeDocument, isGenerating, error, hasQuota, quota, clearError } = useAIGeneration();
const { showError, showSuccess } = useSnackbar();
function openDialog(initial?: Partial<typeof form.value>) { if (initial) Object.assign(form.value, initial); show.value = true; }
function close() { if (!isGenerating.value) show.value = false; }
async function handleGenerate() { try { const result = await generateKnowledgeDocument({ topic: form.value.topic, context: form.value.context || undefined, templateType: form.value.templateType }); showSuccess('文档生成完成'); close(); const content = result.document?.content || '[内容未返回]'; window.dispatchEvent(new CustomEvent('ai-chat:inject', { detail: { content: `以下是关于 “${form.value.topic}” 的文档草稿:\n\n${content}\n\n请帮助我审阅并提出改进建议。` } })); } catch (e: any) { showError(e?.message || '生成文档失败'); } }
const emit = defineEmits<{ (e: 'generated', result: any): void; (e: 'error', msg: string): void }>();
defineExpose({ openDialog, close });
</script>
<style scoped>
:deep(.v-card) {
    border-radius: 20px !important;
    box-shadow: 0 12px 40px rgba(0, 0, 0, .15), 0 4px 12px rgba(74, 108, 247, .1) !important;
}

:deep(.v-card-title) {
    background: linear-gradient(135deg, #4a6cf7 0%, #5e7bfa 100%);
    color: white !important;
    padding: 16px 20px !important;
    font-weight: 600;
    letter-spacing: .3px;
}

:deep(.v-card-text) {
    padding: 24px !important;
}

:deep(.v-field) {
    border-radius: 12px;
}

:deep(.v-btn.v-btn--variant-elevated) {
    background: linear-gradient(135deg, #4a6cf7 0%, #5e7bfa 100%);
    box-shadow: 0 2px 8px rgba(74, 108, 247, .3), inset 0 1px 0 rgba(255, 255, 255, .2);
    border-radius: 10px;
    text-transform: none;
    letter-spacing: .3px;
}

:deep(.v-btn.v-btn--variant-elevated:hover) {
    box-shadow: 0 4px 12px rgba(74, 108, 247, .4), inset 0 1px 0 rgba(255, 255, 255, .3);
}
</style>
