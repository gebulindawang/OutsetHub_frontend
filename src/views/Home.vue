<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import EmptyState from '../components/EmptyState.vue'
import { listArticles } from '../api/article'
import { listCategories } from '../api/category'
import { formatCount, formatTime } from '../utils/format'
import { useToast } from '../composables/useToast'

const router = useRouter()
const { error: toastError } = useToast()

const articles = ref([])
const categories = ref([])
const loading = ref(true)
const loadError = ref('')

const activeCategory = ref(0)
const keyword = ref('')
const sortKey = ref('latest')

const sorts = [
  { key: 'latest', label: '最新' },
  { key: 'discussed', label: '热议' },
  { key: 'hot', label: '热榜' },
]

const categoryName = computed(() => {
  const map = {}
  for (const c of categories.value) map[c.id] = c.name
  return map
})

/** 板块侧栏:全部 + 各板块文章数(后端暂无按板块统计的接口,这里按已加载列表统计) */
const boards = computed(() => {
  const counts = {}
  for (const a of articles.value) {
    counts[a.category_id] = (counts[a.category_id] || 0) + 1
  }
  return [
    { id: 0, name: '全部', count: articles.value.length },
    ...categories.value.map((c) => ({ id: c.id, name: c.name, count: counts[c.id] || 0 })),
  ]
})

const visibleArticles = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  let list = articles.value

  if (activeCategory.value) {
    list = list.filter((a) => a.category_id === activeCategory.value)
  }

  if (kw) {
    list = list.filter((a) =>
      [a.title, a.summary, a.content].some((field) => (field || '').toLowerCase().includes(kw)),
    )
  }

  const sorted = [...list]
  if (sortKey.value === 'hot') {
    sorted.sort((a, b) => b.view_count - a.view_count)
  } else if (sortKey.value === 'discussed') {
    sorted.sort((a, b) => b.comment_count + b.like_count - (a.comment_count + a.like_count))
  }
  return sorted
})

const stats = computed(() => ({
  total: articles.value.length,
  boards: categories.value.length,
  views: articles.value.reduce((sum, a) => sum + (a.view_count || 0), 0),
}))

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const [articleRes, categoryRes] = await Promise.all([listArticles(), listCategories()])
    articles.value = articleRes.data || []
    categories.value = categoryRes.data || []
  } catch (err) {
    loadError.value = err.message || '加载失败'
    toastError(loadError.value)
  } finally {
    loading.value = false
  }
}

function openArticle(id) {
  router.push(`/article/${id}`)
}

onMounted(load)
</script>

<template>
  <div class="home">
    <AppHeader />

    <div class="container page-body">
      <div class="layout">
        <!-- 板块 -->
        <aside class="side">
          <div class="surface side-card">
            <p class="side-title">板块</p>
            <button
              v-for="board in boards"
              :key="board.id"
              type="button"
              class="board"
              :class="{ active: activeCategory === board.id }"
              @click="activeCategory = board.id"
            >
              <span class="board-name">{{ board.name }}</span>
              <span class="board-count">{{ board.count }}</span>
            </button>
          </div>

          <div class="surface side-card">
            <p class="side-title">社区公约</p>
            <ul class="rules">
              <li>提问前先搜索</li>
              <li>代码用代码块包好</li>
              <li>就事论事,不针对人</li>
            </ul>
          </div>
        </aside>

        <!-- 列表 -->
        <main class="feed">
          <div class="feed-head">
            <div class="tabs" role="tablist">
              <button
                v-for="s in sorts"
                :key="s.key"
                type="button"
                class="tab"
                :class="{ active: sortKey === s.key }"
                @click="sortKey = s.key"
              >
                {{ s.label }}
              </button>
            </div>

            <label class="search">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="4.4" stroke="currentColor" stroke-width="1.4" />
                <path
                  d="M10.5 10.5L14 14"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round"
                />
              </svg>
              <input v-model="keyword" type="search" placeholder="搜索标题或正文" />
              <button v-if="keyword" class="clear" type="button" aria-label="清空" @click="keyword = ''">
                ×
              </button>
            </label>
          </div>

          <!-- 骨架 -->
          <div v-if="loading" class="surface list">
            <div v-for="n in 4" :key="n" class="row row--skeleton">
              <div class="skeleton" style="width: 62%; height: 16px"></div>
              <div class="skeleton" style="width: 100%; height: 12px; margin-top: 12px"></div>
              <div class="skeleton" style="width: 84%; height: 12px; margin-top: 8px"></div>
              <div class="skeleton" style="width: 180px; height: 12px; margin-top: 16px"></div>
            </div>
          </div>

          <!-- 失败 -->
          <div v-else-if="loadError" class="surface">
            <EmptyState title="列表加载失败" :desc="loadError">
              <template #action>
                <button class="btn" type="button" @click="load">重新加载</button>
              </template>
            </EmptyState>
          </div>

          <!-- 空 -->
          <div v-else-if="!visibleArticles.length" class="surface">
            <EmptyState
              :title="keyword ? '没有匹配的文章' : '这个板块还很安静'"
              :desc="keyword ? '换个关键词试试,或者清空搜索' : '不如由你来写下第一篇'"
            >
              <template #action>
                <button v-if="keyword" class="btn" type="button" @click="keyword = ''">
                  清空搜索
                </button>
                <button
                  v-else
                  class="btn btn--primary"
                  type="button"
                  @click="router.push('/article/new')"
                >
                  写文章
                </button>
              </template>
            </EmptyState>
          </div>

          <!-- 列表 -->
          <div v-else class="surface list">
            <article
              v-for="(article, index) in visibleArticles"
              :key="article.id"
              class="row enter-up"
              :style="{ '--i': index }"
              tabindex="0"
              @click="openArticle(article.id)"
              @keydown.enter="openArticle(article.id)"
            >
              <h2 class="row-title">{{ article.title }}</h2>
              <p class="row-summary">{{ article.summary || article.content }}</p>

              <div class="row-meta">
                <div class="meta-left">
                  <span class="chip chip--brand">
                    {{ categoryName[article.category_id] || '未分类' }}
                  </span>
                  <!-- 列表接口未 join user 表,这里只能显示作者 ID -->
                  <span class="muted">作者 #{{ article.user_id }}</span>
                  <span class="muted dot-sep">{{ formatTime(article.created_at) }}</span>
                </div>
                <div class="meta-right">
                  <span>{{ formatCount(article.view_count) }} 阅读</span>
                  <span>{{ formatCount(article.comment_count) }} 评论</span>
                  <span>{{ formatCount(article.like_count) }} 赞</span>
                </div>
              </div>
            </article>
          </div>
        </main>

        <!-- 右栏 -->
        <aside class="side">
          <div class="surface side-card">
            <p class="side-title">概览</p>
            <dl class="stats">
              <div>
                <dt>已发布</dt>
                <dd>{{ stats.total }}</dd>
              </div>
              <div>
                <dt>板块</dt>
                <dd>{{ stats.boards }}</dd>
              </div>
              <div>
                <dt>总阅读</dt>
                <dd>{{ formatCount(stats.views) }}</dd>
              </div>
            </dl>
            <p class="stats-note">列表接口固定返回最新 10 篇</p>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 196px minmax(0, 1fr) 208px;
  gap: 20px;
  align-items: start;
}

