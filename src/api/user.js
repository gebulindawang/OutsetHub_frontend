import request from '../utils/request'

/**
 * 登录
 * @param {{ username: string, password: string }} data
 */
export function login(data) {
  return request.post('/user/login', data)
}

/**
 * 注册
 * @param {{ username: string, email: string, password: string }} data
 */
export function register(data) {
  return request.post('/auth/register', data)
}
