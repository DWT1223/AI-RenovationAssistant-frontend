/**
 * 装修风格相关API
 */
import request from './request'

/**
 * 获取风格列表
 * @param {object} params - 查询参数
 */
export function getStyles(params) {
  return request.get('/api/styles', params)
}

/**
 * 获取所有风格（不分页）
 */
export function getAllStyles() {
  return request.get('/api/styles/all')
}

/**
 * 获取风格详情
 * @param {number} id - 风格ID
 */
export function getStyleDetail(id) {
  return request.get(`/api/styles/${id}`)
}
