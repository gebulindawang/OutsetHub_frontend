<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import EmptyState from '../components/EmptyState.vue'
import { createArticle, getArticle, updateArticle } from '../api/article'
import { listCategories } from '../api/category'
import { renderMarkdown } from '../utils/format'
import { useAuth } from '../composables/useAuth'
import { useToast } from '../composables/useToast'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { success, error: toastError } = useToast()

const isEdit = computed(() => Boolean(route.params.id))
const articleId = computed(() => Number(route.params.id))

const categories = ref([])
const loading = ref(true)
const loadError = ref('')
const submitting = ref('')
const tab = ref('write')
const dirty = ref(false)

const form = ref({
  title: '',
  category_id: '',
  summary: '',
  content: '',
})
const currentStatus = ref(1)

const previewHtml = computed(() => renderMarkdown(form.value.content || ''))
const wordCount = computed(() => (form.value.content || '').replace(/\s/g, '').length)
const canSubmit = computed(
  () => Boolean(form.value.title.trim() && form.value.content.trim() && form.value.category_id),
)

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const categoryRes = await listCategories()
    categories.value = categoryRes.data || []
    if (!isEdit.value) {
      if (categories.value.length) form.value.category_id = categories.value[0].id
      return
    }

    const articleRes = await getArticle(articleId.value)
    const data = articleRes.data
    if (!user.value || data.user_id !== user.value.id) {
      loadError.value = '只能编辑自己发布的文章'
      return
    }
    form.value = {
      title: data.title || '',
      category_id: data.category_id || '',
      summary: data.summary || '',
      content: data.content || '',
    }
    currentStatus.value = data.status ?? 1
  } catch (err) {
    loadError.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function touch() {
  dirty.value = true
}

async function submit(status) {
  if (submitting.value) return
  if (!form.value.title.trim()) {
    toastError('标题不能为空')
    return
  }
  if (!form.value.category_id) {
    toastError('请选择板块')
    return
  }
  if (!form.value.content.trim()) {
    toastError('正文不能为空')
    return
  }

  submitting.value = status === 0 ? 'draft' : 'publish'
  const payload = {
    title: form.value.title.trim(),
    summary: form.value.summary.trim(),
    content: form.value.content,
    category_id: Number(form.value.category_id),
    status,
  }

  try {
    if (isEdit.value) {
      await updateArticle(articleId.value, payload)
      dirty.value = false
      success(status === 0 ? '草稿已保存' : '已更新')
      router.replace(`/article/${articleId.value}`)
    } else {
      await createArticle(payload)
      dirty.value = false
      success(status === 0 ? '草稿已保存' : '发布成功')
      // 创建接口不返回新文章 ID,先回首页
      router.replace('/home')
    }
  } catch (err) {
    toastError(err.message || '提交失败')
  } finally {
    submitting.value = ''
  }
}

function onKeydown(event) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    if (!loading.value) submit(currentStatus.value === 0 ? 0 : 1)
  }
}

