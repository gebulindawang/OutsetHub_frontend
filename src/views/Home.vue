<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { TOKEN_KEY } from '../utils/request'
import { userInfo } from '../api/user'
import { getArticles } from '../api/article'
const user = ref({
  nickname: '',
  username: '',
})
const router = useRouter()
async function getUserInfo() {
  try {
    const res = await userInfo()
    const data = res.data || {}
    user.value = {
      nickname: data.nickname || data.username || '',
      username: data.username || '',
    }
  } catch (e) {
    // 用户信息获取失败不阻塞文章列表
  }
}

const categories = {
  1: { key: 'frontend', name: '前端' },
  2: { key: 'backend', name: '后端' },
  3: { key: 'database', name: '数据库' },
  4: { key: 'algorithm', name: '算法' },
  5: { key: 'chat', name: '闲聊' },
}

const posts = ref([])
const loading = ref(false)
const loadError = ref('')

function toPlainText(markdown) {
  return (markdown || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*`_~\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const diff = Math.max(0, Date.now() - date.getTime())
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 2 * day) return '昨天'
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`

  const now = new Date()
  const md = `${date.getMonth() + 1}-${date.getDate()}`
  return date.getFullYear() === now.getFullYear() ? md : `${date.getFullYear()}-${md}`
}

function normalizeArticle(item) {
  const category = categories[item.CategoryID] || { key: 'other', name: '其他' }
  return {
    id: item.ID,
    title: item.Title,
    excerpt: item.Summary || toPlainText(item.Content),
    board: category.key,
    boardName: category.name,
    author: `用户${item.UserID}`,
    time: formatTime(item.CreatedAt),
    createdAt: item.CreatedAt,
    views: item.ViewCount,
    comments: item.CommentCount,
    likes: item.LikeCount,
  }
}

async function loadArticles() {
  loading.value = true
  loadError.value = ''
  try {
    const result = await getArticles()
    posts.value = (result.data || [])
      .filter((item) => item.Status === 1)
      .map(normalizeArticle)
  } catch (e) {
    loadError.value = e.message || '文章加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getUserInfo()
  loadArticles()
})

const boards = computed(() => {
  const counts = posts.value.reduce((acc, p) => {
    acc[p.board] = (acc[p.board] || 0) + 1
    return acc
  }, {})
  return [
    { key: 'all', name: '全部', count: posts.value.length },
    ...Object.values(categories).map((c) => ({
      key: c.key,
      name: c.name,
      count: counts[c.key] || 0,
    })),
  ]
})
const activeBoard = ref('all')

const sorts = [
  { key: 'recommend', name: '推荐' },
  { key: 'latest', name: '最新' },
  { key: 'hot', name: '热榜' },
]
const activeSort = ref('recommend')

const keyword = ref('')

const filteredPosts = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const list = posts.value.filter((p) => {
    if (activeBoard.value !== 'all' && p.board !== activeBoard.value) return false
    if (!kw) return true
    return (
      p.title.toLowerCase().includes(kw) ||
      p.excerpt.toLowerCase().includes(kw) ||
      p.author.toLowerCase().includes(kw)
    )
  })

  if (activeSort.value === 'latest') {
    return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
  if (activeSort.value === 'hot') {
    return [...list].sort((a, b) => b.views - a.views)
  }
  return list
})

const notices = [
  { id: 1, text: '社区上线内测,欢迎反馈问题', date: '10-27' },
  { id: 2, text: '发帖前请先阅读《社区公约》', date: '10-26' },
  { id: 3, text: '新增「数据库」板块', date: '10-25' },
]

const hotTags = ['Vue3', 'Go', 'Gin', 'MySQL', 'JWT', 'Pinia', '算法', '性能']

function logout() {
  localStorage.removeItem(TOKEN_KEY)
  router.replace('/login')
}

// TODO 发帖页 /write 还没建,建好后改成 router.push('/write')
function goWrite() {}
</script>

