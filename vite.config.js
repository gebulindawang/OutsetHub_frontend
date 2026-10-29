import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // 开发环境代理:浏览器请求同源的 5173,由 Vite 转发到 Go 后端,避免跨域
    // 后端新增了接口前缀(如 /post、/user)时,在这里补一行即可
    proxy: {
      '/user': 'http://localhost:8080',
    },
  },
})
