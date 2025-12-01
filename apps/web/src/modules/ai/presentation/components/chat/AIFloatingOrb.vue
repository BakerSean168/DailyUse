<template>
    <div
        class="ai-orb-wrapper"
        :class="wrapperClasses"
        :style="wrapperStyle"
    >
        <transition name="hint-fade">
            <div v-if="showHint" class="ai-orb-hint" @click.stop="dismissHint">
                <span>{{ currentHint }}</span>
                <button class="close-hint" @click.stop="dismissHint" aria-label="关闭提示">×</button>
            </div>
        </transition>
        <div
            class="ai-orb"
            @click="toggleMenu"
            @mouseenter="hovering = true"
            @mouseleave="hovering = false"
            @pointerdown="startDrag"
            aria-label="AI 助手入口"
            role="button"
        >
            <img v-if="avatar" :src="avatar" alt="AI" class="ai-avatar" />
            <div v-else class="ai-fallback">🧠</div>
            <div class="pulse" />
        </div>
        <transition name="menu-scale">
            <div v-if="showMenu" class="ai-orb-menu" @click.stop>
                <div class="menu-header">
                    <span class="title">AI 助手</span>
                    <button class="close" @click="toggleMenu" aria-label="关闭">×</button>
                </div>
                <ul class="actions">
                    <li><button @click="emitChat">💬 打开聊天</button></li>
                    <li><button @click="emitGenerateGoal">🎯 生成目标</button></li>
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
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { logo48 as avatar } from '@dailyuse/assets';

const emit = defineEmits<{
    (e: 'open-chat'): void;
    (e: 'generate-goal'): void;
    (e: 'assist-goal'): void;
    (e: 'generate-tasks'): void;
    (e: 'generate-knowledge'): void;
}>();

const showMenu = ref(false);
const showHint = ref(false);
const hovering = ref(false);
const currentHint = ref('我可以帮你规划目标和任务');
const emittedInitialHint = ref(false);

const dragMoved = ref(false);
const isDragging = ref(false);
const isDocked = ref(true);
const dockingSide = ref<'left' | 'right'>('right');
const position = ref({ x: 0, y: 0 });

const defaultViewport = { width: 1440, height: 900 };
const viewport = ref({ ...defaultViewport });

const ORB_SIZE = 68;
const EDGE_PADDING = 20;

const dragOrigin = ref({ x: 0, y: 0 });
const pointerOrigin = ref({ x: 0, y: 0 });
const dragElement = ref<HTMLElement | null>(null);

const wrapperStyle = computed(() => ({
    transform: `translate3d(${position.value.x}px, ${position.value.y}px, 0)`
}));

const wrapperClasses = computed(() => ({
    'menu-open': showMenu.value,
    'is-dragging': isDragging.value,
    'is-docked': isDocked.value,
    'dock-left': dockingSide.value === 'left',
    'dock-right': dockingSide.value === 'right',
}));

function updateViewportDimensions() {
    if (typeof window === 'undefined') return;
    viewport.value = {
        width: window.innerWidth,
        height: window.innerHeight,
    };
}

