<template>
  <a href="#wizard-main" class="skip-link">跳过到主要内容</a>
  <v-container fluid class="knowledge-wizard-container">
    <v-row justify="center">
      <v-col cols="12" :lg="wizardMaxWidth">
        <div class="wizard-header mb-6">
          <h1 class="text-h4 font-weight-bold text-center mb-2">知识库生成向导</h1>
          <p class="text-body-1 text-center text-grey-darken-1">通过 AI 快速生成系列知识文档，助力您的学习目标</p>
        </div>
        <v-card elevation="4" rounded="lg" class="wizard-card" data-test="wizard" id="wizard-main" tabindex="-1" aria-describedby="wizard-description">
          <v-stepper
            v-model="currentStep"
            alt-labels
            :mobile="isMobile"
            elevation="0"
            data-test="stepper"
            role="tablist"
            aria-label="知识库生成步骤"
            @keydown="handleStepperKeydown"
          >
            <v-stepper-header @keydown="handleStepperKeydown">
              <v-stepper-item :complete="currentStep > 1" value="1" title="输入信息" subtitle="主题和选项" role="tab" :aria-selected="currentStep === 1" aria-controls="step-panel-1" id="stepper-tab-1" :aria-current="currentStep === 1 ? 'step' : undefined" />
              <v-divider />
              <v-stepper-item :complete="currentStep > 2" value="2" title="生成中" subtitle="AI 处理" role="tab" :aria-selected="currentStep === 2" aria-controls="step-panel-2" id="stepper-tab-2" :aria-current="currentStep === 2 ? 'step' : undefined" />
              <v-divider />
              <v-stepper-item :complete="currentStep > 3" value="3" title="预览文档" subtitle="审查内容" role="tab" :aria-selected="currentStep === 3" aria-controls="step-panel-3" id="stepper-tab-3" :aria-current="currentStep === 3 ? 'step' : undefined" />
              <v-divider />
              <v-stepper-item value="4" title="完成" subtitle="保存成功" role="tab" :aria-selected="currentStep === 4" aria-controls="step-panel-4" id="stepper-tab-4" :aria-current="currentStep === 4 ? 'step' : undefined" />
            </v-stepper-header>
            <v-stepper-window>
              <v-stepper-window-item value="1" data-test="step-1" id="step-panel-1" role="tabpanel" :aria-labelledby="'stepper-tab-1'">
                <v-card-text class="step-content">
                  <v-form ref="formRef" @submit.prevent="handleStartGeneration">
                    <v-text-field v-model="topic" label="主题" placeholder="例如：健康减肥方法" :rules="[rules.required, rules.topicLength]" :counter="100" variant="outlined" autofocus required class="mb-4" data-test="input-topic" />
                    <v-select v-model="documentCount" label="文档数量" :items="documentCountOptions" variant="outlined" class="mb-4" data-test="select-document-count" />
                    <v-select v-model="targetAudience" label="目标读者" :items="audienceOptions" variant="outlined" class="mb-4" data-test="select-audience">
                      <template #item="{ props: itemProps, item }">
                        <v-list-item v-bind="itemProps">
                          <template #prepend><v-icon :icon="item.raw.icon" /></template>
                        </v-list-item>
                      </template>
                      <template #selection="{ item }"><v-icon :icon="item.raw.icon" class="mr-2" />{{ item.title }}</template>
                    </v-select>
                  </v-form>
                </v-card-text>
              </v-stepper-window-item>
              <v-stepper-window-item value="2" data-test="step-2" id="step-panel-2" role="tabpanel" :aria-labelledby="'stepper-tab-2'">
                <v-card-text class="step-content">
                  <div class="progress-section mb-6">
                    <v-progress-linear :model-value="progress" :indeterminate="progress === 0" height="24" rounded color="primary" class="mb-2" data-test="progress-bar" role="progressbar" :aria-valuenow="Math.ceil(progress)" aria-valuemin="0" aria-valuemax="100" aria-label="生成进度">
                      <template #default="{ value }"><strong>{{ Math.ceil(value) }}%</strong></template>
                    </v-progress-linear>
                    <div class="text-center">
                      <p class="text-body-1 text-grey-darken-2">正在生成 {{ progress }}% 完成</p>
                      <p v-if="estimatedTime" class="text-body-2 text-grey">预计剩余时间：{{ estimatedTime }}</p>
                      <div class="visually-hidden" aria-live="polite" role="status" data-test="progress-live">进度 {{ progress }}%</div>
                    </div>
                  </div>
                  <div class="document-status-section" aria-live="polite" role="region" aria-label="文档生成状态" data-test="document-status-list">
                    <h3 class="text-h6 mb-3">文档生成状态</h3>
                    <v-list lines="two" density="comfortable" role="list">
                      <v-list-item v-for="doc in documentPreviews" :key="doc.uuid" data-test="document-status-item" role="listitem">
                        <template #prepend><v-icon :icon="getDocStatusIcon(doc.status)" :color="getDocStatusColor(doc.status)" /></template>
                        <v-list-item-title>{{ doc.title }}</v-list-item-title>
                        <template #append><v-chip :color="getDocStatusColor(doc.status)" size="small" variant="tonal">{{ getDocStatusText(doc.status) }}</v-chip></template>
                      </v-list-item>
                    </v-list>
                  </div>
                  <v-alert v-if="error && isFailed" type="error" variant="tonal" class="mt-4" closable data-test="error-alert">{{ error }}</v-alert>
                </v-card-text>
              </v-stepper-window-item>
              <v-stepper-window-item value="3" data-test="step-3" id="step-panel-3" role="tabpanel" :aria-labelledby="'stepper-tab-3'">
                <v-card-text class="step-content">
                  <h3 class="text-h6 mb-4">预览生成的文档（{{ documents.length }} 篇）</h3>
                  <v-row v-if="documents.length > 0">
                    <v-col v-for="doc in documents" :key="doc.uuid" cols="12" sm="6" lg="4" data-test="doc-preview-col">
                      <KnowledgeDocumentCard :document="mapToPreview(doc)" @discard="handleDiscard(doc.uuid)" data-test="doc-card" />
                    </v-col>
                  </v-row>
                  <v-alert v-else type="info" variant="tonal" class="text-center" data-test="empty-alert">所有文档已被丢弃。您可以返回重新生成。</v-alert>
                </v-card-text>
              </v-stepper-window-item>
              <v-stepper-window-item value="4" data-test="step-4" id="step-panel-4" role="tabpanel" :aria-labelledby="'stepper-tab-4'">
                <v-card-text class="step-content text-center">
                  <v-icon icon="mdi-check-circle" size="80" color="success" class="success-icon mb-4" />
                  <h2 class="text-h5 font-weight-bold mb-3" id="completion-heading">知识库创建成功！</h2>
                  <p class="text-body-1 text-grey-darken-2 mb-2" id="completion-summary">已生成 <strong>{{ documents.length }}</strong> 篇关于 <strong>"{{ topic }}"</strong> 的文档</p>
                  <p class="text-body-2 text-grey mb-6">文档已保存至知识库，您可以随时查看和编辑。</p>
                  <div v-if="currentStep === 4" aria-live="assertive" class="visually-hidden" data-test="completion-live">知识库创建成功，已生成 {{ documents.length }} 篇关于 “{{ topic }}” 的文档。</div>
                  <v-btn color="primary" size="large" rounded="lg" prepend-icon="mdi-folder-open" @click="handleViewInKnowledgeBase" data-test="btn-view-knowledge">在知识库中查看</v-btn>
                </v-card-text>
              </v-stepper-window-item>
            </v-stepper-window>
            <v-card-actions class="wizard-actions">
              <v-btn v-if="currentStep > 1 && currentStep < 4" variant="text" @click="handleBack" data-test="btn-back">返回</v-btn>
              <v-btn variant="text" color="error" @click="handleCancel" data-test="btn-cancel">{{ currentStep === 4 ? '关闭' : '取消' }}</v-btn>
              <v-spacer />
              <v-btn v-if="currentStep === 1" color="primary" variant="elevated" :disabled="!isStep1Valid" @click="handleStartGeneration" data-test="btn-start">开始生成</v-btn>
              <v-btn v-else-if="currentStep === 3" color="primary" variant="elevated" :disabled="documents.length === 0" @click="handleNext" data-test="btn-next">下一步</v-btn>
              <v-btn v-else-if="currentStep === 4" color="primary" variant="elevated" @click="handleFinish" data-test="btn-finish">完成</v-btn>
            </v-card-actions>
          </v-stepper>
        </v-card>
        <v-dialog v-model="showCancelDialog" max-width="400" role="dialog" aria-modal="true" aria-labelledby="cancel-dialog-title" data-test="cancel-dialog">
          <v-card>
            <v-card-title id="cancel-dialog-title" class="text-h6">确认取消</v-card-title>
            <v-card-text>您确定要取消吗？{{ isGenerating ? '生成进度将丢失。' : '已输入的数据将丢失。' }}</v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn variant="text" @click="showCancelDialog = false">继续</v-btn>
              <v-btn color="error" variant="text" @click="confirmCancel">确认取消</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useKnowledgeGeneration } from '../../composables/useKnowledgeGeneration';
