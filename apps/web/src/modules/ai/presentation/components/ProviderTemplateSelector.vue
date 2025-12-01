<template>
    <div class="provider-template-selector">
        <!-- 模板卡片网格 -->
        <v-row>
            <v-col 
                v-for="template in templates" 
                :key="template.id" 
                cols="6" 
                sm="4" 
                md="3"
            >
                <v-card
                    :class="[
                        'template-card',
                        { 'template-card--selected': selectedTemplateId === template.id }
                    ]"
                    :style="{ 
                        '--template-color': template.color,
                        borderColor: selectedTemplateId === template.id ? template.color : undefined
                    }"
                    variant="outlined"
                    hover
                    @click="selectTemplate(template)"
                >
                    <v-card-text class="text-center pa-3">
                        <!-- 图标 -->
                        <v-avatar 
                            :color="template.color" 
                            size="48" 
                            class="mb-2"
                        >
                            <v-icon color="white" size="24">{{ template.icon }}</v-icon>
                        </v-avatar>

                        <!-- 名称 -->
                        <div class="text-subtitle-1 font-weight-medium mb-1">
                            {{ template.name }}
                        </div>

                        <!-- 免费标签 -->
                        <v-chip
                            v-if="template.hasFreeQuota"
                            color="success"
                            size="x-small"
                            variant="tonal"
                            class="mb-1"
                        >
                            <v-icon start size="12">mdi-gift</v-icon>
                            有免费额度
                        </v-chip>

                        <!-- 描述 -->
                        <div class="text-caption text-medium-emphasis text-truncate">
                            {{ template.description }}
                        </div>
                    </v-card-text>

                    <!-- 选中指示器 -->
                    <v-icon
                        v-if="selectedTemplateId === template.id"
                        class="selected-indicator"
                        color="primary"
                        size="20"
                    >
                        mdi-check-circle
                    </v-icon>
                </v-card>
            </v-col>
        </v-row>

        <!-- 选中模板的详情提示 -->
        <v-expand-transition>
            <v-alert
                v-if="selectedTemplate && selectedTemplate.id !== 'custom'"
                type="info"
                variant="tonal"
                density="compact"
                class="mt-4"
            >
                <div class="d-flex align-center justify-space-between">
                    <div>
                        <span class="font-weight-medium">{{ selectedTemplate.name }}</span>
                        <span v-if="selectedTemplate.freeQuotaNote" class="text-caption ml-2">
                            ({{ selectedTemplate.freeQuotaNote }})
                        </span>
                    </div>
                    <v-btn
                        v-if="selectedTemplate.apiKeyUrl"
                        size="small"
                        variant="tonal"
                        :href="selectedTemplate.apiKeyUrl"
                        target="_blank"
                        rel="noopener"
                    >
                        <v-icon start size="16">mdi-key</v-icon>
                        获取 API Key
                        <v-icon end size="14">mdi-open-in-new</v-icon>
                    </v-btn>
                </div>
            </v-alert>
        </v-expand-transition>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { AI_PROVIDER_TEMPLATES, type AIProviderTemplate } from '@dailyuse/contracts/ai';

// ===== Props & Emits =====
const props = defineProps<{
    modelValue?: string;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
    (e: 'select', template: AIProviderTemplate): void;
}>();

// ===== Computed =====
const templates = computed(() => AI_PROVIDER_TEMPLATES);

const selectedTemplateId = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value || ''),
});

const selectedTemplate = computed(() => {
    return templates.value.find(t => t.id === selectedTemplateId.value);
});

// ===== Methods =====
function selectTemplate(template: AIProviderTemplate) {
    selectedTemplateId.value = template.id;
    emit('select', template);
}
</script>

<style scoped>
.template-card {
    position: relative;
    cursor: pointer;
    transition: all 0.2s ease;
    border-width: 2px;
}

.template-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.template-card--selected {
    border-width: 2px;
    background-color: rgba(var(--v-theme-primary), 0.05);
}

.selected-indicator {
    position: absolute;
    top: 8px;
    right: 8px;
}
</style>
