<script setup>
defineProps({
  title: { type: String, default: '这里还什么都没有' },
  desc: { type: String, default: '' },
})
</script>

<template>
  <div class="empty">
    <div class="empty-icon">
      <slot name="icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
          <path d="M5 4.5h14v15H5z" stroke-linejoin="round" />
          <path d="M8.5 9h7M8.5 12.5h7M8.5 16h4" stroke-linecap="round" />
        </svg>
      </slot>
    </div>
    <p class="empty-title">{{ title }}</p>
    <p v-if="desc" class="empty-desc">{{ desc }}</p>
    <div v-if="$slots.action" class="empty-action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 24px;
  text-align: center;
  animation: fadeUp 0.3s var(--ease) both;
}

.empty-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  margin-bottom: 14px;
  color: var(--text-3);
  background: rgba(20, 24, 31, 0.04);
  border-radius: 12px;
}

.empty-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-1);
}

.empty-desc {
  margin-top: 5px;
  font-size: 13px;
  color: var(--text-3);
}

.empty-action {
  margin-top: 16px;
}
</style>
