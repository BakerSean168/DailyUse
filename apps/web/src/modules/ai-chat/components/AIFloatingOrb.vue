<template>
    <div class="ai-orb-wrapper" :class="{ 'menu-open': showMenu }">
        <!-- Hint bubble -->
        <transition name="hint-fade">
            <div v-if="showHint" class="ai-orb-hint" @click.stop="dismissHint">
                <span>{{ currentHint }}</span>
                <button class="close-hint" @click.stop="dismissHint">×</button>
            </div>
        </transition>

        <!-- Floating Orb -->
        <div class="ai-orb" @click="toggleMenu" @mouseenter="hovering = true" @mouseleave="hovering = false">
            <img v-if="avatar" :src="avatar" alt="AI" class="ai-avatar" />
            <div v-else class="ai-fallback">🧠</div>
            <div class="pulse" />
        </div>

        <!-- Action Menu -->
        <transition name="menu-scale">
            <div v-if="showMenu" class="ai-orb-menu" @click.stop>
                <div class="menu-header">
                    <span class="title">AI 助手</span>
                    <button class="close" @click="toggleMenu">×</button>
                </div>
                <ul class="actions">
                    <li><button @click="emitChat">💬 打开聊天</button></li>
                    <li><button @click="emitKeyResult">🎯 生成关键结果</button></li>
                    <li><button @click="emitGoalAssist">📌 目标建议</button></li>
                    <li><button @click="emitTasks">🛠 分解任务</button></li>
                    <li><button @click="emitKnowledge">📘 知识文档</button></li>
                </ul>
                <div class="footer">
                    <small>我可以协助规划与执行。</small>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { logo64 as avatar } from '@dailyuse/assets';

const showMenu = ref(false);
const showHint = ref(false);
const hovering = ref(false);
const currentHint = ref('我可以帮你创建关键结果');
const emittedInitialHint = ref(false);

function toggleMenu() {
    showMenu.value = !showMenu.value;
    if (showMenu.value) {
        // If menu opened, hide hint
        showHint.value = false;
    }
}

function emitChat() {
    showMenu.value = false;
    showHint.value = false;
    emit('open-chat');
}

function emitKeyResult() {
    showMenu.value = false;
    emit('create-key-result');
}

function emitGoalAssist() {
    showMenu.value = false;
    emit('assist-goal');
}
function emitTasks() {
    showMenu.value = false;
    emit('generate-tasks');
}
function emitKnowledge() {
    showMenu.value = false;
    emit('generate-knowledge');
}

function dismissHint() {
    showHint.value = false;
}

const emit = defineEmits<{
    (e: 'open-chat'): void;
    (e: 'create-key-result'): void;
    (e: 'assist-goal'): void;
    (e: 'generate-tasks'): void;
    (e: 'generate-knowledge'): void;
}>(); onMounted(() => {
    // Show an initial hint after slight delay (once per mount)
    setTimeout(() => {
        if (!emittedInitialHint.value) {
            showHint.value = true;
            emittedInitialHint.value = true;
        }
    }, 4000);
});
</script>

<style scoped>
.ai-orb-wrapper {
    position: fixed;
    bottom: 28px;
    right: 28px;
    z-index: 1200;
    display: flex;
    align-items: flex-end;
    gap: 12px;
}

