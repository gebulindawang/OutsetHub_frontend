import request from '../utils/request'

/**
 * 文章接口
 * 注意:后端注册的是 rg.GET("/") / rg.POST("/"),即真实路径带尾斜杠(/api/article/),
 * 不带斜杠会先吃一个 301 跳转。
 */

/** 列表:已发布(status=1),created_at 倒序,后端固定 limit 10 */
export function listArticles() {
  return request.get('/article/')
}

/** 详情:草稿也能取到,由前端按 status 判断是否提示 */
export function getArticle(id) {
  return request.get(`/article/${id}`)
}

/** 创建:title / content / category_id 必填,status 不传默认 1 已发布 */
export function createArticle(data) {
  return request.post('/article/', data)
}

/** 部分更新,只传要改的字段;后端校验作者本人 */
export function updateArticle(id, data) {
  return request.put(`/article/${id}`, data)
}

/** 软删除,status 置 2 */
export function removeArticle(id) {
  return request.delete(`/article/${id}`)
}
