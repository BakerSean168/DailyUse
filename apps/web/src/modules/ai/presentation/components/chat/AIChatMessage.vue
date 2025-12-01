<template>
  <div :class="wrapperClass">
    <div class="ai-chat-message" v-html="displayContent"></div>
    <div v-if="message.isStreaming" class="streaming-indicator" aria-label="Streaming">▌</div>
    <div v-if="message.error" class="error" role="alert">{{ message.error }}</div>
    <div v-if="message.truncated" class="truncated">(stopped)</div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import type { ChatMessage } from '../../types/chat';
// Minimal markdown render (placeholder); could be replaced by shared util.
function renderMarkdown(raw: string){
  return raw
    .replace(/\n\n/g,'</p><p>')
    .replace(/\n/g,'<br/>')
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/^\* (.+)$/gm,'• $1');
}
interface Props { message: ChatMessage }
const props = defineProps<Props>();
const rendered = computed(()=> renderMarkdown(props.message.content));
const displayContent = computed(()=>{
  if(props.message.isStreaming && !props.message.content){
    return '<em class="thinking">AI is thinking...</em>';
  }
  return rendered.value;
});
const wrapperClass = computed(()=> [ 'chat-bubble', props.message.role === 'user' ? 'user' : 'assistant' ]);
</script>
<style scoped>
.chat-bubble { max-width:75%; padding:12px 16px; margin:0; border-radius:16px; line-height:1.6; position:relative; font-size:14px; word-wrap:break-word; animation:slideIn .2s ease; }
@keyframes slideIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }
.chat-bubble.user { background:linear-gradient(135deg,rgb(var(--v-theme-primary)) 0%,rgba(var(--v-theme-primary),0.85) 100%); color:#fff; align-self:flex-end; border-radius:16px 16px 4px 16px; box-shadow:0 2px 8px rgba(var(--v-theme-primary),.25), inset 0 1px 0 rgba(255,255,255,.2); }
.chat-bubble.assistant { background:rgba(var(--v-theme-surface-variant),0.5); color:rgb(var(--v-theme-on-surface)); align-self:flex-start; border:1px solid rgba(var(--v-theme-primary),.1); border-radius:16px 16px 16px 4px; box-shadow:0 2px 8px rgba(0,0,0,.04); }
.chat-bubble :deep(code){ background:rgba(var(--v-theme-on-surface),.08); padding:2px 6px; border-radius:4px; font-size:.9em; font-family:'SF Mono',Monaco,'Cascadia Code',monospace; }
.chat-bubble.user :deep(code){ background:rgba(255,255,255,.2); }
.streaming-indicator { display:inline-block; margin-left:4px; font-size:14px; opacity:.7; animation:blink 1.2s infinite; }
@keyframes blink {0%,100%{opacity:.7;}50%{opacity:.2;}}
.error { color:rgb(var(--v-theme-error)); font-size:12px; margin-top:6px; padding:4px 8px; background:rgba(var(--v-theme-error),.1); border-radius:6px; display:inline-block; }
.truncated { color:rgba(var(--v-theme-on-surface),.6); font-size:11px; margin-top:6px; font-style:italic; opacity:.7; }
.thinking { color:rgba(var(--v-theme-on-surface),.6); font-style:italic; opacity:.8; }
</style>