onMounted(() => {
  load()
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

watch(
  () => route.params.id,
  () => load(),
)

onBeforeRouteLeave(() => {
  if (!dirty.value) return true
  return window.confirm('有未保存的修改,确定离开吗?')
})
</script>

<template>
  <div class="editor">
    <AppHeader />

    <div class="container page-body">
      <div class="head">
        <div>
          <h1>{{ isEdit ? '编辑文章' : '写文章' }}</h1>
          <p class="hint">
            支持 Markdown:标题、粗体、行内代码、代码块、引用、列表、链接
          </p>
        </div>
        <div class="head-actions">
          <button
            class="btn"
            type="button"
            :disabled="Boolean(submitting)"
            @click="submit(0)"
          >
            {{ submitting === 'draft' ? '保存中' : '存草稿' }}
          </button>
          <button
            class="btn btn--primary"
            type="button"
            :disabled="Boolean(submitting)"
            @click="submit(1)"
          >
            {{ submitting === 'publish' ? '发布中' : isEdit ? '保存并发布' : '发布' }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="surface panel">
        <div class="skeleton" style="width: 100%; height: 40px"></div>
        <div class="skeleton" style="width: 100%; height: 260px; margin-top: 16px"></div>
      </div>

      <div v-else-if="loadError" class="surface">
        <EmptyState title="无法打开编辑器" :desc="loadError">
          <template #action>
            <button class="btn" type="button" @click="router.replace('/home')">回到首页</button>
          </template>
        </EmptyState>
      </div>

      <form v-else class="surface panel enter-up" @submit.prevent="submit(1)">
        <div class="field">
          <label for="title">标题</label>
          <input
            id="title"
            v-model="form.title"
            class="input title-input"
            type="text"
            maxlength="200"
            placeholder="一句话说清你要聊什么"
            @input="touch"
          />
          <p class="hint counter">{{ form.title.length }} / 200</p>
        </div>

        <div class="row-2">
          <div class="field">
            <label for="category">板块</label>
            <select id="category" v-model="form.category_id" class="select" @change="touch">
              <option v-if="!categories.length" :value="''" disabled>暂无板块,请先让管理员创建</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div class="field">
            <label for="summary">摘要 <span class="muted">(可选)</span></label>
            <input
              id="summary"
              v-model="form.summary"
              class="input"
              type="text"
              maxlength="300"
              placeholder="列表页展示的一两句话"
              @input="touch"
            />
          </div>
        </div>

        <div class="field">
          <div class="content-head">
            <label for="content">正文</label>
            <div class="switch">
              <button
                type="button"
                class="switch-btn"
                :class="{ active: tab === 'write' }"
                @click="tab = 'write'"
              >
                编写
              </button>
              <button
                type="button"
                class="switch-btn"
                :class="{ active: tab === 'preview' }"
                @click="tab = 'preview'"
              >
                预览
              </button>
            </div>
          </div>

          <textarea
            v-if="tab === 'write'"
            id="content"
            v-model="form.content"
            class="textarea"
            rows="16"
            placeholder="正文支持 Markdown,例如 ## 小节标题、**加粗**、`code`"
            @input="touch"
          ></textarea>

          <div v-else class="preview">
            <div v-if="!form.content.trim()" class="preview-empty">还没有内容</div>
            <div v-else class="md" v-html="previewHtml"></div>
          </div>

          <div class="content-foot">
            <span class="hint">{{ wordCount }} 字</span>
            <span class="hint">Ctrl / Cmd + S 快速保存</span>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  max-width: 820px;
  margin: 0 auto 16px;
}

.head h1 {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.2px;
  color: var(--text-1);
}

.head .hint {
  margin-top: 6px;
}

.head-actions {
  display: flex;
  gap: 8px;
}

.panel {
  max-width: 820px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.title-input {
  height: 42px;
  font-size: 15px;
}

.counter {
  align-self: flex-end;
  font-variant-numeric: tabular-nums;
}

.row-2 {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: 16px;
}

.content-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.switch {
  display: inline-flex;
  padding: 2px;
  background: rgba(20, 24, 31, 0.05);
  border-radius: 8px;
}

.switch-btn {
  padding: 4px 12px;
  font-size: 12px;
  color: var(--text-3);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.16s var(--ease), color 0.16s var(--ease),
    box-shadow 0.16s var(--ease);
}

.switch-btn.active {
  color: var(--text-1);
  background: #fff;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.08);
}

.preview {
  min-height: 340px;
  padding: 18px 20px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
}

.preview-empty {
  font-size: 13px;
  color: var(--text-3);
}

.content-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 预览区 Markdown 样式 */
.md {
  font-size: 15px;
  line-height: 1.85;
  color: var(--text-2);
}

.md :deep(.md-p) {
  margin: 0 0 14px;
}

.md :deep(.md-h) {
  margin: 24px 0 12px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-1);
}

.md :deep(.md-h:first-child) {
  margin-top: 0;
}

.md :deep(.md-list) {
  margin: 0 0 14px;
  padding-left: 22px;
}

.md :deep(.md-quote) {
  margin: 0 0 14px;
  padding: 8px 14px;
  background: rgba(20, 24, 31, 0.03);
  border-left: 2px solid var(--line-strong);
}

.md :deep(.md-code) {
  padding: 1px 5px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.9em;
  color: #b4315a;
  background: rgba(20, 24, 31, 0.05);
  border-radius: 4px;
}

.md :deep(.md-pre) {
  margin: 0 0 14px;
  padding: 12px 14px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.7;
  color: #e6e8ec;
  background: #1c2027;
  border-radius: 10px;
}

.md :deep(.md-link) {
  color: var(--brand);
  text-decoration: underline;
  text-underline-offset: 2px;
}

@media (max-width: 720px) {
  .head {
    flex-direction: column;
    align-items: flex-start;
  }

  .row-2 {
    grid-template-columns: minmax(0, 1fr);
  }

  .panel {
    padding: 18px;
  }
}
</style>
