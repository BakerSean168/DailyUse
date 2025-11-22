<template>
  <div class="chat-input-wrapper">
    <textarea ref="textareaRef" v-model="draft" class="chat-input" :placeholder="placeholder" :disabled="disabled" @keydown.enter.prevent="handleEnter" @input="autoGrow" />
    <div class="actions">
      <button class="send-btn" :disabled="disabled || !draft.trim()" @click="emitSend">Send</button>
      <button v-if="isStreaming" class="stop-btn" @click="$emit('stop')">Stop</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
interface Props { disabled?: boolean; isStreaming?: boolean; placeholder?: string; autoFocus?: boolean }
const props = withDefaults(defineProps<Props>(),{ disabled:false, isStreaming:false, placeholder:'Ask me anything...', autoFocus:true });
const emit = defineEmits<{ (e:'send', value:string):void; (e:'stop'):void }>();
const draft = ref('');
const textareaRef = ref<HTMLTextAreaElement|null>(null);
function emitSend(){ const value = draft.value.trim(); if(!value) return; emit('send', value); draft.value=''; autoGrow(); }
function handleEnter(e:KeyboardEvent){ if(e.shiftKey){ draft.value+='\n'; autoGrow(); } else { emitSend(); } }
function autoGrow(){ const el = textareaRef.value; if(!el) return; el.style.height='auto'; el.style.height = Math.min(el.scrollHeight,240)+'px'; }
watch(()=> draft.value, autoGrow);
onMounted(()=>{ if(props.autoFocus && textareaRef.value){ textareaRef.value.focus(); autoGrow(); } });
</script>
<style scoped>
.chat-input-wrapper{ display:flex; flex-direction:column; gap:10px; padding:16px 20px 20px; background:linear-gradient(180deg,transparent 0%,rgba(245,246,250,.5) 100%); border-top:1px solid rgba(225,226,230,.5); }
.chat-input{ width:100%; resize:none; padding:12px 16px; font-size:14px; border-radius:12px; border:1.5px solid rgba(208,211,217,.4); background:#fff; line-height:1.5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; transition:all .2s ease; box-shadow:0 2px 8px rgba(0,0,0,.02); }
.chat-input:focus{ outline:none; border-color:#4a6cf7; box-shadow:0 0 0 3px rgba(74,108,247,.1),0 4px 12px rgba(74,108,247,.08); }
.chat-input:disabled{ background:#f5f6fa; color:#999; cursor:not-allowed; }
.actions{ display:flex; gap:10px; justify-content:flex-end; }
.send-btn, .stop-btn{ cursor:pointer; border:none; padding:10px 20px; font-size:14px; font-weight:600; border-radius:10px; transition:all .2s ease; letter-spacing:.3px; }
.send-btn{ background:linear-gradient(135deg,#4a6cf7 0%,#5e7bfa 100%); color:#fff; box-shadow:0 2px 8px rgba(74,108,247,.3), inset 0 1px 0 rgba(255,255,255,.2); }
.send-btn:hover:not(:disabled){ transform:translateY(-1px); box-shadow:0 4px 12px rgba(74,108,247,.4), inset 0 1px 0 rgba(255,255,255,.3); }
.send-btn:disabled{ background:linear-gradient(135deg,#b8c4e8 0%,#d0d8f0 100%); cursor:not-allowed; box-shadow:none; }
.stop-btn{ background:linear-gradient(135deg,#ffb347 0%,#ffcc70 100%); color:#663300; box-shadow:0 2px 8px rgba(255,179,71,.3), inset 0 1px 0 rgba(255,255,255,.3); }
.stop-btn:hover{ transform:translateY(-1px); box-shadow:0 4px 12px rgba(255,179,71,.4), inset 0 1px 0 rgba(255,255,255,.4); }
</style>
