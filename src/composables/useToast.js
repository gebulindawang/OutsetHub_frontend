import { reactive } from 'vue'

/** 全局轻提示,消息队列,由 ToastHost 渲染 */
const items = reactive([])
let seq = 0

function remove(id) {
  const index = items.findIndex((item) => item.id === id)
  if (index > -1) items.splice(index, 1)
}

function push(message, type = 'info', duration = 2400) {
  if (!message) return
  const id = ++seq
  items.push({ id, message, type })
  if (duration > 0) {
    setTimeout(() => remove(id), duration)
  }
  return id
}

export function useToast() {
  return {
    items,
    remove,
    toast: push,
    success: (msg, duration) => push(msg, 'success', duration),
    error: (msg, duration) => push(msg, 'error', duration ?? 3200),
  }
}
