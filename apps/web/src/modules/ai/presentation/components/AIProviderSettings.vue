<template>
    <v-container fluid>
        <v-row>
            <v-col cols="12">
                <h3 class="text-h5 mb-4">
                    <v-icon class="mr-2">mdi-robot</v-icon>
                    AI 服务提供商
                </h3>
            </v-col>
        </v-row>

        <!-- 说明信息 -->
        <v-row>
            <v-col cols="12">
                <v-alert type="info" variant="tonal" prominent border="start" class="mb-4">
                    <v-alert-title>配置您的 AI 服务</v-alert-title>
                    <div class="text-body-2">
                        配置自定义 AI 服务提供商（如七牛云、Azure OpenAI 等）以使用 AI 功能。
                        您可以添加多个提供商并设置一个默认提供商。
                    </div>
                </v-alert>
            </v-col>
        </v-row>

        <!-- 加载状态 -->
        <v-row v-if="loading && !providers.length">
            <v-col cols="12" class="text-center py-8">
                <v-progress-circular indeterminate color="primary" size="48" />
                <p class="mt-4 text-body-1">加载配置中...</p>
            </v-col>
        </v-row>

        <!-- 错误状态 -->
        <v-row v-else-if="error && !providers.length">
            <v-col cols="12">
                <v-alert type="error" variant="tonal" closable @click:close="error = null">
                    {{ error }}
                </v-alert>
            </v-col>
        </v-row>

        <!-- Provider 列表 -->
        <v-row v-else>
            <v-col cols="12">
                <!-- 空状态 -->
                <v-card v-if="!providers.length" variant="outlined" class="text-center pa-8">
                    <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-robot-off</v-icon>
                    <p class="text-h6 mb-2">尚未配置 AI 服务</p>
                    <p class="text-body-2 text-medium-emphasis mb-4">
                        添加您的第一个 AI 服务提供商以开始使用 AI 功能
                    </p>
                    <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
                        添加提供商
                    </v-btn>
                </v-card>

                <!-- Provider 卡片列表 -->
                <template v-else>
                    <v-row>
                        <v-col v-for="provider in providers" :key="provider.uuid" cols="12" md="6">
                            <v-card :color="provider.isDefault ? 'primary' : undefined"
                                :variant="provider.isDefault ? 'tonal' : 'outlined'" hover>
                                <v-card-text>
                                    <div class="d-flex align-center mb-3">
                                        <v-avatar :color="getProviderColor(provider.providerType)" size="40"
                                            class="mr-3">
                                            <v-icon color="white">{{ getProviderIcon(provider.providerType) }}</v-icon>
                                        </v-avatar>
                                        <div class="flex-grow-1">
                                            <div class="d-flex align-center">
                                                <span class="text-h6">{{ provider.name }}</span>
                                                <v-chip v-if="provider.isDefault" color="primary" size="x-small"
                                                    class="ml-2">
                                                    默认
                                                </v-chip>
                                            </div>
                                            <span class="text-caption text-medium-emphasis">
                                                {{ getProviderTypeName(provider.providerType) }}
                                            </span>
                                        </div>
                                        <v-chip :color="provider.isActive ? 'success' : 'grey'" size="small"
                                            variant="tonal">
                                            {{ provider.isActive ? '启用' : '禁用' }}
                                        </v-chip>
                                    </div>

                                    <!-- Provider 详情 -->
                                    <div class="text-body-2 mb-3">
                                        <div class="d-flex align-center mb-1">
                                            <v-icon size="16" class="mr-2">mdi-link</v-icon>
                                            <span class="text-truncate" style="max-width: 200px;">
                                                {{ provider.baseUrl || '默认地址' }}
                                            </span>
                                        </div>
                                        <div class="d-flex align-center">
                                            <v-icon size="16" class="mr-2">mdi-brain</v-icon>
                                            <span>{{ provider.defaultModel || '默认模型' }}</span>
                                        </div>
                                    </div>

                                    <!-- 操作按钮 -->
                                    <div class="d-flex ga-2">
                                        <v-btn size="small" variant="tonal"
                                            :loading="testingProviderUuid === provider.uuid"
                                            @click="handleTestConnection(provider.uuid)">
                                            <v-icon start>mdi-connection</v-icon>
                                            测试
                                        </v-btn>
                                        <v-btn v-if="!provider.isDefault" size="small" variant="tonal"
                                            @click="handleSetDefault(provider.uuid)">
                                            设为默认
                                        </v-btn>
                                        <v-spacer />
                                        <v-btn size="small" icon variant="text" @click="openEditDialog(provider)">
                                            <v-icon>mdi-pencil</v-icon>
                                        </v-btn>
                                        <v-btn size="small" icon variant="text" color="error"
                                            @click="confirmDelete(provider)">
                                            <v-icon>mdi-delete</v-icon>
                                        </v-btn>
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>

                    <!-- 添加按钮 -->
                    <v-row class="mt-4">
                        <v-col cols="12">
                            <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
                                添加提供商
                            </v-btn>
                        </v-col>
                    </v-row>
                </template>
            </v-col>
        </v-row>

        <!-- 创建/编辑对话框 -->
        <v-dialog v-model="dialogVisible" max-width="600" persistent>
            <v-card>
                <v-card-title>
                    {{ editingProvider ? '编辑提供商' : '添加提供商' }}
                </v-card-title>

                <v-card-text>
                    <v-form ref="formRef" v-model="formValid">
                        <!-- 名称 -->
                        <v-text-field v-model="formData.name" label="名称" placeholder="例如：我的七牛云"
                            :rules="[rules.required, rules.maxLength(50)]" prepend-icon="mdi-tag" class="mb-3" />

                        <!-- 提供商类型 -->
                        <v-select v-model="formData.providerType" label="提供商类型" :items="providerTypeOptions"
                            item-title="label" item-value="value" :rules="[rules.required]" prepend-icon="mdi-cloud"
                            class="mb-3" />

                        <!-- API 地址 -->
                        <v-text-field v-model="formData.baseUrl" label="API 地址" placeholder="https://api.example.com/v1"
                            :rules="[rules.required, rules.url]" prepend-icon="mdi-link" class="mb-3" />

                        <!-- API Key -->
                        <v-text-field v-model="formData.apiKey"
                            :label="editingProvider ? 'API Key (留空保持不变)' : 'API Key'"
                            :placeholder="editingProvider ? '••••••••' : '输入您的 API Key'"
                            :rules="editingProvider ? [] : [rules.required]" :type="showApiKey ? 'text' : 'password'"
                            prepend-icon="mdi-key" :append-inner-icon="showApiKey ? 'mdi-eye-off' : 'mdi-eye'"
                            @click:append-inner="showApiKey = !showApiKey" class="mb-3" />

                        <!-- 默认模型 -->
                        <v-text-field v-model="formData.defaultModel" label="默认模型" placeholder="例如：deepseek-v3"
                            prepend-icon="mdi-brain" class="mb-3" />

                        <!-- 设为默认 -->
                        <v-checkbox v-model="formData.isDefault" label="设为默认提供商" color="primary" />

                        <!-- 启用状态 -->
                        <v-checkbox v-model="formData.isActive" label="启用此提供商" color="primary" />
                    </v-form>
                </v-card-text>

                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="closeDialog">取消</v-btn>
                    <v-btn color="primary" :loading="loading" :disabled="!formValid" @click="handleSave">
                        {{ editingProvider ? '保存' : '创建' }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 删除确认对话框 -->
        <v-dialog v-model="deleteDialogVisible" max-width="400">
            <v-card>
                <v-card-title class="text-h6">确认删除</v-card-title>
                <v-card-text>
                    确定要删除提供商 "{{ deletingProvider?.name }}" 吗？此操作不可撤销。
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="deleteDialogVisible = false">取消</v-btn>
                    <v-btn color="error" :loading="loading" @click="handleDelete">删除</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 测试结果 Snackbar -->
        <v-snackbar v-model="snackbar.visible" :color="snackbar.color" :timeout="3000">
            {{ snackbar.message }}
            <template #actions>
                <v-btn variant="text" @click="snackbar.visible = false">关闭</v-btn>
            </template>
        </v-snackbar>
    </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useAIProviders } from '../composables/useAIProviders';
