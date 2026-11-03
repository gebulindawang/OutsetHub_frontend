<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AppModal from './AppModal.vue'
import EmptyState from './EmptyState.vue'
import { createComment, listComments, removeComment } from '../api/comment'
import { formatTime } from '../utils/format'
import { useAuth } from '../composables/useAuth'
import { useToast } from '../composables/useToast'

const props = defineProps({
  articleId: { type: Number, required: true },
})

const { user } = useAuth()
const { success, error: toastError } = useToast()

const comments = ref([])
const loading = ref(true)
const loadError = ref('')

const newContent = ref('')
const posting = ref(false)

const replyTarget = ref(null)
const replyContent = ref('')
const replying = ref(false)

const deleting = ref(null)
const removing = ref(false)

const meId = computed(() => user.value?.id)

/** 组装两级结构:顶级评论 + 挂在它下面的回复 */
const tree = computed(() => {
  const tops = []
  const childrenMap = new Map()

  for (const item of comments.value) {
    if (!item.parent_id) {
      tops.push({ ...item, replies: [] })
    } else {
      if (!childrenMap.has(item.parent_id)) childrenMap.set(item.parent_id, [])
      childrenMap.get(item.parent_id).push(item)
    }
  }

  for (const top of tops) {
    top.replies = childrenMap.get(top.id) || []
  }
  return tops
})

const canPost = computed(() => newContent.value.trim().length > 0 && !posting.value)
const canReply = computed(() => replyContent.value.trim().length > 0 && !replying.value)

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await listComments(props.articleId)
    comments.value = res.data || []
  } catch (err) {
    loadError.value = err.message || '评论加载失败'
  } finally {
    loading.value = false
  }
}

async function submitNew() {
  if (!canPost.value) return
  posting.value = true
  try {
    await createComment({
      article_id: props.articleId,
      parent_id: 0,
      reply_to_user_id: 0,
      content: newContent.value.trim(),
    })
    newContent.value = ''
    success('评论已发布')
    await load()
  } catch (err) {
    toastError(err.message || '发布失败')
  } finally {
    posting.value = false
  }
}

function toggleReply(comment) {
  if (replyTarget.value?.id === comment.id) {
    replyTarget.value = null
    replyContent.value = ''
    return
  }
  replyTarget.value = comment
  replyContent.value = ''
}

async function submitReply() {
  if (!canReply.value || !replyTarget.value) return
  const target = replyTarget.value
  replying.value = true
  try {
    await createComment({
      article_id: props.articleId,
      // 回复楼中楼时,parent_id 仍然指向顶级评论,保持两级结构
      parent_id: target.parent_id || target.id,
      reply_to_user_id: target.user_id,
      content: replyContent.value.trim(),
    })
    replyTarget.value = null
    replyContent.value = ''
    success('回复已发布')
    await load()
  } catch (err) {
    toastError(err.message || '回复失败')
  } finally {
    replying.value = false
  }
}

async function confirmDelete() {
  if (!deleting.value || removing.value) return
  removing.value = true
  try {
    await removeComment(deleting.value.id)
    success('评论已删除')
    deleting.value = null
    await load()
  } catch (err) {
    toastError(err.message || '删除失败')
  } finally {
    removing.value = false
  }
}

/** 后端不返回评论人昵称,头像位置用两位 user_id 占位 */
function initial(userId) {
  return String(userId % 100).padStart(2, '0')
}

onMounted(load)
watch(() => props.articleId, load)
</script>

