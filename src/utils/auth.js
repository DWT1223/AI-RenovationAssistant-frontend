/**
 * 认证相关工具
 */

// 获取Token
export function getToken() {
  return uni.getStorageSync('token')
}

// 设置Token
export function setToken(token) {
  uni.setStorageSync('token', token)
}

// 清除Token
export function clearToken() {
  uni.removeStorageSync('token')
}

// 获取用户信息
export function getUserInfo() {
  return uni.getStorageSync('userInfo') || null
}

// 设置用户信息
export function setUserInfo(userInfo) {
  uni.setStorageSync('userInfo', userInfo)
}

// 清除用户信息
export function clearUserInfo() {
  uni.removeStorageSync('userInfo')
}

// 检查是否登录
export function isLogin() {
  return !!getToken()
}

// 微信登录获取code
export function wechatLoginCode() {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (res) => {
        if (res.code) {
          resolve(res.code)
        } else {
          reject(new Error('微信登录失败'))
        }
      },
      fail: (err) => {
        console.error('微信登录失败', err)
        reject(new Error('微信登录失败'))
      }
    })
  })
}

// 退出登录
export function logout() {
  clearToken()
  clearUserInfo()
  uni.reLaunch({
    url: '/pages/index/index'
  })
}
