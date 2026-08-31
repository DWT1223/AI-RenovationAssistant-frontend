/**
 * 账单相关API
 */
import request from './request'

/**
 * 获取账单列表
 * @param {object} params - 查询参数
 */
export function getBills(params) {
  return request.get('/api/bills', params)
}

/**
 * 获取账单详情
 * @param {number} id - 账单ID
 */
export function getBillDetail(id) {
  return request.get(`/api/bills/${id}`)
}

/**
 * 创建账单
 * @param {object} data - 账单数据
 */
export function createBill(data) {
  return request.post('/api/bills', data)
}

/**
 * 更新账单
 * @param {number} id - 账单ID
 * @param {object} data - 账单数据
 */
export function updateBill(id, data) {
  return request.put(`/api/bills/${id}`, data)
}

/**
 * 删除账单
 * @param {number} id - 账单ID
 */
export function deleteBill(id) {
  return request.delete(`/api/bills/${id}`)
}

/**
 * 获取账单统计
 * @param {object} params - 查询参数
 */
export function getBillStats(params) {
  return request.get('/api/bills/stats/summary', params)
}

/**
 * 获取预算信息
 */
export function getBudget() {
  return request.get('/api/budget')
}

/**
 * 设置/更新预算
 * @param {object} data - 预算数据
 */
export function setBudget(data) {
  return request.put('/api/budget', data)
}