<template>
  <section class="surface comments">
    <header class="head">
      <h3>评论</h3>
      <span class="count">{{ comments.length }}</span>
    </header>

    <!-- 发表 -->
    <div class="composer">
      <textarea
        v-model="newContent"
        class="textarea"
        rows="3"
        maxlength="500"
        placeholder="写下你的看法,支持纯文本,最长 500 字"
        :disabled="posting"
      ></textarea>
      <div class="composer-foot">
        <span class="hint">{{ newContent.length }} / 500</span>
        <button
          class="btn btn--primary btn--sm"
          type="button"
          :disabled="!canPost"
          @click="submitNew"
        >
          {{ posting ? '发布中' : '发布' }}
        </button>
      </div>
    </div>

    <!-- 骨架 -->
    <div v-if="loading" class="list">
      <div v-for="n in 2" :key="n" class="item">
        <div class="skeleton" style="width: 28px; height: 28px; border-radius: 50%"></div>
        <div class="body">
          <div class="skeleton" style="width: 120px; height: 12px"></div>
          <div class="skeleton" style="width: 80%; height: 12px; margin-top: 10px"></div>
        </div>
      </div>
    </div>

    <div v-else-if="loadError" class="state">
      <EmptyState title="评论加载失败" :desc="loadError">
        <template #action>
          <button class="btn btn--sm" type="button" @click="load">重试</button>
        </template>
      </EmptyState>
    </div>

    <EmptyState v-else-if="!tree.length" title="还没有评论" desc="第一个说话的人,总是被记住" />

    <!-- 列表 -->
    <ul v-else class="list">
      <li v-for="(item, index) in tree" :key="item.id" class="item enter-up" :style="{ '--i': index }">
        <span class="avatar">{{ initial(item.user_id) }}</span>

        <div class="body">
          <div class="meta">
            <span class="name">用户 #{{ item.user_id }}</span>
            <span v-if="item.user_id === meId" class="chip chip--brand me">我</span>
            <span class="time">{{ formatTime(item.created_at) }}</span>
          </div>

          <p class="content">{{ item.content }}</p>

          <div class="ops">
            <button class="op" type="button" @click="toggleReply(item)">
              {{ replyTarget?.id === item.id ? '取消' : '回复' }}
            </button>
            <button
              v-if="item.user_id === meId"
              class="op op--danger"
              type="button"
              @click="deleting = item"
            >
              删除
            </button>
          </div>

          <!-- 回复输入框 -->
          <div v-if="replyTarget?.id === item.id" class="reply-box">
            <textarea
              v-model="replyContent"
              class="textarea"
              rows="2"
              maxlength="500"
              :placeholder="`回复 用户 #${item.user_id}`"
              :disabled="replying"
            ></textarea>
            <div class="reply-foot">
              <button class="btn btn--sm" type="button" @click="toggleReply(item)">取消</button>
              <button
                class="btn btn--primary btn--sm"
                type="button"
                :disabled="!canReply"
                @click="submitReply"
              >
                {{ replying ? '提交中' : '回复' }}
              </button>
            </div>
          </div>

          <!-- 楼中楼 -->
          <ul v-if="item.replies.length" class="replies">
            <li v-for="reply in item.replies" :key="reply.id" class="reply">
              <div class="meta">
                <span class="name">用户 #{{ reply.user_id }}</span>
                <span v-if="reply.user_id === meId" class="chip chip--brand me">我</span>
                <template v-if="reply.reply_to_user_id">
                  <span class="arrow">回复</span>
                  <span class="name">用户 #{{ reply.reply_to_user_id }}</span>
                </template>
                <span class="time">{{ formatTime(reply.created_at) }}</span>
              </div>

              <p class="content">{{ reply.content }}</p>

              <div class="ops">
                <button class="op" type="button" @click="toggleReply(reply)">
                  {{ replyTarget?.id === reply.id ? '取消' : '回复' }}
                </button>
                <button
                  v-if="reply.user_id === meId"
                  class="op op--danger"
                  type="button"
                  @click="deleting = reply"
                >
                  删除
                </button>
              </div>

              <div v-if="replyTarget?.id === reply.id" class="reply-box">
                <textarea
                  v-model="replyContent"
                  class="textarea"
                  rows="2"
                  maxlength="500"
                  :placeholder="`回复 用户 #${reply.user_id}`"
                  :disabled="replying"
                ></textarea>
                <div class="reply-foot">
                  <button class="btn btn--sm" type="button" @click="toggleReply(reply)">取消</button>
                  <button
                    class="btn btn--primary btn--sm"
                    type="button"
                    :disabled="!canReply"
                    @click="submitReply"
                  >
                    {{ replying ? '提交中' : '回复' }}
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </li>
    </ul>

    <AppModal :model-value="Boolean(deleting)" title="删除这条评论?" @update:model-value="deleting = null">
      <p class="confirm-text">
        删除后 status 会置为 2,评论区不再展示,数据库记录保留。删除后无法自行恢复。
      </p>
      <template #footer>
        <button class="btn" type="button" @click="deleting = null">取消</button>
        <button class="btn btn--danger" type="button" :disabled="removing" @click="confirmDelete">
          {{ removing ? '删除中' : '确认删除' }}
        </button>
      </template>
    </AppModal>
  </section>
</template>

<style scoped>
.comments {
  padding: 24px;
}

.head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
}

.head h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1);
}

.count {
  font-size: 12px;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
}

/* 发表框 */
.composer {
  padding: 12px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  transition: border-color 0.16s var(--ease), box-shadow 0.16s var(--ease);
}

.composer:focus-within {
  border-color: var(--brand-line);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.08);
}

.composer .textarea {
  background: transparent;
  border: none;
  padding: 0;
  font-size: 13px;
  resize: none;
}

.composer .textarea:focus {
  box-shadow: none;
  border: none;
}

.composer-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

/* 列表 */
.list {
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
}

.item {
  display: flex;
  gap: 12px;
  padding: 16px 0;
}

.item + .item {
  border-top: 1px solid var(--line);
}

.avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  font-size: 11px;
  font-weight: 500;
  color: var(--brand);
  background: var(--brand-soft);
  border-radius: 50%;
  font-variant-numeric: tabular-nums;
}

.body {
  min-width: 0;
  flex: 1;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-3);
}

.name {
  color: var(--text-2);
  font-weight: 500;
}

.me {
  height: 18px;
  padding: 0 5px;
  font-size: 11px;
}

.arrow {
  color: var(--text-3);
}

.time {
  color: var(--text-3);
}

.content {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.75;
  color: var(--text-1);
  white-space: pre-wrap;
  word-break: break-word;
}

/* 操作 */
.ops {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.op {
  padding: 2px 8px;
  font-size: 12px;
  color: var(--text-3);
  background: transparent;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: color 0.15s var(--ease), background-color 0.15s var(--ease);
}

.op:hover {
  color: var(--text-1);
  background: rgba(20, 24, 31, 0.05);
}

.op--danger:hover {
  color: var(--danger);
  background: var(--danger-soft);
}

/* 回复输入 */
.reply-box {
  margin-top: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  animation: fadeUp 0.2s var(--ease) both;
}

.reply-box .textarea {
  background: transparent;
  border: none;
  padding: 0;
  font-size: 13px;
  resize: none;
}

.reply-box .textarea:focus {
  box-shadow: none;
  border: none;
}

.reply-foot {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 8px;
}

/* 楼中楼 */
.replies {
  margin: 12px 0 0;
  padding: 0 0 0 14px;
  list-style: none;
  border-left: 2px solid rgba(20, 24, 31, 0.1);
}

.reply {
  padding: 8px 0;
}

.reply + .reply {
  border-top: 1px dashed var(--line);
}

.state {
  padding: 8px 0;
}

.confirm-text {
  font-size: 13px;
  line-height: 1.75;
  color: var(--text-2);
}

@media (max-width: 640px) {
  .comments {
    padding: 18px 16px;
  }
}
</style>
