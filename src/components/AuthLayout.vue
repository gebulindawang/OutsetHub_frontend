<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})

const highlights = [
  { k: '写', t: 'Markdown 写作,发布即归档进板块' },
  { k: '找', t: '按板块浏览,关键词秒筛' },
  { k: '管', t: '草稿、编辑、软删除,作者自己说了算' },
]
</script>

<template>
  <div class="auth">
    <div class="auth-card">
      <aside class="aside">
        <div class="aside-top">
          <div class="brand">
            <span class="brand-mark">起</span>
            <span class="brand-name">起点社区</span>
          </div>
          <p class="slogan">每一段旅程,都从这里出发。</p>
        </div>

        <ul class="points">
          <li v-for="(item, i) in highlights" :key="item.k" class="point" :style="{ '--i': i }">
            <span class="point-key">{{ item.k }}</span>
            <span class="point-text">{{ item.t }}</span>
          </li>
        </ul>

        <p class="aside-foot">OutsetHub · 内测中</p>
      </aside>

      <main class="main">
        <header class="main-head">
          <h1>{{ title }}</h1>
          <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
        </header>

        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.auth {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 32px 20px;
}

.auth-card {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  width: 100%;
  max-width: 880px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 18px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 40px 90px -46px rgba(16, 24, 40, 0.38);
  animation: fadeUp 0.42s var(--ease) both;
}

.aside {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
  padding: 36px 32px;
  background: rgba(20, 24, 31, 0.022);
  border-right: 1px solid var(--line);
}

.brand {
  display: flex;
  align-items: center;
  gap: 9px;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: var(--brand);
  border-radius: 8px;
}

.brand-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1);
}

.slogan {
  margin-top: 14px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-3);
}

.points {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.point {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-2);
  animation: fadeUp 0.4s var(--ease) both;
  animation-delay: calc(80ms + var(--i) * 60ms);
}

.point-key {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  font-size: 11px;
  color: var(--brand);
  background: rgba(79, 70, 229, 0.08);
  border-radius: 6px;
}

.aside-foot {
  font-size: 12px;
  letter-spacing: 0.4px;
  color: var(--text-3);
}

.main {
  padding: 44px 44px 40px;
}

.main-head {
  margin-bottom: 26px;
}

.main-head h1 {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.2px;
  color: var(--text-1);
}

.subtitle {
  margin-top: 7px;
  font-size: 13px;
  color: var(--text-3);
}

@media (max-width: 800px) {
  .auth-card {
    grid-template-columns: minmax(0, 1fr);
    max-width: 460px;
  }

  .aside {
    display: none;
  }

  .main {
    padding: 32px 26px 30px;
  }
}
</style>
