import axios from 'axios'

export const TOKEN_KEY = 'outsethub_token'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
})

// 请求拦截器:自动携带 token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

/**
 * 统一错误对象:{ status, message, raw }
 * 后端字段约定:
 *   - 业务错误 400/403/404 → { msg, err }
 *   - 中间件错误 401/403   → { code, msg }
 */
function normalizeError(error) {
  if (error.code === 'ECONNABORTED') {
    return { status: undefined, message: '请求超时,请检查后端是否在运行', raw: error }
  }

  const response = error.response
  if (!response) {
    return { status: undefined, message: '网络异常,无法连接到服务器', raw: error }
  }

  const { status, data } = response
  const message =
    (typeof data === 'object' && data && (data.msg || data.err || data.message)) ||
    (status === 401
      ? '登录已过期,请重新登录'
      : status === 403
        ? '没有操作权限'
        : status === 404
          ? '资源不存在'
          : status >= 500
            ? '服务端异常,请稍后重试'
            : '请求失败')

  return { status, message, raw: error }
}

// 响应拦截器:直接返回响应体
request.interceptors.response.use(
  (response) => {
    const contentType = response.headers['content-type'] || ''
    // 代理没配好时,Vite 会回退返回 index.html,提前拦下比让调用方拿到一串 HTML 好排查
    if (contentType.includes('text/html')) {
      return Promise.reject({
        status: response.status,
        message: '接口返回了 HTML,请检查 vite proxy 与接口路径',
        raw: response,
      })
    }
    return response.data
  },
  (error) => {
    const normalized = normalizeError(error)

    if (normalized.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      const onLoginPage = location.pathname.startsWith('/login')
      if (!onLoginPage) {
        const redirect = encodeURIComponent(location.pathname + location.search)
        location.replace(`/login?redirect=${redirect}&expired=1`)
      }
    }

    return Promise.reject(normalized)
  },
)

export default request