<template>
  <div class="page">
    <header class="header">
      <div class="header-inner">
        <div class="brand">
          <span class="logo">起</span>
          <span class="brand-name">起点社区</span>
        </div>

        <div class="search">
          <input v-model="keyword" type="text" placeholder="搜索文章、作者" aria-label="搜索" />
          <button v-if="keyword" class="search-clear" type="button" @click="keyword = ''">
            清除
          </button>
        </div>

        <div class="actions">
          <button class="btn btn-primary" type="button" title="发帖页待建" @click="goWrite">
            写文章
          </button>
          <span class="divider"></span>
          <div class="account">
            <span class="avatar">{{ user.nickname.slice(0, 1) }}</span>
            <span class="account-name">{{ user.nickname }}</span>
            <button class="btn btn-text" type="button" @click="logout">退出</button>
          </div>
        </div>
      </div>
    </header>

    <div class="layout">
      <!-- 左:板块 -->
      <aside class="side">
        <p class="side-title">板块</p>
        <nav class="nav">
          <button
            v-for="b in boards"
            :key="b.key"
            type="button"
            class="nav-item"
            :class="{ active: activeBoard === b.key }"
            @click="activeBoard = b.key"
          >
            <span>{{ b.name }}</span>
            <span class="nav-count">{{ b.count }}</span>
          </button>
        </nav>
      </aside>

      <!-- 中:列表 -->
      <main class="feed">
        <div class="feed-head">
          <div class="tabs">
            <button
              v-for="s in sorts"
              :key="s.key"
              type="button"
              class="tab"
              :class="{ active: activeSort === s.key }"
              @click="activeSort = s.key"
            >
              {{ s.name }}
            </button>
          </div>
          <span class="feed-count">共 {{ filteredPosts.length }} 篇</span>
        </div>

        <div class="list">
          <article v-for="p in filteredPosts" :key="p.id" class="row">
            <h3 class="row-title">{{ p.title }}</h3>
            <p class="row-excerpt">{{ p.excerpt }}</p>
            <div class="row-meta">
              <div class="meta-left">
                <span class="avatar avatar-sm">{{ p.author.slice(0, 1) }}</span>
                <span class="meta-strong">{{ p.author }}</span>
                <span class="board">{{ p.boardName }}</span>
                <span>{{ p.time }}</span>
              </div>
              <div class="meta-right">
                <span>{{ p.views }} 阅读</span>
                <span>{{ p.comments }} 评论</span>
                <span>{{ p.likes }} 赞</span>
              </div>
            </div>
          </article>

          <p v-if="loading" class="empty">加载中...</p>
          <div v-else-if="loadError" class="empty">
            <p>{{ loadError }}</p>
            <button class="retry" type="button" @click="loadArticles">重试</button>
          </div>
          <p v-else-if="!filteredPosts.length" class="empty">没有匹配的文章</p>
        </div>
      </main>

      <!-- 右:公告 / 标签 -->
      <aside class="side side-right">
        <section class="block">
          <p class="side-title">社区公告</p>
          <ul class="notice">
            <li v-for="n in notices" :key="n.id">
              <span class="notice-text">{{ n.text }}</span>
              <span class="notice-date">{{ n.date }}</span>
            </li>
          </ul>
        </section>

        <section class="block">
          <p class="side-title">热门标签</p>
          <div class="chips">
            <button
              v-for="t in hotTags"
              :key="t"
              type="button"
              class="chip"
              @click="keyword = t"
            >
              {{ t }}
            </button>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.page {
  --t1: #1d2129;
  --t2: #4e5969;
  --t3: #86909c;
  --line: #e5e6eb;
  --fill: #f2f3f5;
  --brand: #4f46e5;
  --brand-soft: #eef2ff;

  min-height: 100vh;
  background: #f7f8fa;
  color: var(--t2);
  font-size: 14px;
}

/* ---------- header ---------- */
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  border-bottom: 1px solid var(--line);
}

.header-inner {
  max-width: 1160px;
  margin: 0 auto;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 28px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.logo {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: var(--brand);
}

.brand-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--t1);
  letter-spacing: 0.5px;
}

.search {
  position: relative;
  flex: 1;
  max-width: 360px;
}

.search input {
  width: 100%;
  height: 32px;
  padding: 0 48px 0 12px;
  font-size: 13px;
  color: var(--t1);
  background: var(--fill);
  border: 1px solid transparent;
  border-radius: 6px;
  outline: none;
  transition: background 0.15s, border-color 0.15s;
}

.search input::placeholder {
  color: var(--t3);
}

.search input:focus {
  background: #fff;
  border-color: var(--brand);
}

