<script setup>
import { useToast } from '../composables/useToast'

const { items, remove } = useToast()
</script>

<template>
  <div class="toast-host" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="item in items"
        :key="item.id"
        class="toast"
        :class="`toast--${item.type}`"
        @click="remove(item.id)"
      >
        <span class="toast-dot"></span>
        <span class="toast-text">{{ item.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 9px;
  max-width: 420px;
  padding: 9px 14px;
  font-size: 13px;
  color: var(--text-1);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(16, 24, 40, 0.06), 0 18px 40px -20px rgba(16, 24, 40, 0.35);
  pointer-events: auto;
  cursor: pointer;
}

.toast-dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--brand);
}

.toast--success .toast-dot {
  background: var(--success);
}

.toast--error .toast-dot {
  background: var(--danger);
}

.toast-text {
  line-height: 1.45;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.24s var(--ease), transform 0.24s var(--ease);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.96);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

.toast-move {
  transition: transform 0.24s var(--ease);
}
</style>
