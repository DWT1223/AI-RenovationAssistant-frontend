/**
 * 存储工具
 */

/**
 * 设置存储
 * @param {string} key - 键
 * @param {any} value - 值
 */
export function setStorage(key, value) {
  uni.setStorageSync(key, value)
}

/**
 * 获取存储
 * @param {string} key - 键
 * @param {any} defaultValue - 默认值
 */
export function getStorage(key, defaultValue = null) {
  return uni.getStorageSync(key) || defaultValue
}

/**
 * 移除存储
 * @param {string} key - 键
 */
export function removeStorage(key) {
  uni.removeStorageSync(key)
}

/**
 * 清除所有存储
 */
export function clearStorage() {
  uni.clearStorageSync()
}

/**
 * 本地存储键名
 */
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_INFO: 'userInfo',
  SEARCH_HISTORY: 'searchHistory',
  RECENT_STYLES: 'recentStyles',
  SETTINGS: 'settings'
}