.search-clear {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  padding: 2px 6px;
  font-size: 12px;
  color: var(--t3);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-clear:hover {
  color: var(--brand);
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.divider {
  width: 1px;
  height: 16px;
  background: var(--line);
}

.account {
  display: flex;
  align-items: center;
  gap: 8px;
}

.account-name {
  font-size: 13px;
  color: var(--t1);
  max-width: 88px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---------- 按钮 ---------- */
.btn {
  height: 30px;
  padding: 0 14px;
  font-size: 13px;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.btn-primary {
  color: #fff;
  background: var(--brand);
}

.btn-primary:hover {
  background: #4338ca;
}

.btn-text {
  padding: 0 8px;
  color: var(--t3);
  background: transparent;
}

.btn-text:hover {
  color: var(--t1);
}

/* ---------- 头像 ---------- */
.avatar {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 500;
  color: var(--t2);
  background: var(--fill);
}

.avatar-sm {
  width: 20px;
  height: 20px;
  font-size: 11px;
}

/* ---------- 布局 ---------- */
.layout {
  max-width: 1160px;
  margin: 0 auto;
  padding: 20px 24px 48px;
  display: grid;
  grid-template-columns: 156px minmax(0, 1fr) 232px;
  gap: 20px;
  align-items: start;
}

.side {
  position: sticky;
  top: 76px;
}

.side-title {
  margin: 0 0 8px;
  padding-left: 10px;
  font-size: 12px;
  font-weight: 400;
  color: var(--t3);
}

/* ---------- 左侧导航 ---------- */
.nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  font-size: 13px;
  color: var(--t2);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: var(--fill);
}

.nav-item.active {
  color: var(--brand);
  font-weight: 500;
  background: var(--brand-soft);
}

.nav-count {
  font-size: 12px;
  color: var(--t3);
}

.nav-item.active .nav-count {
  color: var(--brand);
}

/* ---------- 列表头 ---------- */
.feed-head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  padding-bottom: 1px;
  border-bottom: 1px solid var(--line);
}

.tabs {
  display: flex;
  gap: 20px;
}

.tab {
  position: relative;
  padding: 0 0 9px;
  font-size: 13px;
  color: var(--t3);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s;
}

.tab:hover {
  color: var(--t1);
}

.tab.active {
  color: var(--t1);
  font-weight: 500;
}

.tab.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: var(--brand);
}

.feed-count {
  margin-left: auto;
  padding-bottom: 9px;
  font-size: 12px;
  color: var(--t3);
}

/* ---------- 列表 ---------- */
.list {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
}

.row {
  padding: 18px 20px;
  cursor: default;
  transition: background 0.15s;
}

.row + .row {
  border-top: 1px solid var(--line);
}

.row:hover {
  background: #fafbfc;
}

.row-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--t1);
}

.row-excerpt {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--t3);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.row-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  font-size: 12px;
  color: var(--t3);
}

.meta-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.meta-strong {
  color: var(--t2);
}

.board {
  padding: 0 5px;
  line-height: 18px;
  color: var(--t2);
  background: var(--fill);
  border-radius: 3px;
}

.meta-right {
  display: flex;
  gap: 14px;
  flex-shrink: 0;
}

.empty {
  margin: 0;
  padding: 56px 0;
  text-align: center;
  font-size: 13px;
  color: var(--t3);
}

.empty p {
  margin: 0 0 12px;
}

.retry {
  padding: 5px 14px;
  font-size: 13px;
  color: var(--brand);
  background: var(--brand-soft);
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.retry:hover {
  background: #e0e7ff;
}

/* ---------- 右侧 ---------- */
.side-right {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.block {
  padding-top: 2px;
}

.notice {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notice li {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
  line-height: 1.6;
}

.notice-text {
  flex: 1;
  color: var(--t2);
}

.notice-date {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--t3);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  padding: 3px 9px;
  font-size: 12px;
  color: var(--t2);
  background: var(--fill);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.chip:hover {
  color: var(--brand);
  background: var(--brand-soft);
}

/* ---------- 响应式 ---------- */
@media (max-width: 1024px) {
  .layout {
    grid-template-columns: 140px minmax(0, 1fr);
  }

  .side-right {
    display: none;
  }
}

@media (max-width: 720px) {
  .header-inner {
    height: 52px;
    padding: 0 16px;
    gap: 12px;
  }

  .brand-name,
  .account-name {
    display: none;
  }

  .search {
    max-width: none;
  }

  .layout {
    grid-template-columns: minmax(0, 1fr);
    padding: 16px;
    gap: 16px;
  }

  .side {
    position: static;
  }

  .nav {
    flex-direction: row;
    overflow-x: auto;
    gap: 4px;
  }

  .nav-item {
    white-space: nowrap;
    gap: 6px;
  }

  .row {
    padding: 16px;
  }

  .meta-right {
    display: none;
  }
}
</style>