function clampValue(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function clampPosition(x: number, y: number) {
    const maxX = viewport.value.width - ORB_SIZE - EDGE_PADDING;
    const maxY = viewport.value.height - ORB_SIZE - EDGE_PADDING;
    return {
        x: clampValue(x, EDGE_PADDING, Math.max(EDGE_PADDING, maxX)),
        y: clampValue(y, EDGE_PADDING, Math.max(EDGE_PADDING, maxY)),
    };
}

position.value = clampPosition(
    viewport.value.width - ORB_SIZE - EDGE_PADDING,
    viewport.value.height - ORB_SIZE - EDGE_PADDING,
);

function initializePosition() {
    const initial = clampPosition(
        viewport.value.width - ORB_SIZE - EDGE_PADDING,
        viewport.value.height - ORB_SIZE - EDGE_PADDING,
    );
    position.value = initial;
}

function toggleMenu() {
    if (dragMoved.value || isDragging.value) {
        dragMoved.value = false;
        return;
    }
    showMenu.value = !showMenu.value;
    if (showMenu.value) {
        showHint.value = false;
        snapToEdge();
    }
}

function emitChat() {
    showMenu.value = false;
    showHint.value = false;
    emit('open-chat');
}

function emitGenerateGoal() {
    showMenu.value = false;
    emit('generate-goal');
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

function startDrag(event: PointerEvent) {
    if (event.button !== 0) return;
    if (typeof window === 'undefined') return;
    dragMoved.value = false;
    isDragging.value = true;
    showMenu.value = false;
    pointerOrigin.value = { x: event.clientX, y: event.clientY };
    dragOrigin.value = { ...position.value };
    dragElement.value = event.currentTarget as HTMLElement;
    dragElement.value?.setPointerCapture?.(event.pointerId);
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', endDrag);
}

function onDragMove(event: PointerEvent) {
    if (!isDragging.value) return;
    const dx = event.clientX - pointerOrigin.value.x;
    const dy = event.clientY - pointerOrigin.value.y;

    if (!dragMoved.value && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        dragMoved.value = true;
    }

    const next = clampPosition(dragOrigin.value.x + dx, dragOrigin.value.y + dy);
    position.value = next;
    isDocked.value = false;
}

function endDrag(event: PointerEvent) {
    if (!isDragging.value) return;
    dragElement.value?.releasePointerCapture?.(event.pointerId);
    dragElement.value = null;
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', endDrag);
    isDragging.value = false;

    if (dragMoved.value) {
        snapToEdge();
    }

    if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
            dragMoved.value = false;
        });
    } else {
        dragMoved.value = false;
    }
}

function snapToEdge() {
    const midpoint = position.value.x + ORB_SIZE / 2;
    const viewportMid = viewport.value.width / 2;
    const targetSide = midpoint < viewportMid ? 'left' : 'right';
    dockingSide.value = targetSide;

    const snappedX = targetSide === 'left'
        ? EDGE_PADDING
        : viewport.value.width - ORB_SIZE - EDGE_PADDING;

    position.value = clampPosition(snappedX, position.value.y);
    isDocked.value = true;
}

function handleResize() {
    updateViewportDimensions();
    position.value = clampPosition(position.value.x, position.value.y);
    snapToEdge();
}

onMounted(() => {
    if (typeof window !== 'undefined') {
        updateViewportDimensions();
        initializePosition();
        window.addEventListener('resize', handleResize);
        setTimeout(() => {
            if (!emittedInitialHint.value) {
                showHint.value = true;
                emittedInitialHint.value = true;
            }
        }, 4000);
    }
});

onBeforeUnmount(() => {
    if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('pointermove', onDragMove);
        window.removeEventListener('pointerup', endDrag);
    }
});
</script>
<style scoped>
.ai-orb-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1200;
    display: flex;
    align-items: flex-end;
    gap: 12px;
    transform: translate3d(0, 0, 0);
    transition: transform .25s ease;
}

.ai-orb-wrapper.dock-left {
    flex-direction: row-reverse;
}

.ai-orb-wrapper.is-dragging {
    transition: none;
}

.ai-orb-hint {
    background: color-mix(in srgb, var(--v-theme-surface) 92%, transparent);
    border: 1px solid color-mix(in srgb, var(--v-theme-on-surface) 14%, transparent);
    border-radius: 14px;
    padding: 10px 14px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--v-theme-on-surface);
    box-shadow: 0 6px 20px color-mix(in srgb, var(--v-theme-on-surface) 12%, transparent),
        0 2px 6px color-mix(in srgb, var(--v-theme-primary) 18%, transparent);
    max-width: 220px;
    position: relative;
    cursor: pointer;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition: all .2s ease;
}

.ai-orb-hint:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px color-mix(in srgb, var(--v-theme-on-surface) 18%, transparent),
        0 4px 8px color-mix(in srgb, var(--v-theme-primary) 24%, transparent);
}

.ai-orb-hint::after {
    content: '';
    position: absolute;
    right: -6px;
    bottom: 14px;
    width: 12px;
    height: 12px;
    background: color-mix(in srgb, var(--v-theme-surface) 95%, transparent);
    border-left: 1px solid color-mix(in srgb, var(--v-theme-on-surface) 14%, transparent);
    border-top: 1px solid color-mix(in srgb, var(--v-theme-on-surface) 14%, transparent);
    transform: rotate(45deg);
}

.ai-orb-wrapper.dock-left .ai-orb-hint::after {
    left: -6px;
    right: auto;
    border-left: none;
    border-top: none;
    border-right: 1px solid color-mix(in srgb, var(--v-theme-on-surface) 14%, transparent);
    border-bottom: 1px solid color-mix(in srgb, var(--v-theme-on-surface) 14%, transparent);
}

