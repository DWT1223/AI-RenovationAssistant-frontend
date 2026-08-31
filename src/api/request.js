/**
 * 请求封装
 */
import { getToken } from '../utils/auth'

// API基础地址
// H5开发环境使用相对路径或代理
const BASE_URL = process.env.NODE_ENV === 'development' ? '' : 'http://localhost:8000'

/**
 * 将对象转换为 form-urlencoded 格式
 */
function toFormUrlEncoded(data) {
  const params = new URLSearchParams()
  for (const key in data) {
    if (data[key] !== undefined && data[key] !== null) {
      params.append(key, String(data[key]))
    }
  }
  return params.toString()
}

class Request {
  constructor() {
    this.baseURL = BASE_URL
    this.timeout = 30000
  }

  /**
   * 请求拦截
   */
  request(options) {
    return new Promise((resolve, reject) => {
      const token = getToken()

      let data = options.data
      const header = {
        'Content-Type': 'application/json',
        ...options.header
      }

      // 如果是 form-urlencoded 格式，转换数据
      if (header['Content-Type'] === 'application/x-www-form-urlencoded') {
        data = toFormUrlEncoded(data)
      }

      // 添加Token
      if (token) {
        header['Authorization'] = `Bearer ${token}`
      }

      console.log('请求:', options.method, options.url, options.data)

      uni.request({
        url: this.baseURL + options.url,
        method: options.method || 'GET',
        data: data,
        header,
        timeout: this.timeout,
        success: (res) => {
          console.log('响应:', res.statusCode, res.data)
          const { statusCode, data } = res

          if (statusCode === 200) {
            // 检查响应内容
            if (data && data.code === 0) {
              resolve(data.data)
            } else if (data && data.code === 401) {
              this.handleUnauthorized(data.msg || '登录已过期')
              reject(new Error(data.msg || '登录已过期'))
            } else if (data && data.detail) {
              // FastAPI 返回的 401 格式 {"detail": "请先登录"}
              this.handleUnauthorized(data.detail)
              reject(new Error(data.detail || '请先登录'))
            } else if (data && data.code !== 0) {
              uni.showToast({
                title: data.msg || '请求失败',
                icon: 'none'
              })
              reject(new Error(data.msg || '请求失败'))
            } else {
              resolve(data)
            }
          } else if (statusCode === 401) {
            this.handleUnauthorized(data?.detail || '请先登录')
            reject(new Error(data?.detail || '请先登录'))
          } else {
            this.handleError(statusCode)
            reject(new Error(`请求失败: ${statusCode}`))
          }
        },
        fail: (err) => {
          console.error('请求失败:', err)
          uni.showToast({
            title: '网络连接失败',
            icon: 'none'
          })
          reject(new Error('网络请求失败'))
        }
      })
    })
  }

  /**
   * GET请求
   */
  get(url, data, options = {}) {
    return this.request({
      url,
      method: 'GET',
      data,
      ...options
    })
  }

  /**
   * POST请求
   */
  post(url, data, options = {}) {
    return this.request({
      url,
      method: 'POST',
      data,
      ...options
    })
  }

  /**
   * PUT请求
   */
  put(url, data, options = {}) {
    return this.request({
      url,
      method: 'PUT',
      data,
      ...options
    })
  }

  /**
   * DELETE请求
   */
  delete(url, data, options = {}) {
    return this.request({
      url,
      method: 'DELETE',
      data,
      ...options
    })
  }

  /**
   * 处理Token过期/未登录
   */
  handleUnauthorized(message) {
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
    uni.showToast({
      title: message || '请先登录',
      icon: 'none'
    })
    setTimeout(() => {
      uni.navigateTo({
        url: '/pages/user/login'
      })
    }, 1500)
  }

  /**
   * 处理错误
   */
  handleError(statusCode) {
    let message = '网络请求失败'
    if (statusCode === 404) {
      message = '请求资源不存在'
    } else if (statusCode === 500) {
      message = '服务器内部错误'
    } else if (!statusCode) {
      message = '网络连接失败'
    }
    uni.showToast({
      title: message,
      icon: 'none'
    })
  }
}

export default new Request()