import KnowledgeDocumentCard from './KnowledgeDocumentCard.vue';
import type { KnowledgeGenerationRequest, TargetAudience, GeneratedDocument, DocumentStatus, GeneratedDocumentPreview } from '../../types/knowledgeGeneration';
const router = useRouter();
const { mobile: isMobile } = useDisplay();
const { task, documents, isGenerating, error, currentStep, progress, isCompleted, isFailed, estimatedTime, documentPreviews, startGeneration, discardDocument, cancelTask, reset } = useKnowledgeGeneration();
const formRef = ref();
const topic = ref<string>('');
const documentCount = ref<number>(5);
const targetAudience = ref<TargetAudience>('Beginners' as TargetAudience);
const showCancelDialog = ref<boolean>(false);
const documentCountOptions = [3,4,5,6,7];
const audienceOptions = [ { value: 'Beginners', title: '初学者', icon: 'mdi-school' }, { value: 'Intermediate', title: '进阶者', icon: 'mdi-chart-line' }, { value: 'Advanced', title: '专家', icon: 'mdi-trophy' } ];
const rules = { required: (v:string)=>!!v || '此字段为必填项', topicLength: (v:string)=> (v.length>=1 && v.length<=100) || '主题长度应在 1-100 个字符之间' };
const wizardMaxWidth = computed(()=> currentStep.value === 3 ? 10 : 8);
const isStep1Valid = computed(()=> topic.value.length>=1 && topic.value.length<=100);
async function handleStartGeneration(): Promise<void> { const isValid = await formRef.value?.validate(); if (!isValid?.valid) return; const request: KnowledgeGenerationRequest = { topic: topic.value, documentCount: documentCount.value, targetAudience: targetAudience.value }; try { await startGeneration(request); } catch (err){ console.error('Failed to start generation:', err); } }
function handleNext(): void { if (currentStep.value < 4){ currentStep.value++; focusCurrentStep(); } }
function handleBack(): void { if (currentStep.value > 1 && !isGenerating.value){ currentStep.value--; focusCurrentStep(); } }
function handleCancel(): void { if (currentStep.value === 4){ handleFinish(); return; } showCancelDialog.value = true; nextTick(()=>{ const dialog = document.querySelector('[data-test="cancel-dialog"]') as HTMLElement | null; dialog?.focus(); }); }
function confirmCancel(): void { showCancelDialog.value = false; cancelTask(); reset(); router.push('/ai-tools'); }
function handleDiscard(uuid:string): void { discardDocument(uuid); }
function handleViewInKnowledgeBase(): void { if (!task.value) return; const folderPath = encodeURIComponent(`/AI Generated/${task.value.topic}`); router.push(`/knowledge?folder=${folderPath}`); }
function handleFinish(): void { reset(); router.push('/ai-tools'); }
function mapToPreview(doc: GeneratedDocument): GeneratedDocumentPreview { return { uuid: doc.uuid, title: doc.title, status: doc.status, excerpt: doc.content.slice(0,200) + (doc.content.length>200 ? '...' : ''), wordCount: doc.wordCount }; }
function getDocStatusIcon(status: DocumentStatus): string { switch(status){ case 'GENERATING': return 'mdi-sync'; case 'COMPLETED': return 'mdi-check-circle'; case 'FAILED': return 'mdi-alert-circle'; default: return 'mdi-file-document'; } }
function getDocStatusColor(status: DocumentStatus): string { switch(status){ case 'GENERATING': return 'blue'; case 'COMPLETED': return 'success'; case 'FAILED': return 'error'; default: return 'grey'; } }
function getDocStatusText(status: DocumentStatus): string { switch(status){ case 'GENERATING': return '生成中'; case 'COMPLETED': return '已完成'; case 'FAILED': return '失败'; default: return '未知'; } }
function focusCurrentStep(): void { nextTick(()=>{ let selector=''; switch(currentStep.value){ case 1: selector='[data-test="input-topic"]'; break; case 2: selector='[data-test="progress-bar"]'; break; case 3: selector='[data-test="doc-card"]'; break; case 4: selector='[data-test="btn-view-knowledge"]'; break; } if (selector){ const el = document.querySelector(selector) as HTMLElement | null; el?.setAttribute('tabindex','-1'); el?.focus(); } }); }
onMounted(()=>{ focusCurrentStep(); });
function handleStepperKeydown(e: KeyboardEvent): void { const key = e.key; if(['ArrowRight','ArrowDown'].includes(key)){ if(currentStep.value<4){ currentStep.value++; focusCurrentStep(); } e.preventDefault(); } else if(['ArrowLeft','ArrowUp'].includes(key)){ if(currentStep.value>1){ currentStep.value--; focusCurrentStep(); } e.preventDefault(); } else if(key==='Home'){ currentStep.value=1; focusCurrentStep(); e.preventDefault(); } else if(key==='End'){ currentStep.value=4; focusCurrentStep(); e.preventDefault(); } }
watch(()=> router.currentRoute.value, (newRoute)=>{ if(!newRoute.path.includes('knowledge-generator')){ reset(); } });
defineExpose({ handleStartGeneration, handleDiscard, handleCancel, confirmCancel, handleFinish, showCancelDialog });
</script>
<style scoped>
.knowledge-wizard-container { min-height:100vh; padding-top:2rem; padding-bottom:2rem; }
.visually-hidden { position:absolute !important; width:1px !important; height:1px !important; padding:0 !important; margin:-1px !important; overflow:hidden !important; clip:rect(0 0 0 0) !important; clip-path:inset(50%) !important; border:0 !important; white-space:nowrap !important; }
.wizard-header { margin-bottom:2rem; }
.wizard-card { background:linear-gradient(to bottom,#ffffff 0%,#fafafa 100%); }
.step-content { min-height:400px; padding:2rem; }
.progress-section { max-width:600px; margin:0 auto; }
.document-status-section { max-width:700px; margin:0 auto; }
.wizard-actions { padding:1rem 2rem; border-top:1px solid rgba(0,0,0,.12); }
.success-icon { animation:scaleIn .5s cubic-bezier(0.68,-0.55,0.27,1.55); }
@keyframes scaleIn { 0% { transform:scale(0); opacity:0; } 50% { transform:scale(1.1); } 100% { transform:scale(1); opacity:1; } }
.skip-link { position:absolute; left:-10000px; top:auto; width:1px; height:1px; overflow:hidden; }
.skip-link:focus { position:static; width:auto; height:auto; padding:.5rem 1rem; background:#1e1e1e; color:#fff; border-radius:4px; z-index:1000; }
@media (max-width:600px){ .step-content { padding:1rem; min-height:350px; } .wizard-actions { flex-direction:column; gap:.5rem; } .wizard-actions .v-btn { width:100%; } }
</style>
