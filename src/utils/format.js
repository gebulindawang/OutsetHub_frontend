/** 相对时间:1 分钟内刚刚,1 小时内 x 分钟前,24 小时内 x 小时前,7 天内 x 天前,再早就显示日期 */
export function formatTime(input) {
  if (!input) return ''
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return ''

  const diff = Date.now() - date.getTime()
  const min = 60 * 1000
  const hour = 60 * min
  const day = 24 * hour

  if (diff < 0) return formatDate(date, true)
  if (diff < min) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / min)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`
  return formatDate(date)
}

export function formatDate(date, withTime = false) {
  const pad = (n) => String(n).padStart(2, '0')
  const base = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  return withTime ? `${base} ${pad(date.getHours())}:${pad(date.getMinutes())}` : base
}

/** 大数字缩写:1200 → 1.2k,12000 → 1.2w */
export function formatCount(n) {
  const num = Number(n) || 0
  if (num < 1000) return String(num)
  if (num < 10000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return `${(num / 10000).toFixed(1).replace(/\.0$/, '')}w`
}

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )
}

function inline(text) {
  return text
    .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a class="md-link" href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    )
}

/**
 * 极简 Markdown → HTML
 * 支持:标题、粗体、斜体、行内代码、代码块、引用、有序/无序列表、链接
 * 先整体转义再解析,不引入第三方依赖,输出可直接 v-html
 */
export function renderMarkdown(source = '') {
  const lines = escapeHtml(source).split(/\r?\n/)
  const out = []
  let inCode = false
  let listTag = null

  const closeList = () => {
    if (listTag) {
      out.push(`</${listTag}>`)
      listTag = null
    }
  }

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      closeList()
      out.push(inCode ? '</code></pre>' : '<pre class="md-pre"><code>')
      inCode = !inCode
      continue
    }

    if (inCode) {
      out.push(line)
      continue
    }

    if (!line.trim()) {
      closeList()
      continue
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/)
    if (heading) {
      closeList()
      const level = Math.min(heading[1].length + 1, 5)
      out.push(`<h${level} class="md-h">${inline(heading[2])}</h${level}>`)
      continue
    }

    const quote = line.match(/^&gt;\s?(.*)$/)
    if (quote) {
      closeList()
      out.push(`<blockquote class="md-quote">${inline(quote[1])}</blockquote>`)
      continue
    }

    const unordered = line.match(/^[-*+]\s+(.*)$/)
    if (unordered) {
      if (listTag !== 'ul') {
        closeList()
        out.push('<ul class="md-list">')
        listTag = 'ul'
      }
      out.push(`<li>${inline(unordered[1])}</li>`)
      continue
    }

    const ordered = line.match(/^\d+\.\s+(.*)$/)
    if (ordered) {
      if (listTag !== 'ol') {
        closeList()
        out.push('<ol class="md-list">')
        listTag = 'ol'
      }
      out.push(`<li>${inline(ordered[1])}</li>`)
      continue
    }

    closeList()
    out.push(`<p class="md-p">${inline(line)}</p>`)
  }

  closeList()
  if (inCode) out.push('</code></pre>')
  return out.join('\n')
}
