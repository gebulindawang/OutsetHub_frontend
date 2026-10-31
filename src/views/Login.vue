<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthLayout from '../components/AuthLayout.vue'
import { useAuth } from '../composables/useAuth'
import { useToast } from '../composables/useToast'

const route = useRoute()
const router = useRouter()
const { signIn } = useAuth()
const { success, error } = useToast()

const form = ref({ username: '', password: '' })
const submitting = ref(false)
const formError = ref('')

onMounted(() => {
  if (route.query.expired) error('登录状态已过期,请重新登录')
  if (route.query.registered) success('注册成功,请登录')
})

async function submit() {
  formError.value = ''

  if (!form.value.username.trim()) {
    formError.value = '请输入用户名'
    return
  }
  if (!form.value.password) {
    formError.value = '请输入密码'
    return
  }
  if (submitting.value) return

  submitting.value = true
  try {
    await signIn({
      username: form.value.username.trim(),
      password: form.value.password,
    })
    success('登录成功')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/home'
    router.replace(redirect)
  } catch (err) {
    formError.value = err.message || '登录失败,请重试'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout title="欢迎回来" subtitle="登录你的起点社区账号">
    <form class="form" novalidate @submit.prevent="submit">
      <div class="field">
        <label for="username">用户名</label>
        <input
          id="username"
          v-model="form.username"
          class="input"
          type="text"
          placeholder="请输入用户名"
          autocomplete="username"
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
          placeholder="请输入密码"
          autocomplete="current-password"
          :disabled="submitting"
        />
      </div>

      <Transition name="err">
        <p v-if="formError" class="form-error">{{ formError }}</p>
      </Transition>

      <button class="btn btn--primary btn--block submit" type="submit" :disabled="submitting">
        <span v-if="submitting" class="spinner"></span>
        {{ submitting ? '登录中' : '登录' }}
      </button>

      <p class="foot">
        还没有账号?
        <RouterLink to="/register">立即注册</RouterLink>
      </p>
    </form>
  </AuthLayout>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
