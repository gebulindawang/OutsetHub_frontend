import { computed, ref } from 'vue'
import { login as loginApi, userInfo } from '../api/user'
import { TOKEN_KEY } from '../utils/request'

/**
 * 全局登录态。模块级单例,不引入 Pinia:
 * 组件里随时 useAuth() 拿到的都是同一份 token / user。
 */
const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const user = ref(null)
const loading = ref(false)

let inflight = null

function setToken(value) {
  token.value = value || ''
  if (value) {
    localStorage.setItem(TOKEN_KEY, value)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

function clear() {
  setToken('')
  user.value = null
  inflight = null
}

/** 拉取当前用户,并发调用会复用同一个请求 */
async function fetchMe(force = false) {
  if (!token.value) return null
  if (user.value && !force) return user.value
  if (inflight) return inflight

  loading.value = true
  inflight = userInfo()
    .then((res) => {
      user.value = res.data
      return user.value
    })
    .catch((err) => {
      if (err.status === 401) clear()
      throw err
    })
    .finally(() => {
      loading.value = false
      inflight = null
    })

  return inflight
}

/** 登录:写入 token 后立刻拉一次用户信息,失败不阻断登录流程 */
async function signIn(payload) {
  const res = await loginApi(payload)
  setToken(res.token)
  try {
    await fetchMe(true)
  } catch {
    /* /user/me 失败不影响已拿到的 token,后续请求会带着它 */
  }
  return res
}

function signOut() {
  clear()
}

export function useAuth() {
  return {
    token,
    user,
    loading,
    isLogin: computed(() => Boolean(token.value)),
    isAdmin: computed(() => user.value?.role === 1),
    displayName: computed(() => user.value?.nickname || user.value?.username || '未登录'),
    fetchMe,
    signIn,
    signOut,
  }
}
