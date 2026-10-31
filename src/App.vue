<script setup>
import ToastHost from './components/ToastHost.vue'
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition name="page" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>

  <ToastHost />
</template>
