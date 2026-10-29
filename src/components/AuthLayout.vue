<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <aside class="auth-brand">
        <div class="logo">O</div>
        <h1>起点社区</h1>
        <p class="en">OutsetHub</p>
        <p class="slogan">每一段旅程,都从这里出发。</p>
      </aside>

      <main class="auth-main">
        <h2>{{ title }}</h2>
        <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(circle at 15% 20%, rgba(79, 70, 229, 0.18), transparent 40%),
    radial-gradient(circle at 85% 80%, rgba(236, 72, 153, 0.15), transparent 40%),
    var(--bg);
}

.auth-card {
  display: flex;
  width: 100%;
  max-width: 880px;
  min-height: 540px;
  background: var(--card);
  border-radius: 16px;
  box-shadow: var(--shadow);
  overflow: hidden;
}

.auth-brand {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px 40px;
  color: #fff;
  background: linear-gradient(145deg, #4f46e5, #7c3aed 60%, #ec4899);
}

.logo {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  margin-bottom: 20px;
  font-size: 28px;
  font-weight: 700;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.2);
}

.auth-brand h1 {
  margin: 0;
  font-size: 32px;
  letter-spacing: 2px;
}

.auth-brand .en {
  margin: 4px 0 24px;
  opacity: 0.8;
  letter-spacing: 3px;
}

.auth-brand .slogan {
  margin: 0;
  opacity: 0.9;
}

.auth-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px 44px;
}

.auth-main h2 {
  margin: 0;
  font-size: 26px;
  color: var(--text-h);
}

.subtitle {
  margin: 6px 0 28px;
  color: var(--text-light);
}

@media (max-width: 720px) {
  .auth-card {
    flex-direction: column;
    min-height: auto;
  }

  .auth-brand {
    padding: 28px 24px;
  }

  .auth-main {
    padding: 28px 24px 32px;
  }
}
</style>