.side {
  position: sticky;
  top: calc(var(--header-h) + 20px);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.side-card {
  padding: 14px;
}

.side-title {
  margin-bottom: 8px;
  padding-left: 6px;
  font-size: 12px;
  color: var(--text-3);
}

/* 板块 */
.board {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 7px 9px;
  font-size: 13px;
  color: var(--text-2);
  background: transparent;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  transition: background-color 0.15s var(--ease), color 0.15s var(--ease),
    transform 0.12s var(--ease);
}

.board:hover {
  background: rgba(20, 24, 31, 0.045);
  color: var(--text-1);
}

.board:active {
  transform: scale(0.99);
}

.board.active {
  color: var(--brand);
  font-weight: 500;
  background: var(--brand-soft);
}

.board-count {
  font-size: 12px;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
}

.board.active .board-count {
  color: var(--brand);
}

.rules {
  margin: 0;
  padding: 0 0 0 14px;
  font-size: 12px;
  line-height: 1.8;
  color: var(--text-3);
}

/* 列表头 */
.feed-head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.tabs {
  display: flex;
  gap: 18px;
}

.tab {
  position: relative;
  padding: 4px 0 9px;
  font-size: 13px;
  color: var(--text-3);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s var(--ease);
}

.tab:hover {
  color: var(--text-1);
}

.tab.active {
  color: var(--text-1);
  font-weight: 500;
}

.tab.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: var(--brand);
  border-radius: 2px;
  animation: growIn 0.24s var(--ease);
}

@keyframes growIn {
  from {
    transform: scaleX(0.4);
    opacity: 0;
  }
  to {
    transform: none;
    opacity: 1;
  }
}

.search {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  width: 220px;
  height: 32px;
  padding: 0 10px;
  color: var(--text-3);
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--line);
  border-radius: 8px;
  transition: border-color 0.16s var(--ease), box-shadow 0.16s var(--ease),
    background-color 0.16s var(--ease);
}

.search:focus-within {
  background: #fff;
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.search input {
  width: 100%;
  font-size: 13px;
  color: var(--text-1);
  background: transparent;
  border: none;
  outline: none;
}

.search input::placeholder {
  color: var(--text-3);
}

.search input::-webkit-search-cancel-button {
  display: none;
}

.clear {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  font-size: 15px;
  line-height: 1;
  color: var(--text-3);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.clear:hover {
  color: var(--text-1);
  background: rgba(20, 24, 31, 0.06);
}

/* 列表 */
.list {
  overflow: hidden;
}

.row {
  padding: 18px 20px;
  cursor: pointer;
  transition: background-color 0.16s var(--ease);
}

.row + .row {
  border-top: 1px solid var(--line);
}

.row:hover {
  background: rgba(255, 255, 255, 0.55);
}

.row:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: -2px;
}

.row-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--text-1);
  transition: color 0.15s var(--ease);
}

.row:hover .row-title {
  color: var(--brand);
}

.row-summary {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-3);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.row-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-3);
}

.meta-left {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.meta-right {
  display: flex;
  gap: 14px;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.row--skeleton {
  cursor: default;
}

.row--skeleton:hover {
  background: transparent;
}

/* 概览 */
.stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
}

.stats > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.stats dt {
  font-size: 12px;
  color: var(--text-3);
}

.stats dd {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-1);
  font-variant-numeric: tabular-nums;
}

.stats-note {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
  font-size: 11px;
  line-height: 1.6;
  color: var(--text-3);
}

@media (max-width: 1024px) {
  .layout {
    grid-template-columns: 156px minmax(0, 1fr);
  }

  .side:last-child {
    display: none;
  }
}

@media (max-width: 720px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
  }

  .side {
    position: static;
  }

  .side-card:first-child {
    display: flex;
    gap: 4px;
    overflow-x: auto;
    padding: 10px;
  }

  .side-title,
  .side > .surface:nth-child(2) {
    display: none;
  }

  .board {
    width: auto;
    gap: 6px;
    white-space: nowrap;
  }

  .search {
    width: 150px;
  }

  .meta-right {
    display: none;
  }
}
</style>
