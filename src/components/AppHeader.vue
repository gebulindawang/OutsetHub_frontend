<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useToast } from '../composables/useToast'

const router = useRouter()
const { user, isLogin, isAdmin, displayName, signOut } = useAuth()
const { success } = useToast()

const scrolled = ref(false)
const menuOpen = ref(false)

onMounted(() => {
  const onScroll = () => {
    scrolled.value = window.scrollY > 4
  }
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

function onBlurMenu(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) menuOpen.value = false
}

function logout() {
  menuOpen.value = false
  signOut()
  success('已退出登录')
  router.replace('/login')
}
</script>

<template>
  <header class="header" :class="{ 'is-scrolled': scrolled }">
    <div class="header-inner container">
      <RouterLink to="/home" class="brand">
        <span class="brand-mark">起</span>
        <span class="brand-name">起点社区</span>
      </RouterLink>

      <nav class="nav">
        <RouterLink to="/home" class="nav-link">首页</RouterLink>
        <RouterLink v-if="isAdmin" to="/categories" class="nav-link">板块管理</RouterLink>
      </nav>

      <div class="actions">
        <button class="btn btn--primary" type="button" @click="router.push('/article/new')">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2.5v9M2.5 7h9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
          写文章
        </button>

        <div v-if="isLogin" class="account" tabindex="0" @focusin="menuOpen = true" @focusout="onBlurMenu">
          <button class="account-btn" type="button" @click="menuOpen = !menuOpen">
            <span class="avatar">{{ (displayName || '·').slice(0, 1) }}</span>
            <span class="account-name">{{ displayName }}</span>
            <svg class="caret" width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 4l3 3 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
            </svg>
          </button>

          <Transition name="menu">
            <div v-if="menuOpen" class="menu">
              <div class="menu-head">
                <p class="menu-name">{{ displayName }}</p>
                <p class="menu-meta">
                  <span v-if="isAdmin" class="chip chip--brand">管理员</span>
                  <span v-else class="chip">普通用户</span>
                  <span class="muted">ID {{ user?.id }}</span>
                </p>
              </div>
              <button class="menu-item" type="button" @click="logout">退出登录</button>
            </div>
          </Transition>
        </div>

        <RouterLink v-else to="/login" class="btn">登录</RouterLink>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid transparent;
  transition: background-color 0.25s var(--ease), border-color 0.25s var(--ease),
    box-shadow 0.25s var(--ease);
}

.header.is-scrolled {
  background: rgba(255, 255, 255, 0.8);
  border-bottom-color: var(--line);
  box-shadow: 0 1px 12px rgba(16, 24, 40, 0.05);
}

.header-inner {
  display: flex;
  align-items: center;
  gap: 28px;
  height: var(--header-h);
}

.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-shrink: 0;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: var(--brand);
  border-radius: 7px;
  transition: transform 0.2s var(--ease);
}

.brand:hover .brand-mark {
  transform: rotate(-6deg) scale(1.04);
}

.brand-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1);
  letter-spacing: 0.2px;
}

.nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link {
  position: relative;
  padding: 6px 10px;
  font-size: 13px;
  color: var(--text-2);
  border-radius: 6px;
  transition: color 0.15s var(--ease), background-color 0.15s var(--ease);
}

.nav-link:hover {
  color: var(--text-1);
  background: rgba(20, 24, 31, 0.05);
}

.nav-link.router-link-active {
  color: var(--text-1);
  font-weight: 500;
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: -1px;
  height: 2px;
  background: var(--brand);
  border-radius: 2px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.account {
  position: relative;
}

.account-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  padding: 0 8px 0 5px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  transition: background-color 0.15s var(--ease), border-color 0.15s var(--ease);
}

.account-btn:hover {
  background: rgba(255, 255, 255, 0.8);
  border-color: var(--line);
}

.avatar {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  font-size: 12px;
  font-weight: 500;
  color: var(--brand);
  background: var(--brand-soft);
  border-radius: 50%;
}

.account-name {
  max-width: 96px;
  overflow: hidden;
  font-size: 13px;
  color: var(--text-1);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.caret {
  color: var(--text-3);
}

.menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 196px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(16, 24, 40, 0.06), 0 24px 50px -24px rgba(16, 24, 40, 0.4);
}

.menu-head {
  padding: 8px 10px 10px;
  border-bottom: 1px solid var(--line);
}

.menu-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-1);
}

.menu-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 12px;
}

.menu-item {
  width: 100%;
  margin-top: 4px;
  padding: 8px 10px;
  font-size: 13px;
  text-align: left;
  color: var(--text-2);
  background: transparent;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  transition: background-color 0.15s var(--ease), color 0.15s var(--ease);
}

.menu-item:hover {
  color: var(--danger);
  background: var(--danger-soft);
}

.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.16s var(--ease), transform 0.16s var(--ease);
  transform-origin: top right;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

@media (max-width: 640px) {
  .header-inner {
    gap: 12px;
  }

  .nav,
  .account-name {
    display: none;
  }
}
</style>
