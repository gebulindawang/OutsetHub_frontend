<script setup>
import { onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  width: { type: String, default: '420px' },
  closeOnClickOutside: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'close'])

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function onScrim() {
  if (props.closeOnClickOutside) close()
}

function onKeydown(event) {
  if (event.key === 'Escape') close()
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      document.addEventListener('keydown', onKeydown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', onKeydown)
      document.body.style.overflow = ''
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="scrim" @click.self="onScrim">
        <div class="panel" :style="{ width }" role="dialog" aria-modal="true">
          <header class="panel-head">
            <h3>{{ title }}</h3>
            <button class="close" type="button" aria-label="关闭" @click="close">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
              </svg>
            </button>
          </header>

          <div class="panel-body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="panel-foot">
            <slot name="footer" :close="close" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.scrim {
  position: fixed;
  inset: 0;
  z-index: 150;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(20, 24, 31, 0.28);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}

.panel {
  max-width: 100%;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 14px;
  box-shadow: 0 40px 90px -40px rgba(16, 24, 40, 0.45);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 12px;
}

.panel-head h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1);
}

.close {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  color: var(--text-3);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s var(--ease), color 0.15s var(--ease);
}

.close:hover {
  background: rgba(20, 24, 31, 0.06);
  color: var(--text-1);
}

.panel-body {
  padding: 4px 18px 18px;
}

.panel-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 18px 18px;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.22s var(--ease);
}

.modal-enter-active .panel,
.modal-leave-active .panel {
  transition: transform 0.24s var(--ease), opacity 0.24s var(--ease);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .panel,
.modal-leave-to .panel {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
</style>
