import { createRouter, createWebHistory } from 'vue-router'
import { TOKEN_KEY } from '../utils/request'
import { useAuth } from '../composables/useAuth'
import { useToast } from '../composables/useToast'

const routes = [
  { path: '/', redirect: '/home' },

  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录', guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/Register.vue'),
    meta: { title: '注册', guestOnly: true },
  },

  {
    path: '/home',
    name: 'home',
    component: () => import('../views/Home.vue'),
    meta: { title: '首页', requiresAuth: true },
  },
  {
    // 静态路径要放在 /article/:id 之前
    path: '/article/new',
    name: 'article-new',
    component: () => import('../views/ArticleEdit.vue'),
    meta: { title: '写文章', requiresAuth: true },
  },
  {
    path: '/article/:id(\\d+)',
    name: 'article-detail',
    component: () => import('../views/ArticleDetail.vue'),
    meta: { title: '文章', requiresAuth: true },
  },
  {
    path: '/article/:id(\\d+)/edit',
    name: 'article-edit',
    component: () => import('../views/ArticleEdit.vue'),
    meta: { title: '编辑文章', requiresAuth: true },
  },
  {
    path: '/categories',
    name: 'categories',
    component: () => import('../views/CategoryAdmin.vue'),
    meta: { title: '板块管理', requiresAuth: true, adminOnly: true },
  },

  { path: '/:pathMatch(.*)*', redirect: '/home' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const token = localStorage.getItem(TOKEN_KEY)

  if (to.meta.requiresAuth && !token) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && token) {
    return { name: 'home' }
  }

  if (!token) return true

  const auth = useAuth()

  // 刷新页面后 store 里没有用户信息,统一在这里补一次
  if (!auth.user.value) {
    try {
      await auth.fetchMe()
    } catch (err) {
      // 只有 401 才算登录态失效;后端未启动等网络错误放行,由页面自己展示错误
      if (err?.status === 401) {
        return { name: 'login', query: { redirect: to.fullPath } }
      }
    }
  }

  if (to.meta.adminOnly && !auth.isAdmin.value) {
    useToast().error('需要管理员权限')
    return { name: 'home' }
  }

  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · 起点社区` : '起点社区 OutsetHub'
})

export default router
