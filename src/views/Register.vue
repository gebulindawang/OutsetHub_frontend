<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '../components/AuthLayout.vue'
import { register } from '../api/user'
import { useToast } from '../composables/useToast'

const router = useRouter()
const { success } = useToast()

const form = ref({ username: '', nickname: '', password: '', confirm: '' })
const submitting = ref(false)
const formError = ref('')

function validate() {
  if (!form.value.username.trim()) return '请输入用户名'
  if (form.value.username.trim().length < 3) return '用户名至少 3 个字符'
  if (!form.value.password) return '请输入密码'
  if (form.value.password.length < 6) return '密码至少 6 位'
  if (form.value.password !== form.value.confirm) return '两次输入的密码不一致'
  return ''
}

async function submit() {
  formError.value = validate()
  if (formError.value || submitting.value) return

  submitting.value = true
  try {
    await register({
      username: form.value.username.trim(),
      nickname: form.value.nickname.trim(),
      password: form.value.password,
    })
    success('注册成功,请登录')
    router.replace('/login')
  } catch (err) {
    formError.value = err.message || '注册失败,请重试'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout title="创建账号" subtitle="加入起点社区,开启你的旅程">
    <form class="form" novalidate @submit.prevent="submit">
      <div class="field">
        <label for="username">用户名</label>
        <input
          id="username"
          v-model="form.username"
          class="input"
          type="text"
          placeholder="登录用,3-50 个字符"
          autocomplete="username"
          :disabled="submitting"
        />
      </div>

      <div class="field">
        <label for="nickname">昵称</label>
        <input
          id="nickname"
          v-model="form.nickname"
          class="input"
          type="text"
          placeholder="展示用,留空则显示用户名"
          autocomplete="nickname"
          :disabled="submitting"
        />
      </div>

      <div class="field">
        <label for="password">密码</label>
        <input
          id="password"
          v-model="form.password"
          class="input"
          type="password"
          placeholder="至少 6 位"
          autocomplete="new-password"
          :disabled="submitting"
        />
      </div>

      <div class="field">
        <label for="confirm">确认密码</label>
        <input
          id="confirm"
          v-model="form.confirm"
          class="input"
          type="password"
          placeholder="再输入一次"
          autocomplete="new-password"
          :disabled="submitting"
        />
      </div>

      <Transition name="err">
        <p v-if="formError" class="form-error">{{ formError }}</p>
      </Transition>

      <button class="btn btn--primary btn--block submit" type="submit" :disabled="submitting">
        <span v-if="submitting" class="spinner"></span>
        {{ submitting ? '提交中' : '注册' }}
      </button>

      <p class="foot">
        已有账号?
        <RouterLink to="/login">去登录</RouterLink>
      </p>
    </form>
  </AuthLayout>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.submit {
  height: 40px;
  margin-top: 4px;
}

.foot {
  font-size: 13px;
  color: var(--text-3);
  text-align: center;
}

.foot a {
  margin-left: 4px;
  color: var(--brand);
  font-weight: 500;
}

.foot a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.err-enter-active,
.err-leave-active {
  transition: opacity 0.18s var(--ease), transform 0.18s var(--ease);
}

.err-enter-from,
.err-leave-to {
  opacity: 0;
  transform: translateY(-3px);
}
</style>
