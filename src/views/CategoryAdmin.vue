<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppModal from '../components/AppModal.vue'
import EmptyState from '../components/EmptyState.vue'
import {
  createCategory,
  listCategories,
  removeCategory,
  updateCategory,
} from '../api/category'
import { formatDate } from '../utils/format'
import { useAuth } from '../composables/useAuth'
import { useToast } from '../composables/useToast'

const router = useRouter()
const { isAdmin } = useAuth()
const { success, error: toastError } = useToast()

const categories = ref([])
const loading = ref(true)
const loadError = ref('')

const dialogOpen = ref(false)
const editing = ref(null)
const form = ref({ name: '', sort: 0 })
const saving = ref(false)
const formError = ref('')

const deleting = ref(null)
const removing = ref(false)

const dialogTitle = computed(() => (editing.value ? '编辑板块' : '新建板块'))

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await listCategories()
    categories.value = res.data || []
  } catch (err) {
    loadError.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  const maxSort = categories.value.reduce((max, c) => Math.max(max, c.sort || 0), 0)
  form.value = { name: '', sort: maxSort + 10 }
  formError.value = ''
  dialogOpen.value = true
}

function openEdit(category) {
  editing.value = category
  form.value = { name: category.name, sort: category.sort ?? 0 }
  formError.value = ''
  dialogOpen.value = true
}

async function save() {
  formError.value = ''
  const name = form.value.name.trim()
  if (!name) {
    formError.value = '板块名不能为空'
    return
  }
  if (name.length > 50) {
    formError.value = '板块名最长 50 个字符'
    return
  }
  if (saving.value) return

  saving.value = true
  try {
    const payload = { name, sort: Number(form.value.sort) || 0 }
    if (editing.value) {
      await updateCategory(editing.value.id, payload)
      success('已更新')
    } else {
      await createCategory(payload)
      success('已创建')
    }
    dialogOpen.value = false
    await load()
  } catch (err) {
    formError.value = err.message || '保存失败'
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  if (!deleting.value || removing.value) return
  removing.value = true
  try {
    await removeCategory(deleting.value.id)
    success('已删除')
    deleting.value = null
    await load()
  } catch (err) {
    toastError(err.message || '删除失败')
  } finally {
    removing.value = false
  }
}

onMounted(() => {
  if (isAdmin.value) load()
  else loading.value = false
})
</script>

<template>
  <div class="admin">
    <AppHeader />

    <div class="container page-body">
      <div class="head">
        <div>
          <h1>板块管理</h1>
          <p class="hint">sort 越小越靠前,板块名全局唯一</p>
        </div>
        <button v-if="isAdmin" class="btn btn--primary" type="button" @click="openCreate">
          新建板块
        </button>
      </div>

      <div v-if="!isAdmin" class="surface">
        <EmptyState title="需要管理员权限" desc="当前账号的 role 不是 1,无法管理板块">
          <template #action>
            <button class="btn" type="button" @click="router.replace('/home')">回到首页</button>
          </template>
        </EmptyState>
      </div>

      <div v-else-if="loading" class="surface table">
        <div v-for="n in 4" :key="n" class="tr">
          <div class="skeleton" style="width: 120px; height: 14px"></div>
          <div class="skeleton" style="width: 60px; height: 14px"></div>
          <div class="skeleton" style="width: 100px; height: 14px"></div>
        </div>
      </div>

      <div v-else-if="loadError" class="surface">
        <EmptyState title="加载失败" :desc="loadError">
          <template #action>
            <button class="btn" type="button" @click="load">重试</button>
          </template>
        </EmptyState>
      </div>

      <div v-else-if="!categories.length" class="surface">
        <EmptyState title="还没有板块" desc="创建第一个板块,文章才能归类">
          <template #action>
            <button class="btn btn--primary" type="button" @click="openCreate">新建板块</button>
          </template>
        </EmptyState>
      </div>

      <div v-else class="surface table enter-up">
        <div class="tr tr--head">
          <span>板块名</span>
          <span>排序</span>
          <span>创建时间</span>
          <span class="right">操作</span>
        </div>
        <div v-for="(c, i) in categories" :key="c.id" class="tr" :style="{ '--i': i }">
          <span class="cell-name">
            <span class="dot"></span>
            {{ c.name }}
            <span class="muted id">#{{ c.id }}</span>
          </span>
          <span class="mono muted">{{ c.sort }}</span>
          <span class="muted">{{ formatDate(new Date(c.created_at)) }}</span>
          <span class="right actions">
            <button class="btn btn--sm" type="button" @click="openEdit(c)">编辑</button>
            <button class="btn btn--sm btn--danger" type="button" @click="deleting = c">
              删除
            </button>
          </span>
        </div>
      </div>
    </div>

    <AppModal v-model="dialogOpen" :title="dialogTitle">
      <form class="dialog-form" @submit.prevent="save">
        <div class="field">
          <label for="name">板块名</label>
          <input id="name" v-model="form.name" class="input" maxlength="50" placeholder="例如:前端" />
        </div>
        <div class="field">
          <label for="sort">排序权重 <span class="muted">(越小越靠前)</span></label>
          <input id="sort" v-model="form.sort" class="input" type="number" min="0" />
        </div>
        <Transition name="err">
          <p v-if="formError" class="form-error">{{ formError }}</p>
        </Transition>
      </form>

      <template #footer="{ close }">
        <button class="btn" type="button" @click="close">取消</button>
        <button class="btn btn--primary" type="button" :disabled="saving" @click="save">
          {{ saving ? '保存中' : '保存' }}
        </button>
      </template>
    </AppModal>

    <AppModal :model-value="Boolean(deleting)" title="删除板块?" @update:model-value="deleting = null">
      <p class="confirm-text">
        将删除板块「{{ deleting?.name }}」。已归属该板块的文章不会被删除,但分类名会显示为未分类。
      </p>
      <template #footer>
        <button class="btn" type="button" @click="deleting = null">取消</button>
        <button class="btn btn--danger" type="button" :disabled="removing" @click="confirmDelete">
          {{ removing ? '删除中' : '确认删除' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
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

.table {
  overflow: hidden;
}

.tr {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 90px 140px 140px;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  font-size: 13px;
  animation: fadeUp 0.3s var(--ease) both;
  animation-delay: calc(var(--i, 0) * 30ms);
}

.tr + .tr {
  border-top: 1px solid var(--line);
}

.tr--head {
  font-size: 12px;
  color: var(--text-3);
  background: rgba(20, 24, 31, 0.02);
  animation: none;
}

.tr:not(.tr--head):hover {
  background: rgba(255, 255, 255, 0.55);
}

.cell-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: var(--text-1);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand-line);
}

.id {
  font-size: 11px;
}

.right {
  text-align: right;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.confirm-text {
  font-size: 13px;
  line-height: 1.75;
  color: var(--text-2);
}

.err-enter-active,
.err-leave-active {
  transition: opacity 0.18s var(--ease);
}

.err-enter-from,
.err-leave-to {
  opacity: 0;
}

@media (max-width: 720px) {
  .tr {
    grid-template-columns: minmax(0, 1fr) 60px 110px;
  }

  .tr > :nth-child(3) {
    display: none;
  }
}
</style>