.close-hint {
    position: absolute;
    top: 2px;
    right: 4px;
    background: none;
    border: none;
    font-size: 14px;
    cursor: pointer;
    color: color-mix(in srgb, var(--v-theme-on-surface) 70%, transparent);
}

.close-hint:hover {
    color: color-mix(in srgb, var(--v-theme-primary) 80%, var(--v-theme-on-surface));
}

.ai-orb {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%,
            color-mix(in srgb, var(--v-theme-primary) 75%, white) 0%,
            var(--v-theme-primary) 45%,
            color-mix(in srgb, var(--v-theme-primary) 80%, black) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow: 0 8px 24px color-mix(in srgb, var(--v-theme-primary) 40%, transparent),
        0 4px 12px color-mix(in srgb, var(--v-theme-on-surface) 20%, transparent),
        inset 0 -2px 8px rgba(0, 0, 0, .15),
        inset 0 2px 8px rgba(255, 255, 255, .25);
    cursor: grab;
    overflow: hidden;
    transition: transform .3s cubic-bezier(.34, 1.56, .64, 1), box-shadow .3s ease;
}

.ai-orb-wrapper.is-dragging .ai-orb {
    cursor: grabbing;
    box-shadow: 0 16px 28px color-mix(in srgb, var(--v-theme-primary) 50%, transparent);
}

.ai-orb-wrapper.is-docked .ai-orb {
    width: 58px;
    height: 58px;
}

.ai-orb:hover {
    transform: scale(1.08);
}

.ai-orb:active {
    transform: scale(.95);
}

.ai-avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, .8);
}

.ai-fallback {
    font-size: 30px;
}

.pulse {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    box-shadow: 0 0 0 0 rgba(255, 255, 255, .4);
    animation: pulse-ring 3.5s ease-in-out infinite;
    pointer-events: none;
}

@keyframes pulse-ring {
    0% {
        box-shadow: 0 0 0 0 rgba(255, 255, 255, .5);
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
    background: color-mix(in srgb, var(--v-theme-surface) 96%, transparent);
    border: 1px solid color-mix(in srgb, var(--v-theme-on-surface) 12%, transparent);
    border-radius: 18px;
    box-shadow: 0 16px 40px color-mix(in srgb, var(--v-theme-on-surface) 26%, transparent),
        0 8px 16px color-mix(in srgb, var(--v-theme-primary) 16%, transparent);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
}

.ai-orb-wrapper.dock-left .ai-orb-menu {
    left: 0;
    right: auto;
    transform-origin: bottom left;
}

.menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: color-mix(in srgb, var(--v-theme-surface) 90%, transparent);
    border-bottom: 1px solid color-mix(in srgb, var(--v-theme-on-surface) 10%, transparent);
    color: var(--v-theme-on-surface);
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
    color: color-mix(in srgb, var(--v-theme-on-surface) 70%, transparent);
}

.menu-header .close:hover {
    color: var(--v-theme-primary);
}

.actions {
    list-style: none;
    margin: 0;
    padding: 6px 0;
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
    color: color-mix(in srgb, var(--v-theme-on-surface) 88%, transparent);
    transition: all .15s ease;
    position: relative;
}

.actions button::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--v-theme-primary);
    opacity: 0;
    transition: opacity .2s ease;
}

.actions button:hover {
    background: color-mix(in srgb, var(--v-theme-primary) 10%, transparent);
    color: var(--v-theme-primary);
    padding-left: 22px;
}

.actions button:hover::before {
    opacity: 1;
}

.footer {
    padding: 6px 14px 10px;
    border-top: 1px solid color-mix(in srgb, var(--v-theme-on-surface) 10%, transparent);
    background: color-mix(in srgb, var(--v-theme-surface) 92%, transparent);
    color: color-mix(in srgb, var(--v-theme-on-surface) 70%, transparent);
}

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

.ai-orb-wrapper.dock-left .menu-scale-enter-active,
.ai-orb-wrapper.dock-left .menu-scale-leave-active {
    transform-origin: bottom left;
}

.menu-scale-enter-from,
.menu-scale-leave-to {
    opacity: 0;
    transform: scale(.85) translateY(6px);
}
</style>
