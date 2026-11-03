import request from '../utils/request'

/**
 * 评论接口
 * 结构约定:两级,不做无限嵌套
 *   parent_id = 0        → 顶级评论
 *   parent_id = 顶层评论  → 楼中楼回复,固定挂在该顶层评论下
 *   reply_to_user_id     → 被回复人,用于渲染「回复 #n」
 */

/** 某篇文章的评论列表,只返回 status=1,按时间升序 */
export function listComments(articleId) {
  return request.get('/comment/', { params: { article_id: articleId } })
}

/** 发表评论或回复 */
export function createComment(data) {
  return request.post('/comment/', data)
}

/** 修改评论内容 */
export function updateComment(id, content) {
  return request.put(`/comment/${id}`, { content })
}

/** 软删除,status 置 2 */
export function removeComment(id) {
  return request.delete(`/comment/${id}`)
}
