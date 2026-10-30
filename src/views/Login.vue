<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AuthLayout from '../components/AuthLayout.vue'
import { login } from '../api/user';
import { TOKEN_KEY } from '../utils/request';
const router = useRouter()
const username = ref('')
const password = ref('')
const user = ref({
  username: '',
  password: '',
})
async function loginsubmit() {
  user.username = username.value
  user.password = password.value
  try {
    const result = await login(user)
    console.log(result)
    localStorage.setItem(TOKEN_KEY, result.token)
    router.replace('/home')
  } catch (e) {
    alert(e.message || '登录失败')
  }
}
</script>

<template>
  <AuthLayout title="欢迎回来" subtitle="登录你的起点社区账号">
    <form class="form" novalidate @submit.prevent="loginsubmit">
      <div class="field">
        <label for="username">用户名 / 邮箱</label>
        <input
          id="username"
          name="username"
          type="text"
          placeholder="请输入用户名或邮箱"
          autocomplete="username"
          v-model="username"
        />
        <p class="error" hidden></p>
      </div>

      <div class="field">
        <label for="password">密码</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="请输入密码"
          autocomplete="current-password"
          v-model="password"
        />
        <p class="error" hidden></p>
      </div>

      <div class="row">
        <label class="checkbox">
          <input type="checkbox" name="remember" />
          <span>记住我</span>
        </label>
        <a href="#" class="link">忘记密码?</a>
      </div>

      <button type="submit" class="btn-primary">登录</button>

      <p class="switch">
        还没有账号?
        <router-link to="/register">立即注册</router-link>
      </p>
    </form>
  </AuthLayout>
</template>

<style scoped src="../assets/auth-form.css"></style>
