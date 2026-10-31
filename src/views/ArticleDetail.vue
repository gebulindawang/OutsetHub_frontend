<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppModal from '../components/AppModal.vue'
import EmptyState from '../components/EmptyState.vue'
import { getArticle, removeArticle } from '../api/article'
import { listCategories } from '../api/category'
import { formatCount, formatDate, formatTime, renderMarkdown } from '../utils/format'
import { useAuth } from '../composables/useAuth'
import { useToast } from '../composables/useToast'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { success, error: toastError } = useToast()

const article = ref(null)
const categories = ref([])
const loading = ref(true)
const loadError = ref('')
const removing = ref(false)
const confirmOpen = ref(false)

const isAuthor = computed(
  () => Boolean(article.value && user.value && article.value.user_id === user.value.id),
)

const categoryName = computed(() => {
  if (!article.value) return ''
  const hit = categories.value.find((c) => c.id === article.value.category_id)
  return hit?.name || '未分类'
})

const html = computed(() => renderMarkdown(article.value?.content || ''))
const isDraft = computed(() => article.value?.status === 0)
const isRemoved = computed(() => article.value?.status === 2)

async function load() {
  const id = Number(route.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    loadError.value = '无效的文章 ID'
    loading.value = false
    return
  }

  loading.value = true
  loadError.value = ''
  try {
    const [articleRes, categoryRes] = await Promise.all([
      getArticle(id),
      listCategories().catch(() => ({ data: [] })),
    ])
    article.value = articleRes.data
    categories.value = categoryRes.data || []
  } catch (err) {
    loadError.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function confirmRemove() {
  if (removing.value) return
  removing.value = true
  try {
    await removeArticle(article.value.id)
    confirmOpen.value = false
    success('已删除')
    router.replace('/home')
  } catch (err) {
    toastError(err.message || '删除失败')
  } finally {
    removing.value = false
  }
}

onMounted(load)
watch(() => route.params.id, load)
</script>

<template>
  <div class="detail">
    <AppHeader />

    <div class="container page-body">
      <div class="back-wrap">
        <button class="back" type="button" @click="router.back()">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M8.5 3L4.5 7l4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          返回
        </button>
      </div>

      <!-- 骨架 -->
      <div v-if="loading" class="surface article">
        <div class="skeleton" style="width: 70%; height: 24px"></div>
        <div class="skeleton" style="width: 240px; height: 12px; margin-top: 16px"></div>
        <div class="skeleton" style="width: 100%; height: 12px; margin-top: 32px"></div>
        <div class="skeleton" style="width: 96%; height: 12px; margin-top: 10px"></div>
        <div class="skeleton" style="width: 88%; height: 12px; margin-top: 10px"></div>
      </div>

      <!-- 失败 / 已删除 -->
      <div v-else-if="loadError || isRemoved" class="surface">
        <EmptyState
          :title="isRemoved ? '这篇文章已被删除' : '文章打不开'"
          :desc="isRemoved ? '作者已将它移入回收站' : loadError"
        >
          <template #action>
            <button class="btn" type="button" @click="router.replace('/home')">回到首页</button>
          </template>
        </EmptyState>
      </div>

      <article v-else class="surface article enter-up">
        <span v-if="isDraft" class="chip chip--warn draft-flag">草稿 · 仅自己可见</span>

        <h1 class="title">{{ article.title }}</h1>

        <div class="meta">
          <span class="chip chip--brand">{{ categoryName }}</span>
          <span class="muted">作者 #{{ article.user_id }}</span>
          <span class="muted dot-sep">{{ formatTime(article.created_at) }}</span>
          <span class="muted dot-sep">{{ formatCount(article.view_count) }} 阅读</span>
          <span class="muted dot-sep">{{ formatCount(article.like_count) }} 赞</span>
        </div>

        <p v-if="article.summary" class="summary">{{ article.summary }}</p>

        <div class="content" v-html="html"></div>

        <footer class="foot">
          <div class="foot-times">
            <span>发布于 {{ formatDate(new Date(article.created_at), true) }}</span>
            <span v-if="article.updated_at !== article.created_at" class="muted dot-sep">
              编辑于 {{ formatDate(new Date(article.updated_at), true) }}
            </span>
          </div>

          <div v-if="isAuthor" class="foot-actions">
            <button class="btn btn--sm" type="button" @click="router.push(`/article/${article.id}/edit`)">
              编辑
            </button>
            <button class="btn btn--sm btn--danger" type="button" @click="confirmOpen = true">
              删除
            </button>
          </div>
        </footer>
      </article>
    </div>

    <AppModal v-model="confirmOpen" title="删除这篇文章?">
      <p class="confirm-text">
        删除后文章会移入回收站(status 置 2),不会立刻从数据库消失,但其他人将无法访问。
      </p>
      <template #footer="{ close }">
        <button class="btn" type="button" @click="close">取消</button>
        <button class="btn btn--danger" type="button" :disabled="removing" @click="confirmRemove">
          {{ removing ? '删除中' : '确认删除' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.back-wrap {
  max-width: 780px;
  margin: 0 auto 10px;
}

.back {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px 4px 5px;
  font-size: 13px;
  color: var(--text-3);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.15s var(--ease), background-color 0.15s var(--ease);
}

.back:hover {
  color: var(--text-1);
  background: rgba(20, 24, 31, 0.05);
}

.article {
  max-width: 780px;
  margin: 0 auto;
  padding: 40px 48px 28px;
}

.draft-flag {
  margin-bottom: 14px;
}

.title {
  font-size: 26px;
  font-weight: 650;
  line-height: 1.4;
  letter-spacing: -0.3px;
  color: var(--text-1);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  font-size: 12px;
}

.summary {
  margin-top: 22px;
  padding: 14px 16px;
  font-size: 13px;
  line-height: 1.75;
  color: var(--text-2);
  background: rgba(20, 24, 31, 0.03);
  border-left: 2px solid var(--brand-line);
  border-radius: 0 8px 8px 0;
}

/* Markdown 正文 */
.content {
  margin-top: 26px;
  font-size: 15px;
  line-height: 1.85;
  color: var(--text-2);
}

.content :deep(.md-p) {
  margin: 0 0 16px;
}

.content :deep(.md-h) {
  margin: 30px 0 14px;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--text-1);
}

.content :deep(.md-h:first-child) {
  margin-top: 0;
}

.content :deep(.md-list) {
  margin: 0 0 16px;
  padding-left: 22px;
}

.content :deep(.md-list li) {
  margin-bottom: 6px;
}

.content :deep(.md-quote) {
  margin: 0 0 16px;
  padding: 10px 16px;
  color: var(--text-2);
  background: rgba(20, 24, 31, 0.03);
  border-left: 2px solid var(--line-strong);
}

.content :deep(.md-code) {
  padding: 1px 5px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.9em;
  color: #b4315a;
  background: rgba(20, 24, 31, 0.05);
  border-radius: 4px;
}

.content :deep(.md-pre) {
  margin: 0 0 18px;
  padding: 14px 16px;
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.7;
  color: #e6e8ec;
  background: #1c2027;
  border-radius: 10px;
}

.content :deep(.md-pre code) {
  font-family: inherit;
}

.content :deep(.md-link) {
  color: var(--brand);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 36px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  font-size: 12px;
  color: var(--text-3);
}

.foot-times {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
}

.foot-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.confirm-text {
  font-size: 13px;
  line-height: 1.75;
  color: var(--text-2);
}

@media (max-width: 640px) {
  .article {
    padding: 26px 20px 22px;
  }

  .title {
    font-size: 21px;
  }

  .foot {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