import { AIProviderType } from '@dailyuse/contracts/ai';
import type { AIProviderConfigClientDTO, AIUsageQuotaClientDTO, GeneratedGoalDraft } from '@dailyuse/contracts/ai';

// ===== Composables =====
const {
    providers,
    loading,
    error,
    testingProviderUuid,
    loadProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    testConnection,
    setDefaultProvider,
} = useAIProviders();

// ===== 对话框状态 =====
const dialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const editingProvider = ref<AIProviderConfigClientDTO | null>(null);
const deletingProvider = ref<AIProviderConfigClientDTO | null>(null);
const formRef = ref();
const formValid = ref(false);
const showApiKey = ref(false);

// ===== 表单数据 =====
const formData = reactive({
    name: '',
    providerType: AIProviderType.QINIU as string,
    baseUrl: '',
    apiKey: '',
    defaultModel: '',
    isDefault: false,
    isActive: true,
});

// ===== Snackbar =====
const snackbar = reactive({
    visible: false,
    message: '',
    color: 'success' as 'success' | 'error' | 'info',
});

// ===== 提供商类型选项 =====
const providerTypeOptions = [
    { label: '七牛云 AI', value: AIProviderType.QINIU },
    { label: 'OpenAI', value: AIProviderType.OPENAI },
    { label: 'Anthropic Claude', value: AIProviderType.ANTHROPIC },
    { label: '自定义 OpenAI 兼容', value: AIProviderType.CUSTOM_OPENAI_COMPATIBLE },
];

