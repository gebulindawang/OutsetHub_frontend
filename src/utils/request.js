import axios from 'axios'

export const TOKEN_KEY = 'outsethub_token'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
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

// 响应拦截器:直接返回响应体,并统一整理错误信息
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = '网络异常,请稍后重试'

    if (error.code === 'ECONNABORTED') {
      message = '请求超时,请稍后重试'
    } else if (error.response) {
      const { status, data } = error.response
      // 优先使用后端返回的错误信息(字段名按后端实际情况调整)
      message = data?.message || data?.msg || message

      if (status === 401) {
        localStorage.removeItem(TOKEN_KEY)
        if (location.pathname !== '/login') {
          location.href = '/login'
        }
      }
    }

    // 调用方 catch 到的是统一格式的错误对象
    return Promise.reject({
      status: error.response?.status,
      message,
      raw: error,
    })
  },
)

export default request
