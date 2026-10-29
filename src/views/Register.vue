<script setup>
import AuthLayout from '../components/AuthLayout.vue'
</script>

<template>
  <AuthLayout title="创建账号" subtitle="加入起点社区,开启你的旅程">
    <form class="form" novalidate>
      <div class="field">
        <label for="username">用户名</label>
        <input
          id="username"
          name="username"
          type="text"
          placeholder="请输入用户名"
          autocomplete="username"
        />
        <p class="error" hidden></p>
      </div>

      <div class="field">
        <label for="email">邮箱</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="请输入邮箱"
          autocomplete="email"
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
          autocomplete="new-password"
        />
        <p class="error" hidden></p>
      </div>

      <div class="field">
        <label for="confirmPassword">确认密码</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="请再次输入密码"
          autocomplete="new-password"
        />
        <p class="error" hidden></p>
      </div>

      <button type="submit" class="btn-primary">注册</button>

      <p class="switch">
        已有账号?
        <router-link to="/login">去登录</router-link>
      </p>
    </form>
  </AuthLayout>
</template>

<style scoped src="../assets/auth-form.css"></style>
