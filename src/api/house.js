/**
 * 户型图相关API
 */
import request from './request'

/**
 * 获取户型图列表
 * @param {object} params - 查询参数
 */
export function getHouseImgs(params) {
  return request.get('/api/house-imgs', params)
}

/**
 * 创建户型图记录
 * @param {object} data - 户型图数据
 */
export function createHouseImg(data) {
  return request.post('/api/house-imgs', data)
}

/**
 * 删除户型图
 * @param {number} id - 户型图ID
 */
export function deleteHouseImg(id) {
  return request.delete(`/api/house-imgs/${id}`)
}

/**
 * 上传图片
 * @param {string} filePath - 文件路径
 */
export function uploadImage(filePath) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:8000'
      : ''

    uni.uploadFile({
      url: `${baseUrl}/api/upload`,
      filePath,
      name: 'file',
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.code === 0) {
            resolve(data.data)
          } else {
            reject(new Error(data.msg || '上传失败'))
          }
        } catch (e) {
          reject(new Error('解析响应失败'))
        }
      },
      fail: (err) => {
        console.error('上传失败', err)
        reject(new Error('上传失败'))
      }
    })
  })
}
