/**
 * AI相关API
 */
import request from './request'

/**
 * 生成装修方案
 * @param {object} data - 生成参数
 */
export function generatePlan(data) {
  return request.post('/api/ai/plan', data)
}

/**
 * 生成渲染图
 * @param {object} data - 生成参数
 */
export function generateRender(data) {
  return request.post('/api/ai/render', data)
}

/**
 * 查询任务状态
 * @param {string} taskId - 任务ID
 */
export function getTaskStatus(taskId) {
  return request.get(`/api/ai/tasks/${taskId}`)
}

/**
 * 获取AI生成历史
 * @param {object} params - 查询参数
 */
export function getAIRecords(params) {
  return request.get('/api/ai/records', params)
}

/**
 * 保存渲染图记录（Form格式）
 * @param {object} data - 记录数据
 */
export function saveRenderRecord(data) {
  return request.post('/api/ai/render/save', data, {
    header: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}

/**
 * 保存渲染图记录（JSON格式，支持大数据）
 * @param {object} data - 记录数据
 */
export function saveRenderRecordJson(data) {
  return request.post('/api/ai/render/save-json', data)
}

/**
 * 获取渲染图历史
 * @param {object} params - 查询参数
 */
export function getRenderRecords(params) {
  return request.get('/api/ai/render/records', params)
}

/**
 * 获取渲染图记录详情
 * @param {number} recordId - 记录ID
 */
export function getRenderRecordDetail(recordId) {
  return request.get(`/api/ai/render/records/${recordId}`)
}

/**
 * 删除AI记录
 * @param {number} recordId - 记录ID
 */
export function deleteAIRecord(recordId) {
  return request.delete(`/api/ai/records/${recordId}`)
}
