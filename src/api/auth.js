/**
 * 认证相关API
 */
import request from './request'

/**
 * 微信登录
 * @param {string} code - 微信登录code
 */
export function wechatLogin(code) {
  return request.post('/api/auth/login', { code })
}

/**
 * 登录（别名）
 * @param {string} code - 微信登录code
 */
export const login = wechatLogin

/**
 * 账号密码登录
 * @param {string} username - 用户名或手机号
 * @param {string} password - 密码
 */
export function accountLogin(username, password) {
  return request.post('/api/auth/account-login', { username, password })
}

/**
 * 注册
 * @param {object} data - 注册信息
 */
export function register(data) {
  return request.post('/api/auth/register', data)
}

/**
 * 重置密码
 * @param {object} data - 重置信息 {phone, code, password}
 */
export function resetPassword(data) {
  return request.post('/api/auth/reset-password', data)
}

/**
 * 发送短信验证码
 * @param {string} phone - 手机号
 * @param {string} scene - 场景 (register/reset/login)
 */
export function sendSmsCode(phone, scene) {
  return request.post('/api/auth/sms-code', { phone, scene })
}

/**
 * 获取用户信息
 */
export function getUserProfile() {
  return request.get('/api/user/profile')
}

/**
 * 更新用户信息
 * @param {object} data - 用户信息
 */
export function updateUserProfile(data) {
  return request.put('/api/user/profile', data)
}
