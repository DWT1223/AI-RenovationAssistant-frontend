/**
 * 收藏相关API
 */
import request from './request'

/**
 * 获取收藏列表
 * @param {object} params - 查询参数
 */
export function getCollects(params) {
  return request.get('/api/collects', params)
}

/**
 * 添加收藏
 * @param {object} data - 收藏数据
 */
export function createCollect(data) {
  return request.post('/api/collects', data)
}

/**
 * 取消收藏
 * @param {number} id - 收藏ID
 */
export function deleteCollect(id) {
  return request.delete(`/api/collects/${id}`)
}
