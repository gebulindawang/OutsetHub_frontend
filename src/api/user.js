import request from '../utils/request'

/** 登录,成功返回 { msg, token } */
export function login(data) {
  return request.post('/user/login', data)
}

/** 注册,成功返回 { msg } */
export function register(data) {
  return request.post('/user/register', data)
}

/** 当前登录用户 { msg, data: { id, username, nickname, role } } */
export function userInfo() {
  return request.get('/user/me')
}
