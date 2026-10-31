import request from '../utils/request'

/** 板块列表:按 sort 升序,登录用户可读 */
export function listCategories() {
  return request.get('/category/')
}

/* 以下三个仅管理员(role=1)可调用 */

export function createCategory(data) {
  return request.post('/category/', data)
}

export function updateCategory(id, data) {
  return request.put(`/category/${id}`, data)
}

export function removeCategory(id) {
  return request.delete(`/category/${id}`)
}