.ai-orb-hint {
    background: linear-gradient(135deg, #ffffff 0%, #fafbff 100%);
    border: 1px solid rgba(216, 218, 224, 0.6);
    border-radius: 14px;
    padding: 10px 14px;
    font-size: 13px;
    line-height: 1.5;
    color: #333;
    box-shadow:
        0 6px 20px rgba(0, 0, 0, 0.12),
        0 2px 6px rgba(74, 108, 247, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
    max-width: 220px;
    position: relative;
    cursor: pointer;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition: all 0.2s ease;
}

.ai-orb-hint:hover {
    transform: translateY(-2px);
    box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.15),
        0 4px 8px rgba(74, 108, 247, 0.12);
}

.ai-orb-hint::after {
    content: '';
    position: absolute;
    right: -6px;
    bottom: 14px;
    width: 12px;
    height: 12px;
    background: #fff;
    border-left: 1px solid #d8dae0;
    border-top: 1px solid #d8dae0;
    transform: rotate(45deg);
}

.close-hint {
    position: absolute;
    top: 2px;
    right: 4px;
    background: none;
    border: none;
    font-size: 14px;
    cursor: pointer;
    color: #555;
}

.close-hint:hover {
    color: #c22;
}

.ai-orb {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background:
        radial-gradient(circle at 30% 30%, #6dd5ed, #4a6cf7 50%, #3852d9 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow:
        0 8px 24px rgba(74, 108, 247, 0.4),
        0 4px 12px rgba(0, 0, 0, 0.15),
        inset 0 -2px 8px rgba(0, 0, 0, 0.15),
        inset 0 2px 8px rgba(255, 255, 255, 0.3);
    cursor: pointer;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.ai-orb:hover {
    transform: scale(1.08);
    box-shadow:
        0 12px 32px rgba(74, 108, 247, 0.5),
        0 6px 16px rgba(0, 0, 0, 0.2),
        inset 0 -2px 8px rgba(0, 0, 0, 0.2),
        inset 0 2px 8px rgba(255, 255, 255, 0.4);
}

.ai-orb:active {
    transform: scale(0.95);
}

.ai-avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.8);
}

.ai-fallback {
    font-size: 30px;
}

.pulse {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
    animation: pulse-ring 3.5s ease-in-out infinite;
    pointer-events: none;
}

@keyframes pulse-ring {
    0% {
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.5);
    }

    70% {
        box-shadow: 0 0 0 18px rgba(255, 255, 255, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
    }
}

.ai-orb-menu {
    position: absolute;
    bottom: 82px;
    right: 0;
    width: 260px;
    background: rgba(255, 255, 255, 0.98);
    border: 1px solid rgba(208, 211, 217, 0.6);
    border-radius: 18px;
    box-shadow:
        0 16px 40px rgba(0, 0, 0, 0.22),
        0 8px 16px rgba(74, 108, 247, 0.12),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
}

.menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: #f5f6fa;
    border-bottom: 1px solid #e0e3e9;
}

.menu-header .title {
    font-size: 14px;
    font-weight: 600;
}

.menu-header .close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    line-height: 1;
    padding: 2px 6px;
}

.menu-header .close:hover {
    color: #d93025;
}

.actions {
    list-style: none;
    margin: 0;
    padding: 6px 0;
}

.actions li {
    margin: 0;
    padding: 0;
}

.actions button {
    width: 100%;
    background: none;
    border: none;
    text-align: left;
    padding: 12px 18px;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    gap: 10px;
    align-items: center;
    color: #2f3747;
    transition: all 0.15s ease;
    position: relative;
}

.actions button::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(135deg, #4a6cf7, #6dd5ed);
    transform: scaleY(0);
    transition: transform 0.2s ease;
}

.actions button:hover {
    background: linear-gradient(90deg, #eef3ff 0%, #f8f9ff 100%);
    color: #4a6cf7;
    padding-left: 22px;
}

.actions button:hover::before {
    transform: scaleY(1);
}

.actions button:active {
    transform: scale(0.98);
}

.footer {
    padding: 6px 14px 10px;
    border-top: 1px solid #eceef2;
    background: #fafbfc;
}

.footer small {
    font-size: 11px;
    color: #666;
}

/* Transitions */
.hint-fade-enter-active,
.hint-fade-leave-active {
    transition: opacity .25s ease, transform .25s ease;
}

.hint-fade-enter-from,
.hint-fade-leave-to {
    opacity: 0;
    transform: translateY(4px);
}

.menu-scale-enter-active,
.menu-scale-leave-active {
    transition: opacity .18s ease, transform .18s ease;
    transform-origin: bottom right;
}

.menu-scale-enter-from,
.menu-scale-leave-to {
    opacity: 0;
    transform: scale(.85) translateY(6px);
}
</style>