// ===== 验证规则 =====
const rules = {
    required: (v: string) => !!v || '此字段必填',
    maxLength: (max: number) => (v: string) => !v || v.length <= max || `最多 ${max} 个字符`,
    url: (v: string) => {
        if (!v) return true;
        try {
            new URL(v);
            return true;
        } catch {
            return '请输入有效的 URL';
        }
    },
};

// ===== 工具方法 =====
function getProviderIcon(type: string): string {
    switch (type) {
        case AIProviderType.OPENAI:
            return 'mdi-head-snowflake';
        case AIProviderType.QINIU:
            return 'mdi-cloud';
        case AIProviderType.ANTHROPIC:
            return 'mdi-brain';
        default:
            return 'mdi-robot';
    }
}

function getProviderColor(type: string): string {
    switch (type) {
        case AIProviderType.OPENAI:
            return 'green';
        case AIProviderType.QINIU:
            return 'blue';
        case AIProviderType.ANTHROPIC:
            return 'orange';
        default:
            return 'purple';
    }
}

function getProviderTypeName(type: string): string {
    const option = providerTypeOptions.find(o => o.value === type);
    return option?.label || type;
}

function showMessage(message: string, color: 'success' | 'error' | 'info' = 'success') {
    snackbar.message = message;
    snackbar.color = color;
    snackbar.visible = true;
}

// ===== 对话框操作 =====
function openCreateDialog() {
    editingProvider.value = null;
    formData.name = '';
    formData.providerType = AIProviderType.QINIU;
    formData.baseUrl = 'https://openai.qiniu.com/v1';
    formData.apiKey = '';
    formData.defaultModel = 'deepseek-v3';
    formData.isDefault = providers.value.length === 0;
    formData.isActive = true;
    showApiKey.value = false;
    dialogVisible.value = true;
}

function openEditDialog(provider: AIProviderConfigClientDTO) {
    editingProvider.value = provider;
    formData.name = provider.name;
    formData.providerType = provider.providerType;
    formData.baseUrl = provider.baseUrl || '';
    formData.apiKey = '';
    formData.defaultModel = provider.defaultModel || '';
    formData.isDefault = provider.isDefault;
    formData.isActive = provider.isActive;
    showApiKey.value = false;
    dialogVisible.value = true;
}

function closeDialog() {
    dialogVisible.value = false;
    editingProvider.value = null;
}

function confirmDelete(provider: AIProviderConfigClientDTO) {
    deletingProvider.value = provider;
    deleteDialogVisible.value = true;
}

// ===== 操作处理 =====
async function handleSave() {
    if (!formRef.value?.validate()) return;

    if (editingProvider.value) {
        // 更新
        const success = await updateProvider(editingProvider.value.uuid, {
            name: formData.name,
            baseUrl: formData.baseUrl,
            apiKey: formData.apiKey || undefined,
            defaultModel: formData.defaultModel || undefined,
            isActive: formData.isActive,
        });
        if (success) {
            // 如果需要设为默认，调用专门的 API
            if (formData.isDefault && !editingProvider.value.isDefault) {
                await setDefaultProvider(editingProvider.value.uuid);
            }
            showMessage('提供商更新成功');
            closeDialog();
        }
    } else {
        // 创建
        const result = await createProvider({
            name: formData.name,
            providerType: formData.providerType as any,
            baseUrl: formData.baseUrl,
            apiKey: formData.apiKey,
            defaultModel: formData.defaultModel || undefined,
            setAsDefault: formData.isDefault,
        });
        if (result) {
            showMessage('提供商创建成功');
            closeDialog();
        }
    }
}

async function handleDelete() {
    if (!deletingProvider.value) return;

    const success = await deleteProvider(deletingProvider.value.uuid);
    if (success) {
        showMessage('提供商已删除');
        deleteDialogVisible.value = false;
        deletingProvider.value = null;
    }
}

async function handleTestConnection(uuid: string) {
    const result = await testConnection(uuid);
    if (result.success) {
        showMessage(`连接成功！延迟: ${result.latencyMs}ms`, 'success');
    } else {
        showMessage(`连接失败: ${result.error}`, 'error');
    }
}

async function handleSetDefault(uuid: string) {
    const success = await setDefaultProvider(uuid);
    if (success) {
        showMessage('已设为默认提供商');
    }
}

// ===== 生命周期 =====
onMounted(() => {
    loadProviders();
});
</script>

<style scoped>
/* Vuetify 组件自带样式，无需额外 CSS */
</style>




